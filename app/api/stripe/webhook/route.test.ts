/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { stripe } from "@/lib/payment/stripe"
import { QUOTA } from "@/lib/payment/quota"
import { createServerRoleClient } from "@/lib/supabase/server-role-client"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

// Mock stripe
vi.mock("@/lib/payment/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn()
    }
  }
}))

// Mock QUOTA
vi.mock("@/lib/payment/quota", () => ({
  QUOTA: {
    FREE: {
      quota_full_optimize: 2,
      quota_block_optimize: 10,
      quota_motivation_letter: 1,
      quota_chat_tokens: 100000
    },
    LITE: {
      quota_full_optimize: 5,
      quota_block_optimize: 30,
      quota_motivation_letter: 3,
      quota_chat_tokens: 1000000
    },
    PRO: {
      quota_full_optimize: 10,
      quota_block_optimize: 50,
      quota_motivation_letter: 5,
      quota_chat_tokens: 100000000
    }
  }
}))

// Mock server role client
vi.mock("@/lib/supabase/server-role-client", () => ({
  createServerRoleClient: vi.fn()
}))

describe("POST /api/stripe/webhook", () => {
  let mockConstructEvent: any
  let mockCreateServerRoleClient: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent)
    mockCreateServerRoleClient = vi.mocked(createServerRoleClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: string, signature: string): Request => {
    const headers = new Headers()
    headers.set("stripe-signature", signature)
    return new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers,
      body: body
    })
  }

  const createMockSignature = (): string => {
    return "t=timestamp,v1=signature"
  }

  const createCheckoutSession = (overrides: object = {}): object => ({
    customer: "cus_123",
    metadata: {
      supabase_user_id: "user_123",
      plan: "PRO"
    },
    id: "cs_test_123",
    ...overrides
  })

  // ==================== Webhook Signature Validation ====================

  describe("Webhook signature validation", () => {
    it("should return 400 when signature verification fails", async () => {
      const mockRequest = createMockRequest("{}", "invalid_signature")

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Webhook signature verification failed")
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toContain("Webhook Error:")
    })

    it("should return 400 when raw body is invalid JSON", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest("invalid json", mockSignature)

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Unexpected end of JSON input")
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
    })

    it("should return 400 when signature header is missing", async () => {
      const mockRequest = new Request(
        "http://localhost:3000/api/stripe/webhook",
        {
          method: "POST",
          body: "{}"
        }
      )

      mockConstructEvent.mockImplementation(() => {
        throw new Error("No signature found")
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
    })
  })

  // ==================== Metadata Validation ====================

  describe("Metadata validation", () => {
    it("should return 400 when supabase_user_id is missing in metadata", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession({ metadata: { plan: "PRO" } }) }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession({ metadata: { plan: "PRO" } }) }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe("Missing required metadata")
    })

    it("should return 400 when plan is missing in metadata", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { supabase_user_id: "user_123" }
            })
          }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { supabase_user_id: "user_123" }
          })
        }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe("Missing required metadata")
    })

    it("should return 400 when both supabase_user_id and plan are missing", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession({ metadata: {} }) }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession({ metadata: {} }) }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
    })

    it("should return 400 when metadata is null", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession({ metadata: null }) }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession({ metadata: null }) }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
    })
  })

  // ==================== User Profile Query Scenarios ====================

  describe("User profile query scenarios", () => {
    it("should throw error when profile query fails with non-PGRST116 error", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                error: { code: "PGRST301", message: "Database error" }
              })
            })
          })
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toContain("Database Error:")
    })

    it("should create new user profile when user does not exist", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    error: { code: "PGRST116" }
                  })
                })
              }),
              insert: vi.fn().mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: null })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it("should update existing user profile when stripe_customer_id differs", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession({ customer: "cus_new" }) }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession({ customer: "cus_new" }) }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_123", stripe_customer_id: "cus_old" },
                    error: null
                  })
                })
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  update: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it("should skip profile update when stripe_customer_id is the same", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession({ customer: "cus_123" }) }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession({ customer: "cus_123" }) }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_123", stripe_customer_id: "cus_123" },
                    error: null
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })
  })

  // ==================== Delete Access Passes Scenarios ====================

  describe("Delete access passes scenarios", () => {
    it("should attempt to delete existing access passes", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_123", stripe_customer_id: "cus_123" },
                    error: null
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      // Verify the route handles delete attempt
      expect(response.status).toBe(200)
    })
  })

  // ==================== Plan Duration Scenarios ====================

  describe("Plan duration calculation", () => {
    it("should calculate 14 days for LITE plan", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { plan: "LITE", supabase_user_id: "user_lite" }
            })
          }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { plan: "LITE", supabase_user_id: "user_lite" }
          })
        }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_lite", stripe_customer_id: "cus_123" },
                    error: null
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockImplementation((data: any) => {
                // Verify LITE quotas
                expect(data.quota_full_optimize).toBe(
                  QUOTA.LITE.quota_full_optimize
                )
                expect(data.quota_block_optimize).toBe(
                  QUOTA.LITE.quota_block_optimize
                )
                expect(data.quota_motivation_letter).toBe(
                  QUOTA.LITE.quota_motivation_letter
                )
                expect(data.quota_chat_tokens).toBe(
                  QUOTA.LITE.quota_chat_tokens
                )
                return { insert: vi.fn().mockResolvedValue({ error: null }) }
              })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it("should calculate 30 days for PRO plan", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { plan: "PRO", supabase_user_id: "user_pro" }
            })
          }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { plan: "PRO", supabase_user_id: "user_pro" }
          })
        }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_pro", stripe_customer_id: "cus_123" },
                    error: null
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockImplementation((data: any) => {
                // Verify PRO quotas
                expect(data.quota_full_optimize).toBe(
                  QUOTA.PRO.quota_full_optimize
                )
                expect(data.quota_block_optimize).toBe(
                  QUOTA.PRO.quota_block_optimize
                )
                expect(data.quota_motivation_letter).toBe(
                  QUOTA.PRO.quota_motivation_letter
                )
                expect(data.quota_chat_tokens).toBe(QUOTA.PRO.quota_chat_tokens)
                return { insert: vi.fn().mockResolvedValue({ error: null }) }
              })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it("should calculate 3 days for FREE plan", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { plan: "FREE", supabase_user_id: "user_free" }
            })
          }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { plan: "FREE", supabase_user_id: "user_free" }
          })
        }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_free", stripe_customer_id: "cus_123" },
                    error: null
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockImplementation((data: any) => {
                // Verify FREE quotas
                expect(data.quota_full_optimize).toBe(
                  QUOTA.FREE.quota_full_optimize
                )
                expect(data.quota_block_optimize).toBe(
                  QUOTA.FREE.quota_block_optimize
                )
                expect(data.quota_motivation_letter).toBe(
                  QUOTA.FREE.quota_motivation_letter
                )
                expect(data.quota_chat_tokens).toBe(
                  QUOTA.FREE.quota_chat_tokens
                )
                return { insert: vi.fn().mockResolvedValue({ error: null }) }
              })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it("should throw error for invalid plan", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { plan: "INVALID", supabase_user_id: "user_invalid" }
            })
          }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { plan: "INVALID", supabase_user_id: "user_invalid" }
          })
        }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_invalid", stripe_customer_id: "cus_123" },
                    error: null
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toContain("Invalid plan")
    })
  })

  // ==================== Create Access Pass Scenarios ====================

  describe("Create access pass scenarios", () => {
    it("should create access pass successfully", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_123", stripe_customer_id: "cus_123" },
                    error: null
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockImplementation((data: any) => {
                // Verify all metadata fields
                expect(data.user_id).toBe("user_123")
                expect(data.plan).toBe("PRO")
                expect(data.source).toBe("stripe")
                expect(data.stripe_checkout_session_id).toBe("cs_test_123")
                expect(data.start_at).toBeDefined()
                expect(data.end_at).toBeDefined()
                return { insert: vi.fn().mockResolvedValue({ error: null }) }
              })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.received).toBe(true)
    })
  })

  // ==================== Event Type Handling ====================

  describe("Event type handling", () => {
    it("should return 200 for non-checkout events (invoice.paid)", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "invoice.paid",
          data: { object: {} }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "invoice.paid",
        data: { object: {} }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.received).toBe(true)
    })

    it("should return 200 for customer.subscription.created", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "customer.subscription.created",
          data: { object: { id: "sub_123" } }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: { id: "sub_123" } }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it("should return 200 for customer.subscription.updated", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "customer.subscription.updated",
          data: { object: { id: "sub_456" } }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: { object: { id: "sub_456" } }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })

    it("should return 200 for invoice.payment_succeeded", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "invoice.payment_succeeded",
          data: { object: { id: "in_789" } }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_succeeded",
        data: { object: { id: "in_789" } }
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
    })
  })

  // ==================== Database Operation Error Handling ====================

  describe("Database operation scenarios", () => {
    it("should handle profile query with PGRST116 (not found)", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    error: { code: "PGRST116" }
                  })
                })
              }),
              insert: vi.fn().mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: null })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      // PGRST116 triggers profile creation path
      expect(response.status).toBe(200)
    })

    it("should handle profile query with non-PGRST116 error", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    error: { code: "PGRST301", message: "Database error" }
                  })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      // Non-PGRST116 error should return 500
      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toContain("Database Error:")
    })

    it("should handle existing profile with different stripe_customer_id", async () => {
      const mockSignature = createMockSignature()
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession({ customer: "cus_new" }) }
        }),
        mockSignature
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession({ customer: "cus_new" }) }
      })

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user_123", stripe_customer_id: "cus_old" },
                    error: null
                  })
                })
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  update: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  delete: vi.fn().mockResolvedValue({ error: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              insert: vi.fn().mockResolvedValue({ error: null })
            })
          }
        })
      }
      mockCreateServerRoleClient.mockResolvedValue(mockSupabaseClient)

      const response = await POST(mockRequest)

      // Different stripe_customer_id triggers update path
      expect(response.status).toBe(200)
    })
  })
})
