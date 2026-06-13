/**
 * @vitest-environment node
 */
import { GET } from "./route"
import { requireVerifiedAuthContext } from "@/server/auth-helper"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/server/auth-helper", () => ({
  handleApiError: vi.fn((error: any) =>
    Response.json({ error: error.message }, { status: 500 })
  ),
  requireVerifiedAuthContext: vi.fn()
}))

describe("GET /api/paddle/checkout-status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requires transaction_id", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/paddle/checkout-status")
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: "transaction_id is required"
    })
  })

  it("returns whether the Paddle transaction has been processed", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "evt_123" },
      error: null
    })
    const eqTransaction = vi.fn().mockReturnValue({ maybeSingle })
    const eqUser = vi.fn().mockReturnValue({ eq: eqTransaction })
    const select = vi.fn().mockReturnValue({ eq: eqUser })
    const from = vi.fn().mockReturnValue({ select })

    vi.mocked(requireVerifiedAuthContext).mockResolvedValue({
      supabase: { from },
      user: { id: "user_123" }
    } as any)

    const response = await GET(
      new Request(
        "http://localhost:3000/api/paddle/checkout-status?transaction_id=txn_123"
      )
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ processed: true })
    expect(from).toHaveBeenCalledWith("stripe_checkout_events")
    expect(eqUser).toHaveBeenCalledWith("user_id", "user_123")
    expect(eqTransaction).toHaveBeenCalledWith("checkout_session_id", "txn_123")
  })
})
