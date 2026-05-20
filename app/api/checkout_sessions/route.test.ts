/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { getStripe } from "@/lib/payment/stripe"
import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn()
}))

// Mock stripe
vi.mock("@/lib/payment/stripe", () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn()
      }
    }
  }))
}))

// Mock supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}))

import { headers } from "next/headers"

describe("POST /api/checkout_sessions", () => {
  let mockStripeCreate: any
  let mockCreateClient: any
  let mockHeaders: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockStripeCreate = vi.mocked(getStripe().checkout.sessions.create)
    mockCreateClient = vi.mocked(createClient)
    mockHeaders = vi.mocked(headers)

    // Default mock for headers
    mockHeaders.mockResolvedValue(
      new Map([["origin", "http://localhost:3000"]])
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: object): NextRequest => {
    return new NextRequest("http://localhost:3000/api/checkout_sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  describe("Validation scenarios", () => {
    it("should return 400 when priceId is missing", async () => {
      const request = createMockRequest({ plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Price ID is required")
      expect(mockStripeCreate).not.toHaveBeenCalled()
    })

    it("should return 400 when priceId is null", async () => {
      const request = createMockRequest({ priceId: null, plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Price ID is required")
    })

    it("should return 400 when priceId is empty string", async () => {
      const request = createMockRequest({ priceId: "", plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Price ID is required")
    })
  })

  describe("Authentication scenarios", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Not authenticated")
          })
        }
      })

      const request = createMockRequest({ priceId: "price_123", plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe("请先登录后再进行购买")
      expect(mockStripeCreate).not.toHaveBeenCalled()
    })

    it("should return 401 when getUser returns error", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Session expired" }
          })
        }
      })

      const request = createMockRequest({ priceId: "price_123", plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe("请先登录后再进行购买")
    })
  })

  describe("Success scenarios", () => {
    it("should successfully create checkout session for PRO plan", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com"
      }

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      const mockSession = {
        url: "https://checkout.stripe.com/pay/cs_test_123"
      }
      mockStripeCreate.mockResolvedValue(mockSession)

      const request = createMockRequest({
        priceId: "price_pro_123",
        plan: "PRO"
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.url).toBe(mockSession.url)
      expect(mockStripeCreate).toHaveBeenCalledWith({
        line_items: [
          {
            price: "price_pro_123",
            quantity: 1
          }
        ],
        mode: "payment",
        success_url:
          "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/pricing?cancelled=true",
        automatic_tax: { enabled: true },
        customer_creation: "always",
        customer_email: mockUser.email,
        metadata: {
          supabase_user_id: mockUser.id,
          plan: "PRO"
        }
      })
    })

    it("should successfully create checkout session for LITE plan", async () => {
      const mockUser = {
        id: "user_456",
        email: "lite@example.com"
      }

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      const mockSession = {
        url: "https://checkout.stripe.com/pay/cs_test_456"
      }
      mockStripeCreate.mockResolvedValue(mockSession)

      const request = createMockRequest({
        priceId: "price_lite_123",
        plan: "LITE"
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.url).toBe(mockSession.url)
      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            plan: "LITE"
          })
        })
      )
    })

    it("should use request origin for success and cancel URLs", async () => {
      const mockUser = {
        id: "user_789",
        email: "origin@example.com"
      }

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      const mockSession = {
        url: "https://checkout.stripe.com/pay/cs_test_789"
      }
      mockStripeCreate.mockResolvedValue(mockSession)

      // Mock headers to return custom origin
      mockHeaders.mockResolvedValue(
        new Map([["origin", "https://custom-domain.com"]])
      )

      const request = new NextRequest(
        "https://custom-domain.com/api/checkout_sessions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: "price_123", plan: "PRO" })
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url:
            "https://custom-domain.com/payment/success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: "https://custom-domain.com/pricing?cancelled=true"
        })
      )
    })

    it("should reuse stored stripe customer id when profile already has one", async () => {
      const mockUser = {
        id: "user_existing_customer",
        email: "existing@example.com"
      }

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: mockUser.id,
                    stripe_customer_id: "cus_existing_123"
                  },
                  error: null
                })
              })
            })
          }
        })
      })

      mockStripeCreate.mockResolvedValue({
        url: "https://checkout.stripe.com/pay/cs_existing"
      })

      const request = createMockRequest({
        priceId: "price_pro_existing",
        plan: "PRO"
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockStripeCreate).toHaveBeenCalledWith({
        line_items: [
          {
            price: "price_pro_existing",
            quantity: 1
          }
        ],
        mode: "payment",
        success_url:
          "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/pricing?cancelled=true",
        automatic_tax: { enabled: true },
        customer: "cus_existing_123",
        metadata: {
          supabase_user_id: mockUser.id,
          plan: "PRO"
        }
      })
    })
  })

  describe("Error scenarios", () => {
    it("should return 500 when stripe checkout session creation fails", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user_123", email: "test@example.com" } },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      mockStripeCreate.mockRejectedValue(new Error("Stripe API error"))

      const request = createMockRequest({ priceId: "price_123", plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Stripe API error")
    })

    it("should return 500 when stripe throws error with statusCode", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user_123", email: "test@example.com" } },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      const stripeError = new Error("Rate limit exceeded") as any
      stripeError.statusCode = 429
      mockStripeCreate.mockRejectedValue(stripeError)

      const request = createMockRequest({ priceId: "price_123", plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toBe("Rate limit exceeded")
    })

    it("should handle unknown errors gracefully", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user_123", email: "test@example.com" } },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      mockStripeCreate.mockRejectedValue("Unknown error")

      const request = createMockRequest({ priceId: "price_123", plan: "PRO" })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe("Edge cases", () => {
    it("should handle request without plan in body", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user_123", email: "test@example.com" } },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      const mockSession = { url: "https://checkout.stripe.com/pay/cs_test" }
      mockStripeCreate.mockResolvedValue(mockSession)

      const request = createMockRequest({ priceId: "price_123" })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            plan: undefined
          })
        })
      )
    })

    it("should preserve user email in checkout session", async () => {
      const mockUser = {
        id: "user_email_test",
        email: "preserved@example.com"
      }

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table !== "user_profiles") {
            return {}
          }

          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" }
                })
              })
            })
          }
        })
      })

      mockStripeCreate.mockResolvedValue({ url: "https://checkout.stripe.com" })

      const request = createMockRequest({ priceId: "price_123", plan: "PRO" })
      await POST(request)

      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: mockUser.email
        })
      )
    })
  })
})
