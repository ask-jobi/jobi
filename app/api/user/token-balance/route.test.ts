/**
 * @vitest-environment node
 */
import { GET } from "./route"
import { ApiError } from "@/server/auth-helper"
import { getUserTokenBalance } from "@/server/quota"
import { vi, describe, it, expect, beforeEach } from "vitest"
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

describe("GET /api/user/token-balance", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns token balance data", async () => {
    vi.mocked(getUserTokenBalance).mockResolvedValue({
      plan: "PRO",
      chatTokenLimit: 1_000_000,
      chatTokenUsed: 123_456,
      chatTokenRemaining: 876_544
    })

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      plan: "PRO",
      chatTokenLimit: 1_000_000,
      chatTokenUsed: 123_456,
      chatTokenRemaining: 876_544
    })
  })

  it("returns the auth helper status for auth errors", async () => {
    vi.mocked(getUserTokenBalance).mockRejectedValue(
      new ApiError("Auth service temporarily unavailable", 503)
    )

    const response = await GET()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: "Auth service temporarily unavailable"
    })
    expect(authHelpersModule.handleApiError).toHaveBeenCalled()
  })
})
