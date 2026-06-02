/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

const mockExchangeCodeForSession = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession
      }
    })
}))

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
  })

  it("exchanges the OAuth code and redirects to the forwarded host", async () => {
    const request = new Request(
      "https://jobi.com/auth/callback?code=oauth-code&next=%2Fpricing",
      {
        headers: {
          "x-forwarded-host": "jobi-validation.workers.dev"
        }
      }
    )

    const response = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("oauth-code")
    expect(response.headers.get("location")).toBe(
      "https://jobi-validation.workers.dev/pricing"
    )
  })

  it("rejects external next URLs", async () => {
    const request = new Request(
      "https://jobi.com/auth/callback?code=oauth-code&next=https%3A%2F%2Fbad.example"
    )

    const response = await GET(request)

    expect(response.headers.get("location")).toBe("https://jobi.com/dashboard")
  })
})
