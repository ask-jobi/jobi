/**
 * @vitest-environment node
 */
import { GET } from "./route"
import { ApiError } from "@/server/auth-helper"
import { getUserTokenBalance } from "@/server/quota"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as authHelpersModule from "@/server/auth-helper"

vi.mock("@/server/quota", () => ({
  getUserTokenBalance: vi.fn()
}))

vi.mock("@/server/auth-helper", async () => {
  const actual = await vi.importActual<typeof import("@/server/auth-helper")>(
    "@/server/auth-helper"
  )

  return {
    ...actual,
    handleApiError: vi.fn((error: unknown) => {
      if (error instanceof actual.ApiError) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode }
        )
      }

      const message =
        error instanceof Error ? error.message : "Internal server error"

      return Response.json({ error: message }, { status: 500 })
    })
  }
})

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
    it("should return the auth helper status when getUserTokenBalance throws an ApiError", async () => {
      mockGetUserTokenBalance.mockRejectedValue(
        new ApiError("Auth service temporarily unavailable", 503)
      )

      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.error).toBe("Auth service temporarily unavailable")
      expect(authHelpersModule.handleApiError).toHaveBeenCalled()
    })

    it("should return 500 for unknown errors", async () => {
      mockGetUserTokenBalance.mockRejectedValue("Unknown error")

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })
})
