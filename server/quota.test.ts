/**
 * @vitest-environment node
 */
import {
  buildQuotas,
  verifyAndUpdateQuota,
  verifyQuota,
  getActiveAccessPass,
  getUserSubscription,
  consumeQuota,
  verifyJobApplicationLimit,
  Quota
} from "./quota"
import { createClient } from "@/lib/supabase/server"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server")

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>

describe("verifyAndUpdateQuota", () => {
  it("should return update params when used is less than total", () => {
    const result = verifyAndUpdateQuota("fullOptimize", {
      fullOptimize: {
        total: 10,
        used: 5,
        colName: "full_optimize" as const
      },
      blockOptimize: {
        total: 20,
        used: 10,
        colName: "block_optimize" as const
      },
      motivationLetter: {
        total: 5,
        used: 2,
        colName: "motivation_letter" as const
      }
    })

    expect(result).toEqual({
      used_full_optimize: 6
    })
  })

  it("should throw error when quota is exhausted", () => {
    const quotas = {
      fullOptimize: {
        total: 10,
        used: 10,
        colName: "full_optimize" as const
      },
      blockOptimize: {
        total: 20,
        used: 10,
        colName: "block_optimize" as const
      },
      motivationLetter: {
        total: 5,
        used: 2,
        colName: "motivation_letter" as const
      }
    }

    expect(() => verifyAndUpdateQuota("fullOptimize", quotas)).toThrow(
      "Limit reached"
    )
  })

  it("should work with blockOptimize type", () => {
    const quotas = {
      fullOptimize: {
        total: 10,
        used: 5,
        colName: "full_optimize" as const
      },
      blockOptimize: {
        total: 20,
        used: 15,
        colName: "block_optimize" as const
      },
      motivationLetter: {
        total: 5,
        used: 2,
        colName: "motivation_letter" as const
      }
    }

    const result = verifyAndUpdateQuota("blockOptimize", quotas)
    expect(result).toEqual({
      used_block_optimize: 16
    })
  })

  it("should work with motivationLetter type", () => {
    const quotas = {
      fullOptimize: {
        total: 10,
        used: 5,
        colName: "full_optimize" as const
      },
      blockOptimize: {
        total: 20,
        used: 10,
        colName: "block_optimize" as const
      },
      motivationLetter: {
        total: 5,
        used: 4,
        colName: "motivation_letter" as const
      }
    }

    const result = verifyAndUpdateQuota("motivationLetter", quotas)
    expect(result).toEqual({
      used_motivation_letter: 5
    })
  })

  it("should throw error when used equals total", () => {
    const quotas = {
      fullOptimize: {
        total: 10,
        used: 10,
        colName: "full_optimize" as const
      },
      blockOptimize: {
        total: 20,
        used: 20,
        colName: "block_optimize" as const
      },
      motivationLetter: {
        total: 5,
        used: 2,
        colName: "motivation_letter" as const
      }
    }

    expect(() => verifyAndUpdateQuota("blockOptimize", quotas)).toThrow(
      "Limit reached"
    )
  })
})

describe("getActiveAccessPass", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return access pass when valid subscription exists", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "pass-id",
                      user_id: "user-id",
                      plan: "PRO",
                      end_at: "2025-12-31"
                    }
                  })
                })
              })
            })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await getActiveAccessPass("user-id")

    expect(result).not.toBeNull()
    expect(result?.id).toBe("pass-id")
    expect(result?.plan).toBe("PRO")
  })

  it("should return null when no valid subscription exists", async () => {
    const mockSupabase = {
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
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await getActiveAccessPass("user-id")

    expect(result).toBeNull()
  })

  it("should throw error on database error", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockRejectedValue(new Error("DB Error"))
                })
              })
            })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(getActiveAccessPass("user-id")).rejects.toThrow("DB Error")
  })

  it("should return null when database error is PGRST116", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: "PGRST116", message: "Row not found" }
                  })
                })
              })
            })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await getActiveAccessPass("user-id")
    expect(result).toBeNull()
  })
})

