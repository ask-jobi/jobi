/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { createClient } from "@/lib/supabase/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}))

vi.mock("@/lib/payment/quota", () => ({
  QUOTA: {
    FREE: {
      quota_chat_tokens: 50_000
    }
  }
}))

const buildHistoryQueryMock = (result: { data: any; error: any }) => ({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue(result)
    })
  })
})

describe("POST /api/access-passes/create-free", () => {
  let mockCreateClient: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient = vi.mocked(createClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Authentication scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: null },
            error: new Error("Not authenticated")
          })
        }
      })

      const response = await POST()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe("Unauthorized")
    })

    it("should return 401 when getUser returns error", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: null },
            error: { message: "Session expired" }
          })
        }
      })

      const response = await POST()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("History scenarios", () => {
    it("should create a one-time free token grant when user has no history", async () => {
      const mockUser = { id: "user_123", email: "test@example.com" }
      const insertedPass = {
        id: "pass_123",
        plan: "FREE",
        quota_chat_tokens: 50_000,
        used_chat_tokens: 0
      }

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table !== "access_passes") {
          return {}
        }

        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }),
          insert: vi.fn().mockImplementation((data: any) => {
            expect(data).not.toHaveProperty("source")
            expect(data).not.toHaveProperty("start_at")
            expect(data).not.toHaveProperty("end_at")

            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: insertedPass,
                  error: null
                })
              })
            }
          })
        }
      })

      mockCreateClient.mockResolvedValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: { sub: mockUser.id, email: mockUser.email } },
            error: null
          })
        },
        from: mockFrom
      })

      const response = await POST()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe("Free token grant created successfully")
      expect(data.accessPass).toEqual(insertedPass)
      expect(data.accessPass).not.toHaveProperty("quota_full_optimize")
      expect(data.accessPass).not.toHaveProperty("quota_block_optimize")
      expect(data.accessPass).not.toHaveProperty("quota_motivation_letter")
      expect(data.accessPass).not.toHaveProperty("used_full_optimize")
      expect(data.accessPass).not.toHaveProperty("used_block_optimize")
      expect(data.accessPass).not.toHaveProperty("used_motivation_letter")
    })

    it("should return 400 when user has any pass history", async () => {
      const mockUser = { id: "user_tried", email: "tried@example.com" }

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table !== "access_passes") {
          return {}
        }

        return buildHistoryQueryMock({
          data: {
            id: "old_pass_1",
            plan: "PRO",
            created_at: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            quota_chat_tokens: 500_000,
            used_chat_tokens: 250_000
          },
          error: null
        })
      })

      mockCreateClient.mockResolvedValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: { sub: mockUser.id, email: mockUser.email } },
            error: null
          })
        },
        from: mockFrom
      })

      const response = await POST()

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.code).toBe("ALREADY_TRIED")
    })
  })

  describe("Database error scenarios", () => {
    it("should return 500 when checking history fails", async () => {
      const mockUser = { id: "user_error", email: "error@example.com" }

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table !== "access_passes") {
          return {}
        }

        return buildHistoryQueryMock({
          data: null,
          error: { message: "Database connection failed" }
        })
      })

      mockCreateClient.mockResolvedValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: { sub: mockUser.id, email: mockUser.email } },
            error: null
          })
        },
        from: mockFrom
      })

      const response = await POST()

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("检查通行证历史失败")
    })
  })
})
