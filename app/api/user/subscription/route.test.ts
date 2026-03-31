/**
 * @vitest-environment node
 */
import { GET } from "./route"
import { getUserSubscription } from "@/server/quota"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

vi.mock("@/server/quota", () => ({
  getUserSubscription: vi.fn()
}))

describe("GET /api/user/subscription", () => {
  let mockGetUserSubscription: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserSubscription = vi.mocked(getUserSubscription)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Success scenarios", () => {
    it("should return user subscription data", async () => {
      const mockSubscription = {
        plan: "PRO",
        isActive: true,
        expiryDate: "2025-12-31",
        quotas: {
          fullOptimize: { used: 3, total: 10 },
          blockOptimize: { used: 5, total: 20 },
          motivationLetter: { used: 1, total: 5 }
        },
        chatTokenLimit: 1000000,
        chatTokenUsed: 250000
      }

      mockGetUserSubscription.mockResolvedValue(mockSubscription)

      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockSubscription)
    })

    it("should handle free plan subscription", async () => {
      const mockSubscription = {
        plan: "FREE",
        isActive: true,
        expiryDate: "2025-01-15",
        quotas: {
          fullOptimize: { used: 0, total: 2 },
          blockOptimize: { used: 0, total: 10 },
          motivationLetter: { used: 0, total: 1 }
        },
        chatTokenLimit: 50000,
        chatTokenUsed: 0
      }

      mockGetUserSubscription.mockResolvedValue(mockSubscription)

      const response = await GET()

      expect(response.status).toBe(200)
    })

    it("should handle inactive subscription", async () => {
      const mockSubscription = {
        plan: "PRO",
        isActive: false,
        expiryDate: "2024-01-01",
        quotas: {
          fullOptimize: { used: 10, total: 10 },
          blockOptimize: { used: 20, total: 20 },
          motivationLetter: { used: 5, total: 5 }
        },
        chatTokenLimit: 1000000,
        chatTokenUsed: 1000000
      }

      mockGetUserSubscription.mockResolvedValue(mockSubscription)

      const response = await GET()

      expect(response.status).toBe(200)
    })
  })

  describe("Error scenarios", () => {
    it("should return 500 when getUserSubscription throws an error", async () => {
      mockGetUserSubscription.mockRejectedValue(
        new Error("Database connection failed")
      )

      const response = await GET()

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Failed to fetch subscription data")
    })

    it("should return 500 for unknown errors", async () => {
      mockGetUserSubscription.mockRejectedValue("Unknown error")

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })
})
