/**
 * @vitest-environment node
 */
import {
  buildChatTokenQuota,
  consumeChatTokens,
  verifyChatTokenQuota,
  getActiveAccessPass,
  getUserTokenBalance,
  verifyJobApplicationLimit
} from "./quota"
import { createClient } from "@/lib/supabase/server"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server")

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>

const buildAccessPassQueryMock = (result: { data: any; error: any }) => ({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue(result)
    })
  })
})

describe("getActiveAccessPass", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the access pass when it has remaining chat tokens", async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue(
        buildAccessPassQueryMock({
          data: {
            id: "active-pass",
            user_id: "user-id",
            plan: "LITE",
            created_at: "2025-01-01",
            quota_chat_tokens: 500_000,
            used_chat_tokens: 120_000
          },
          error: null
        })
      )
    } as unknown as ReturnType<typeof createClient>)

    const result = await getActiveAccessPass("user-id")

    expect(result?.id).toBe("active-pass")
    expect(result?.plan).toBe("LITE")
  })

  it("returns null when no pass has remaining chat tokens", async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue(
        buildAccessPassQueryMock({
          data: {
            id: "exhausted-pass",
            user_id: "user-id",
            plan: "PRO",
            created_at: "2025-02-01",
            quota_chat_tokens: 1_000_000,
            used_chat_tokens: 1_000_000
          },
          error: null
        })
      )
    } as unknown as ReturnType<typeof createClient>)

    await expect(getActiveAccessPass("user-id")).resolves.toBeNull()
  })
})

describe("getUserTokenBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns token balance data for the active pass", async () => {
    const mockFrom = vi.fn().mockReturnValue(
      buildAccessPassQueryMock({
        data: {
          id: "pass-id",
          user_id: "user-id",
          plan: "PRO" as const,
          created_at: "2025-01-01",
          quota_chat_tokens: 1_000_000,
          used_chat_tokens: 12_345
        },
        error: null
      })
    )

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: mockFrom
    } as unknown as ReturnType<typeof createClient>)

    await expect(getUserTokenBalance()).resolves.toEqual({
      plan: "PRO",
      chatTokenLimit: 1_000_000,
      chatTokenUsed: 12_345,
      chatTokenRemaining: 987_655
    })
  })

  it("returns zeroed token balance when no pass is active", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue(
        buildAccessPassQueryMock({
          data: null,
          error: null
        })
      )
    } as unknown as ReturnType<typeof createClient>)

    await expect(getUserTokenBalance()).resolves.toEqual({
      plan: null,
      chatTokenLimit: 0,
      chatTokenUsed: 0,
      chatTokenRemaining: 0
    })
  })
})

describe("chat token helpers", () => {
  it("preserves larger purchased chat token quotas", () => {
    expect(
      buildChatTokenQuota({
        id: "pass-id",
        user_id: "user-id",
        plan: "PRO",
        created_at: "2025-01-01",
        quota_chat_tokens: 2_000_000,
        used_chat_tokens: 10_000
      } as any)
    ).toEqual({
      limit: 2_000_000,
      used: 10_000
    })
  })

  it("upgrades legacy plan quotas to the configured minimum", () => {
    expect(
      buildChatTokenQuota({
        id: "legacy-pass",
        user_id: "user-id",
        plan: "PRO",
        created_at: "2025-01-01",
        quota_chat_tokens: 100_000,
        used_chat_tokens: 25_000
      } as any)
    ).toEqual({
      limit: 1_000_000,
      used: 25_000
    })
  })

  it("throws when chat token quota is exhausted", () => {
    expect(() => verifyChatTokenQuota(100, 100)).toThrow(
      "Chat token limit reached"
    )
  })

  it("increments used chat tokens with optimistic update", async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                plan: "PRO",
                quota_chat_tokens: 1_000,
                used_chat_tokens: 500
              },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { used_chat_tokens: 600 },
                  error: null
                })
              })
            })
          })
        })
      })
    } as unknown as ReturnType<typeof createClient>)

    await expect(consumeChatTokens("pass-id", 100)).resolves.toBe(600)
  })

  it("does not consume tokens when the remaining quota is insufficient", async () => {
    const update = vi.fn()

    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                plan: "CUSTOM",
                quota_chat_tokens: 550,
                used_chat_tokens: 500
              },
              error: null
            })
          })
        }),
        update
      })
    } as unknown as ReturnType<typeof createClient>)

    await expect(consumeChatTokens("pass-id", 100)).resolves.toBe(500)
    expect(update).not.toHaveBeenCalled()
  })
})

describe("verifyJobApplicationLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("passes when under the limit", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: "app-1" }, { id: "app-2" }],
            error: null
          })
        })
      })
    } as unknown as ReturnType<typeof createClient>)

    await expect(verifyJobApplicationLimit()).resolves.toBeUndefined()
  })

  it("throws when the user reaches the limit", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: Array(20).fill({ id: "app" }),
            error: null
          })
        })
      })
    } as unknown as ReturnType<typeof createClient>)

    await expect(verifyJobApplicationLimit()).rejects.toThrow(
      "You have reached the maximum job application limit"
    )
  })
})
