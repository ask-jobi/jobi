/**
 * @vitest-environment node
 */
import { GET } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as chatHistoryModule from "@/lib/agent/chat-history"
import * as supabaseModule from "@/lib/supabase/server"
import * as quotaModule from "@/server/quota"

vi.mock("@/lib/supabase/server")
vi.mock("@/lib/agent/chat-history")
vi.mock("@/server/quota")

describe("GET /api/chat-sessions/[id]/token-usage", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockSupabaseClient = {
      auth: {
        getClaims: vi.fn()
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: "PGRST116" }
                  })
                })
              })
            })
          })
        })
      })
    } as any
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    vi.mocked(mockSupabaseClient.auth.getClaims).mockResolvedValue({
      data: { claims: { sub: "test-user-id" } },
      error: null
    })

    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(true)
    vi.mocked(chatHistoryModule.getSessionTokenUsage).mockResolvedValue({
      sessionId: "session-1",
      totalTokens: 150,
      totalInputTokens: 100,
      totalOutputTokens: 30,
      totalCachedTokens: 15,
      totalReasoningTokens: 5,
      messages: [
        {
          id: "msg-1",
          role: "user",
          createdAt: "2024-01-01T00:00:00Z",
          tokenCount: 100,
          inputTokens: 100,
          outputTokens: 0,
          cachedTokens: 0,
          reasoningTokens: 0
        },
        {
          id: "msg-2",
          role: "assistant",
          createdAt: "2024-01-01T00:00:10Z",
          tokenCount: 50,
          inputTokens: 0,
          outputTokens: 30,
          cachedTokens: 15,
          reasoningTokens: 5
        }
      ]
    })

    vi.mocked(quotaModule.getActiveAccessPass).mockResolvedValue(null)
    vi.mocked(quotaModule.buildChatTokenQuota).mockReturnValue({
      limit: 0,
      used: 0
    })

    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = () => {
    return new NextRequest(
      "http://localhost:3000/api/chat-sessions/session-1/token-usage"
    )
  }

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(supabaseModule.createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new Error("Not authenticated")
        })
      },
      from: vi.fn()
    } as any)

    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(401)
  })

  it("should return 403 when user does not own the session", async () => {
    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(false)

    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(403)
  })

  it("should return token usage data on success", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.totalTokens).toBe(150)
    expect(data.data.totalCachedTokens).toBe(15)
    expect(data.data.chatTokenLimit).toBe(0)
    expect(data.data.usedChatTokens).toBe(0)
    expect(data.data.messages).toHaveLength(2)
    expect(data.data.messages[1].reasoningTokens).toBe(5)
  })

  it("should call getSessionTokenUsage with sessionId", async () => {
    const params = Promise.resolve({ id: "session-1" })
    await GET(createMockRequest(), { params })

    expect(
      vi.mocked(chatHistoryModule.getSessionTokenUsage)
    ).toHaveBeenCalledWith("session-1")
  })

  it("should return 500 on internal error", async () => {
    vi.mocked(chatHistoryModule.getSessionTokenUsage).mockRejectedValue(
      new Error("Database error")
    )

    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe("Database error")
  })
})