describe("getUserSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return subscription data when user has active pass", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "pass-id",
                    user_id: "user-id",
                    plan: "PRO" as const,
                    end_at: "2025-12-31",
                    quota_full_optimize: 10,
                    used_full_optimize: 3,
                    quota_block_optimize: 20,
                    used_block_optimize: 5,
                    quota_motivation_letter: 5,
                    used_motivation_letter: 1
                  }
                })
              })
            })
          })
        })
      })
    })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await getUserSubscription()

    expect(result.plan).toBe("PRO")
    expect(result.isActive).toBe(true)
    expect(result.expiryDate).toBe("2025-12-31")
    expect(result.quotas.fullOptimize).toEqual({
      used: 3,
      total: 10,
      colName: "full_optimize"
    })
    expect(result.quotas.blockOptimize).toEqual({
      used: 5,
      total: 20,
      colName: "block_optimize"
    })
    expect(result.quotas.motivationLetter).toEqual({
      used: 1,
      total: 5,
      colName: "motivation_letter"
    })
  })

  it("should return default values when user has no active pass", async () => {
    const mockFrom = vi.fn().mockReturnValue({
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

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await getUserSubscription()

    expect(result.plan).toBeNull()
    expect(result.isActive).toBe(false)
    expect(result.expiryDate).toBeNull()
    expect(result.quotas.fullOptimize).toEqual({
      used: 0,
      total: 0,
      colName: "full_optimize"
    })
    expect(result.quotas.blockOptimize).toEqual({
      used: 0,
      total: 0,
      colName: "block_optimize"
    })
    expect(result.quotas.motivationLetter).toEqual({
      used: 0,
      total: 0,
      colName: "motivation_letter"
    })
  })

  it("should throw error when user is not logged in", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(getUserSubscription()).rejects.toThrow("用户未登录")
  })

  it("should throw error when getUser fails", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Auth failed")
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(getUserSubscription()).rejects.toThrow("用户未登录")
  })
})

describe("consumeQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should successfully consume quota", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "pass-id",
              user_id: "user-id",
              plan: "PRO" as const,
              end_at: "2025-12-31",
              quota_full_optimize: 10,
              used_full_optimize: 5,
              quota_block_optimize: 20,
              used_block_optimize: 10,
              quota_motivation_letter: 5,
              used_motivation_letter: 2
            }
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await consumeQuota("fullOptimize")

    expect(mockSupabase.from).toHaveBeenCalledWith("access_passes")
  })

  it("should throw error when quota is exhausted", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "pass-id",
              user_id: "user-id",
              plan: "PRO" as const,
              end_at: "2025-12-31",
              quota_full_optimize: 10,
              used_full_optimize: 10,
              quota_block_optimize: 20,
              used_block_optimize: 10,
              quota_motivation_letter: 5,
              used_motivation_letter: 2
            }
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(consumeQuota("fullOptimize")).rejects.toThrow("Limit reached")
  })

  it("should throw error when database fails on select", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error("DB Error"))
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(consumeQuota("fullOptimize")).rejects.toThrow("DB Error")
  })

  it("should throw error when update fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "pass-id",
              user_id: "user-id",
              plan: "PRO" as const,
              end_at: "2025-12-31",
              quota_full_optimize: 10,
              used_full_optimize: 5,
              quota_block_optimize: 20,
              used_block_optimize: 10,
              quota_motivation_letter: 5,
              used_motivation_letter: 2
            }
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: "Update failed" }
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(consumeQuota("fullOptimize")).rejects.toEqual({
      message: "Update failed"
    })
  })

  it("should successfully consume quota with update success", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "pass-id",
              user_id: "user-id",
              plan: "PRO" as const,
              end_at: "2025-12-31",
              quota_full_optimize: 10,
              used_full_optimize: 5,
              quota_block_optimize: 20,
              used_block_optimize: 10,
              quota_motivation_letter: 5,
              used_motivation_letter: 2
            }
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await consumeQuota("fullOptimize")

    expect(mockSupabase.from).toHaveBeenCalledWith("access_passes")
  })
})

describe("verifyJobApplicationLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should pass when under limit", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: "app-1" }, { id: "app-2" }],
          error: null
        })
      })
    })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(verifyJobApplicationLimit()).resolves.toBeUndefined()
  })

  it("should throw error when over limit", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: Array(20).fill({ id: "app" }),
          error: null
        })
      })
    })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(verifyJobApplicationLimit()).rejects.toThrow(
      "You have reached the maximum job application limit"
    )
  })

  it("should throw error when user is not logged in", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(verifyJobApplicationLimit()).rejects.toThrow(
      "User not logged in"
    )
  })

  it("should throw error when getUser fails", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("User not logged in")
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(verifyJobApplicationLimit()).rejects.toThrow(
      "User not logged in"
    )
  })

  it("should throw error when database query fails", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("DB Error")
        })
      })
    })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null
        })
      },
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(verifyJobApplicationLimit()).rejects.toThrow("DB Error")
  })
})

