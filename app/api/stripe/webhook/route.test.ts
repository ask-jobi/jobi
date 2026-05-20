/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { getStripe } from "@/lib/payment/stripe"
import { QUOTA } from "@/lib/payment/quota"
import { createServerRoleClient } from "@/lib/supabase/server-role-client"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/payment/stripe", () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn()
    }
  }))
}))

vi.mock("@/lib/payment/quota", () => ({
  QUOTA: {
    FREE: { quota_chat_tokens: 50_000 },
    LITE: { quota_chat_tokens: 500_000 },
    PRO: { quota_chat_tokens: 1_000_000 }
  }
}))

vi.mock("@/lib/supabase/server-role-client", () => ({
  createServerRoleClient: vi.fn()
}))

type ProfileRow = {
  id: string
  stripe_customer_id: string | null
}

type AccessPassRow = {
  id: string
  user_id: string
  plan: "FREE" | "LITE" | "PRO"
  quota_chat_tokens: number
  used_chat_tokens: number
  created_at?: string
}

type WebhookSupabaseOptions = {
  existingProfile?: ProfileRow | null
  profileError?: { code: string; message?: string } | null
  profileInsertError?: { message: string } | null
  profileUpdateError?: { message: string } | null
  existingAccessPass?: AccessPassRow | null
  accessPassQueryError?: { message: string } | null
  accessPassInsertError?: { message: string } | null
  accessPassUpdateError?: { message: string } | null
  checkoutEventInsertError?: { code?: string; message: string } | null
}

const createMockRequest = (body: string, signature: string): Request => {
  const headers = new Headers()
  headers.set("stripe-signature", signature)
  return new Request("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers,
    body
  })
}

const createMockSignature = () => "t=timestamp,v1=signature"

const createCheckoutSession = (
  overrides: Record<string, unknown> = {}
): Record<string, unknown> => ({
  customer: "cus_123",
  metadata: {
    supabase_user_id: "user_123",
    plan: "PRO"
  },
  id: "cs_test_123",
  ...overrides
})

const buildWebhookSupabaseClient = (options: WebhookSupabaseOptions = {}) => {
  const checkoutEventInsertMock = vi
    .fn()
    .mockResolvedValue({ error: options.checkoutEventInsertError ?? null })
  const checkoutEventDeleteEqMock = vi.fn().mockResolvedValue({ error: null })
  const checkoutEventDeleteMock = vi.fn().mockReturnValue({
    eq: checkoutEventDeleteEqMock
  })

  const profileSelectSingleMock = vi.fn().mockResolvedValue({
    data: options.existingProfile ?? null,
    error: options.profileError ?? null
  })
  const profileInsertMock = vi
    .fn()
    .mockResolvedValue({ error: options.profileInsertError ?? null })
  const profileUpdateEqMock = vi
    .fn()
    .mockResolvedValue({ error: options.profileUpdateError ?? null })
  const profileUpdateMock = vi.fn().mockReturnValue({
    eq: profileUpdateEqMock
  })

  const accessPassMaybeSingleMock = vi.fn().mockResolvedValue({
    data: options.existingAccessPass ?? null,
    error: options.accessPassQueryError ?? null
  })
  const accessPassInsertMock = vi
    .fn()
    .mockResolvedValue({ error: options.accessPassInsertError ?? null })
  const accessPassUpdateEqMock = vi
    .fn()
    .mockResolvedValue({ error: options.accessPassUpdateError ?? null })
  const accessPassUpdateMock = vi.fn().mockReturnValue({
    eq: accessPassUpdateEqMock
  })

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "stripe_checkout_events") {
      return {
        insert: checkoutEventInsertMock,
        delete: checkoutEventDeleteMock
      }
    }

    if (table === "user_profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: profileSelectSingleMock
          })
        }),
        insert: profileInsertMock,
        update: profileUpdateMock
      }
    }

    if (table === "access_passes") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: accessPassMaybeSingleMock
          })
        }),
        insert: accessPassInsertMock,
        update: accessPassUpdateMock
      }
    }

    return {}
  })

  return {
    client: { from },
    mocks: {
      from,
      checkoutEventInsertMock,
      checkoutEventDeleteMock,
      checkoutEventDeleteEqMock,
      profileSelectSingleMock,
      profileInsertMock,
      profileUpdateMock,
      profileUpdateEqMock,
      accessPassMaybeSingleMock,
      accessPassInsertMock,
      accessPassUpdateMock,
      accessPassUpdateEqMock
    }
  }
}

