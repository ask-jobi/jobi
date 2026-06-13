/**
 * @vitest-environment node
 */
import {
  AuthRetryableFetchError,
  AuthSessionMissingError
} from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  ApiError,
  getOptionalVerifiedUserIdentity,
  requireVerifiedAuthContext,
  requireVerifiedUserIdentity
} from "./auth-helper"
import { createClient } from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}))

vi.mock("@/server/ai/chat/history", () => ({
  verifySessionOwnership: vi.fn()
}))

describe("auth-helper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a verified identity from claims", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: {
              sub: "user-1",
              email: "user@example.com"
            }
          },
          error: null
        })
      }
    } as any)

    await expect(requireVerifiedUserIdentity()).resolves.toEqual({
      id: "user-1",
      email: "user@example.com"
    })
  })

  it("returns null for an anonymous verified identity lookup", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: null
        })
      }
    } as any)

    await expect(getOptionalVerifiedUserIdentity()).resolves.toBeNull()
  })

  it("maps missing sessions to 401 for required verified auth", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new AuthSessionMissingError()
        })
      }
    } as any)

    await expect(requireVerifiedAuthContext()).rejects.toMatchObject({
      message: "Unauthorized",
      statusCode: 401
    })
  })

  it("maps retryable claims failures to 503", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new AuthRetryableFetchError("fetch failed", 503)
        })
      }
    } as any)

    await expect(requireVerifiedAuthContext()).rejects.toMatchObject({
      message: "Auth service temporarily unavailable",
      statusCode: 503
    })
  })

  it("returns a verified auth context from claims", async () => {
    const mockSupabase = {
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: {
              sub: "user-2",
              email: "claims@example.com"
            }
          },
          error: null
        })
      }
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    await expect(requireVerifiedAuthContext()).resolves.toEqual({
      supabase: mockSupabase,
      user: {
        id: "user-2",
        email: "claims@example.com"
      }
    })
  })

  it("converts non-supabase auth errors to a generic 401", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new Error("unexpected auth mock")
        })
      }
    } as any)

    await expect(requireVerifiedAuthContext()).rejects.toEqual(
      expect.objectContaining<ApiError>({
        message: "Unauthorized",
        statusCode: 401
      })
    )
  })
})