describe("buildQuotas", () => {
  it("should build quotas for PRO plan", () => {
    const accessPass = {
      id: "pass-id",
      user_id: "user-id",
      plan: "PRO" as const,
      source: "purchase",
      stripe_checkout_session_id: "cs_test_123",
      start_at: "2025-01-01",
      end_at: "2025-12-31",
      created_at: "2025-01-01",
      quota_full_optimize: 10,
      used_full_optimize: 3,
      quota_block_optimize: 20,
      used_block_optimize: 5,
      quota_motivation_letter: 5,
      used_motivation_letter: 1
    }

    const result = buildQuotas(accessPass)

    expect(result.fullOptimize).toEqual({
      used: 3,
      total: 10,
      colName: "full_optimize"
    })
    expect(result.blockOptimize).toEqual({
      used: 5,
      total: 20,
      colName: "block_optimize"
    })
    expect(result.motivationLetter).toEqual({
      used: 1,
      total: 5,
      colName: "motivation_letter"
    })
  })

  it("should build quotas for LITE plan", () => {
    const accessPass = {
      id: "pass-id",
      user_id: "user-id",
      plan: "LITE" as const,
      source: "purchase",
      stripe_checkout_session_id: "cs_test_123",
      start_at: "2025-01-01",
      end_at: "2025-12-31",
      created_at: "2025-01-01",
      quota_full_optimize: 5,
      used_full_optimize: 1,
      quota_block_optimize: 15,
      used_block_optimize: 2,
      quota_motivation_letter: 3,
      used_motivation_letter: 0
    }

    const result = buildQuotas(accessPass)

    expect(result.fullOptimize.total).toBe(5)
    expect(result.blockOptimize.total).toBe(15)
    expect(result.motivationLetter.total).toBe(3)
  })

  it("should build quotas for FREE plan", () => {
    const accessPass = {
      id: "pass-id",
      user_id: "user-id",
      plan: "FREE" as const,
      source: "free_trial",
      stripe_checkout_session_id: null,
      start_at: "2025-01-01",
      end_at: "2025-12-31",
      created_at: "2025-01-01",
      quota_full_optimize: 2,
      used_full_optimize: 0,
      quota_block_optimize: 10,
      used_block_optimize: 0,
      quota_motivation_letter: 1,
      used_motivation_letter: 0
    }

    const result = buildQuotas(accessPass)

    expect(result.fullOptimize.total).toBe(2)
    expect(result.blockOptimize.total).toBe(10)
    expect(result.motivationLetter.total).toBe(1)
  })
})

describe("verifyQuota", () => {
  it("should not throw when quota is available", () => {
    const quotas: Quota = {
      fullOptimize: { used: 3, total: 10, colName: "full_optimize" },
      blockOptimize: { used: 5, total: 20, colName: "block_optimize" },
      motivationLetter: { used: 0, total: 1, colName: "motivation_letter" }
    }

    expect(() => verifyQuota("fullOptimize", quotas)).not.toThrow()
    expect(() => verifyQuota("blockOptimize", quotas)).not.toThrow()
  })

  it("should throw when quota is exhausted", () => {
    const quotas: Quota = {
      fullOptimize: { used: 10, total: 10, colName: "full_optimize" },
      blockOptimize: { used: 5, total: 20, colName: "block_optimize" },
      motivationLetter: { used: 1, total: 1, colName: "motivation_letter" }
    }

    expect(() => verifyQuota("fullOptimize", quotas)).toThrow("Limit reached")
    expect(() => verifyQuota("motivationLetter", quotas)).toThrow(
      "Limit reached"
    )
  })

  it("should throw when quota is over limit", () => {
    const quotas: Quota = {
      fullOptimize: { used: 15, total: 10, colName: "full_optimize" },
      blockOptimize: { used: 5, total: 20, colName: "block_optimize" },
      motivationLetter: { used: 0, total: 1, colName: "motivation_letter" }
    }

    expect(() => verifyQuota("fullOptimize", quotas)).toThrow("Limit reached")
  })
})

describe("verifyAndUpdateQuota", () => {
  it("should return update params when quota is available", () => {
    const quotas: Quota = {
      fullOptimize: { used: 3, total: 10, colName: "full_optimize" },
      blockOptimize: { used: 5, total: 20, colName: "block_optimize" },
      motivationLetter: { used: 0, total: 1, colName: "motivation_letter" }
    }

    const result = verifyAndUpdateQuota("fullOptimize", quotas)

    expect(result).toEqual({ used_full_optimize: 4 })
  })

  it("should throw when quota is exhausted", () => {
    const quotas: Quota = {
      fullOptimize: { used: 10, total: 10, colName: "full_optimize" },
      blockOptimize: { used: 5, total: 20, colName: "block_optimize" },
      motivationLetter: { used: 0, total: 1, colName: "motivation_letter" }
    }

    expect(() => verifyAndUpdateQuota("fullOptimize", quotas)).toThrow(
      "Limit reached"
    )
  })
})