describe("POST /api/stripe/webhook", () => {
  let mockConstructEvent: any
  let mockCreateServerRoleClient: ReturnType<
    typeof vi.mocked<typeof createServerRoleClient>
  >

  beforeEach(() => {
    vi.clearAllMocks()
    mockConstructEvent = vi.mocked(getStripe().webhooks.constructEvent)
    mockCreateServerRoleClient = vi.mocked(createServerRoleClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Webhook signature validation", () => {
    it("returns 400 when signature verification fails", async () => {
      const mockRequest = createMockRequest("{}", "invalid_signature")

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Webhook signature verification failed")
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      expect(await response.text()).toContain("Webhook Error:")
    })
  })

  describe("Metadata validation", () => {
    it("returns 400 when required metadata is missing", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { plan: "PRO" }
            })
          }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { plan: "PRO" }
          })
        }
      } as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe("Missing required metadata")
    })

    it("rejects FREE plan", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { plan: "FREE", supabase_user_id: "user_free" }
            })
          }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { plan: "FREE", supabase_user_id: "user_free" }
          })
        }
      } as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe("FREE plan is not supported")
      expect(mockCreateServerRoleClient).not.toHaveBeenCalled()
    })

    it("rejects invalid plan", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: createCheckoutSession({
              metadata: { plan: "INVALID", supabase_user_id: "user_invalid" }
            })
          }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: createCheckoutSession({
            metadata: { plan: "INVALID", supabase_user_id: "user_invalid" }
          })
        }
      } as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      expect(await response.text()).toContain("Invalid plan")
    })
  })

  describe("Checkout event idempotency", () => {
    it("returns 200 without touching balances when checkout event already exists", async () => {
      const session = createCheckoutSession({
        metadata: { plan: "LITE", supabase_user_id: "user_lite" }
      })
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: session }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: session }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        checkoutEventInsertError: {
          code: "23505",
          message: "duplicate key value violates unique constraint"
        }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ received: true })
      expect(mocks.profileSelectSingleMock).not.toHaveBeenCalled()
      expect(mocks.accessPassMaybeSingleMock).not.toHaveBeenCalled()
      expect(mocks.accessPassUpdateMock).not.toHaveBeenCalled()
      expect(mocks.accessPassInsertMock).not.toHaveBeenCalled()
    })
  })

  describe("User profile handling", () => {
    it("creates a new user profile when it does not exist", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        profileError: { code: "PGRST116" }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mocks.profileInsertMock).toHaveBeenCalledWith({
        id: "user_123",
        stripe_customer_id: "cus_123"
      })
    })

    it("updates stripe_customer_id when the stored profile differs", async () => {
      const session = createCheckoutSession({ customer: "cus_new" })
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: session }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: session }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        existingProfile: {
          id: "user_123",
          stripe_customer_id: "cus_old"
        }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mocks.profileUpdateMock).toHaveBeenCalledWith({
        stripe_customer_id: "cus_new"
      })
      expect(mocks.profileUpdateEqMock).toHaveBeenCalledWith("id", "user_123")
    })

    it("skips profile update when stripe_customer_id is unchanged", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession({ customer: "cus_123" }) }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession({ customer: "cus_123" }) }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        existingProfile: {
          id: "user_123",
          stripe_customer_id: "cus_123"
        }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mocks.profileUpdateMock).not.toHaveBeenCalled()
    })
  })

  describe("Access pass handling", () => {
    it("creates a new unique access pass when the user has none", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        existingProfile: {
          id: "user_123",
          stripe_customer_id: "cus_123"
        }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mocks.checkoutEventInsertMock).toHaveBeenCalledWith({
        user_id: "user_123",
        checkout_session_id: "cs_test_123",
        plan: "PRO",
        granted_tokens: QUOTA.PRO.quota_chat_tokens
      })
      expect(mocks.accessPassInsertMock).toHaveBeenCalledWith({
        user_id: "user_123",
        plan: "PRO",
        quota_chat_tokens: QUOTA.PRO.quota_chat_tokens,
        used_chat_tokens: 0
      })
    })

    it("accumulates tokens onto the same access pass when the user already has balance", async () => {
      const session = createCheckoutSession({
        metadata: { plan: "LITE", supabase_user_id: "user_lite" }
      })
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: session }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: session }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        existingProfile: {
          id: "user_lite",
          stripe_customer_id: "cus_123"
        },
        existingAccessPass: {
          id: "pass_1",
          user_id: "user_lite",
          plan: "LITE",
          quota_chat_tokens: 500_000,
          used_chat_tokens: 120_000
        }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mocks.accessPassUpdateMock).toHaveBeenCalledWith({
        plan: "LITE",
        quota_chat_tokens: 1_000_000
      })
      expect(mocks.accessPassUpdateEqMock).toHaveBeenCalledWith("id", "pass_1")
      expect(mocks.accessPassInsertMock).not.toHaveBeenCalled()
    })

    it("accumulates tokens onto the same access pass even when it is exhausted", async () => {
      const session = createCheckoutSession({
        metadata: { plan: "PRO", supabase_user_id: "user_pro" }
      })
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: session }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: session }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        existingProfile: {
          id: "user_pro",
          stripe_customer_id: "cus_123"
        },
        existingAccessPass: {
          id: "pass_2",
          user_id: "user_pro",
          plan: "LITE",
          quota_chat_tokens: 500_000,
          used_chat_tokens: 500_000
        }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mocks.accessPassUpdateMock).toHaveBeenCalledWith({
        plan: "PRO",
        quota_chat_tokens: 1_500_000
      })
      expect(mocks.accessPassInsertMock).not.toHaveBeenCalled()
    })
  })

  describe("Database operation scenarios", () => {
    it("returns 500 when profile query fails with a non-not-found error", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      } as any)

      const { client } = buildWebhookSupabaseClient({
        profileError: { code: "PGRST301", message: "Database error" }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      expect(await response.text()).toContain("Database Error:")
    })

    it("returns 500 when access pass update fails and rolls back the checkout event", async () => {
      const session = createCheckoutSession({
        metadata: { plan: "LITE", supabase_user_id: "user_lite" }
      })
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: session }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: session }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        existingProfile: {
          id: "user_lite",
          stripe_customer_id: "cus_123"
        },
        existingAccessPass: {
          id: "pass_1",
          user_id: "user_lite",
          plan: "LITE",
          quota_chat_tokens: 500_000,
          used_chat_tokens: 0
        },
        accessPassUpdateError: { message: "update failed" }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      expect(await response.text()).toContain("Database Error:")
      expect(mocks.checkoutEventDeleteMock).toHaveBeenCalled()
      expect(mocks.checkoutEventDeleteEqMock).toHaveBeenCalledWith(
        "checkout_session_id",
        "cs_test_123"
      )
    })

    it("returns 500 when access pass insert fails and rolls back the checkout event", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "checkout.session.completed",
          data: { object: createCheckoutSession() }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: createCheckoutSession() }
      } as any)

      const { client, mocks } = buildWebhookSupabaseClient({
        existingProfile: {
          id: "user_123",
          stripe_customer_id: "cus_123"
        },
        accessPassInsertError: { message: "insert failed" }
      })
      mockCreateServerRoleClient.mockResolvedValue(client as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      expect(await response.text()).toContain("Database Error:")
      expect(mocks.checkoutEventDeleteEqMock).toHaveBeenCalledWith(
        "checkout_session_id",
        "cs_test_123"
      )
    })
  })

  describe("Event type handling", () => {
    it("returns 200 for non-checkout events", async () => {
      const mockRequest = createMockRequest(
        JSON.stringify({
          type: "invoice.paid",
          data: { object: {} }
        }),
        createMockSignature()
      )

      mockConstructEvent.mockReturnValue({
        type: "invoice.paid",
        data: { object: {} }
      } as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ received: true })
    })
  })
})
