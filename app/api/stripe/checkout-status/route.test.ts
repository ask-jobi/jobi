/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "./route"
import { createClient } from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}))

describe("GET /api/stripe/checkout-status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when user is not logged in", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: null
        })
      }
    } as any)

    const response = await GET(
      new Request(
        "http://localhost:3000/api/stripe/checkout-status?session_id=cs_test_123"
      )
    )

    expect(response.status).toBe(401)
  })

  it("returns processed true when checkout event exists for the session", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "user_123" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "event_123" },
                error: null
              })
            })
          })
        })
      })
    } as any)

    const response = await GET(
      new Request(
        "http://localhost:3000/api/stripe/checkout-status?session_id=cs_test_123"
      )
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ processed: true })
  })

  it("returns processed false when checkout event is not found", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "user_123" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      })
    } as any)

    const response = await GET(
      new Request(
        "http://localhost:3000/api/stripe/checkout-status?session_id=cs_test_123"
      )
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ processed: false })
  })
})
