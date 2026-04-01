/**
 * @vitest-environment node
 */
import { GET } from "./route"
import { getUserTokenBalance } from "@/server/quota"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

vi.mock("@/server/quota", () => ({
  getUserTokenBalance: vi.fn()
}))

describe("GET /api/user/subscription", () => {
  let mockGetUserTokenBalance: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserTokenBalance = vi.mocked(getUserTokenBalance)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Success scenarios", () => {
    it("should return user token balance data", async () => {
      const mockTokenBalance = {
        plan: "PRO",
        chatTokenLimit: 1000000,
        chatTokenUsed: 250000,
        chatTokenRemaining: 750000
      }

      mockGetUserTokenBalance.mockResolvedValue(mockTokenBalance)

      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockTokenBalance)
    })

    it("should handle free plan token balance", async () => {
      const mockTokenBalance = {
        plan: "FREE",
        chatTokenLimit: 50000,
        chatTokenUsed: 0,
        chatTokenRemaining: 50000
      }

      mockGetUserTokenBalance.mockResolvedValue(mockTokenBalance)

      const response = await GET()

      expect(response.status).toBe(200)
    })

    it("should handle exhausted token balance", async () => {
      const mockTokenBalance = {
        plan: null,
        chatTokenLimit: 0,
        chatTokenUsed: 0,
        chatTokenRemaining: 0
      }

      mockGetUserTokenBalance.mockResolvedValue(mockTokenBalance)

      const response = await GET()

      expect(response.status).toBe(200)
    })
  })

  describe("Error scenarios", () => {
    it("should return 500 when getUserTokenBalance throws an error", async () => {
      mockGetUserTokenBalance.mockRejectedValue(
        new Error("Database connection failed")
      )

      const response = await GET()

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Failed to fetch subscription data")
    })

    it("should return 500 for unknown errors", async () => {
      mockGetUserTokenBalance.mockRejectedValue("Unknown error")

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })
})
