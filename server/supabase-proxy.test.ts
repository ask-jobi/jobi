/**
 * @vitest-environment node
 */
import { createServerClient } from "@supabase/ssr"
import {
  AuthRetryableFetchError,
  AuthSessionMissingError
} from "@supabase/supabase-js"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { updateSession } from "@/lib/supabase/proxy"

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn()
}))

describe("lib/supabase/proxy.updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects unauthenticated protected page requests to login", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new AuthSessionMissingError()
        })
      }
    } as any)

    const response = await updateSession(
      new NextRequest("http://localhost:3000/dashboard")
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/login"
    )
  })

  it("does not redirect unauthenticated API requests", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new AuthSessionMissingError()
        })
      }
    } as any)

    const response = await updateSession(
      new NextRequest("http://localhost:3000/api/user/token-balance")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("passes through retryable auth refresh failures", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new AuthRetryableFetchError("fetch failed", 503)
        })
      }
    } as any)

    const response = await updateSession(
      new NextRequest("http://localhost:3000/dashboard")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("forwards refreshed cookies and headers from Supabase", async () => {
    vi.mocked(createServerClient).mockImplementation((...args: any[]) => {
      const options = args[2]

      return {
        auth: {
          getClaims: vi.fn().mockImplementation(async () => {
            options.cookies.setAll(
              [
                {
                  name: "sb-test-auth-token",
                  value: "refreshed-token",
                  options: { path: "/", httpOnly: true }
                }
              ],
              { "x-supabase-auth": "refreshed" }
            )

            return {
              data: { claims: { sub: "user-1" } },
              error: null
            }
          })
        }
      } as any
    })

    const response = await updateSession(
      new NextRequest("http://localhost:3000/dashboard")
    )

    expect(response.cookies.get("sb-test-auth-token")?.value).toBe(
      "refreshed-token"
    )
    expect(response.headers.get("x-supabase-auth")).toBe("refreshed")
  })
})
