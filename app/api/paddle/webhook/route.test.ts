/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { createServerRoleClient } from "@/lib/supabase/server-role-client"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

const { mockUnmarshal } = vi.hoisted(() => ({
  mockUnmarshal: vi.fn()
}))

vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: vi.fn(function () {
    return {
      webhooks: {
        unmarshal: mockUnmarshal
      }
    }
  })
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
}

type WebhookSupabaseOptions = {
  existingProfile?: ProfileRow | null
  profileError?: { code: string; message?: string } | null
  existingAccessPass?: AccessPassRow | null
  accessPassInsertError?: { message: string } | null
  accessPassUpdateError?: { message: string } | null
  checkoutEventInsertError?: { code?: string; message: string } | null
}

const createMockRequest = (body: string, signature = "ts=1;h1=sig") => {
  const headers = new Headers()
  headers.set("paddle-signature", signature)

  return new Request("http://localhost:3000/api/paddle/webhook", {
    method: "POST",
    headers,
    body
  })
}

const createTransactionCompletedEvent = (
  overrides: Record<string, unknown> = {}
) => ({
  eventType: "transaction.completed",
  data: {
    id: "txn_123",
    customerId: "ctm_123",
    customData: {
      supabase_user_id: "user_123",
      plan: "PRO"
    },
    ...overrides
  }
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
  const profileInsertMock = vi.fn().mockResolvedValue({ error: null })

  const accessPassMaybeSingleMock = vi.fn().mockResolvedValue({
    data: options.existingAccessPass ?? null,
    error: null
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
        insert: profileInsertMock
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
      checkoutEventInsertMock,
      checkoutEventDeleteMock,
      checkoutEventDeleteEqMock,
      profileInsertMock,
      accessPassInsertMock,
      accessPassUpdateMock,
      accessPassUpdateEqMock
    }
  }
}

describe("POST /api/paddle/webhook", () => {
  let mockCreateServerRoleClient: ReturnType<
    typeof vi.mocked<typeof createServerRoleClient>
  >

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PADDLE_API_KEY = "pdl_sdbx_test"
    process.env.PADDLE_WEBHOOK_SECRET = "pdl_ntfset_test"
    mockCreateServerRoleClient = vi.mocked(createServerRoleClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns 400 when signature verification fails", async () => {
    mockUnmarshal.mockRejectedValue(new Error("Invalid signature"))

    const response = await POST(createMockRequest("{}"))

    expect(response.status).toBe(400)
    expect(await response.text()).toContain("Webhook Error:")
  })

  it("returns 400 when required custom data is missing", async () => {
    mockUnmarshal.mockResolvedValue(
      createTransactionCompletedEvent({
        customData: { plan: "PRO" }
      })
    )

    const response = await POST(createMockRequest("{}"))

    expect(response.status).toBe(400)
    expect(await response.text()).toContain("Missing required custom data")
  })

  it("creates a new access pass when a PRO transaction completes", async () => {
    const { client, mocks } = buildWebhookSupabaseClient()
    mockCreateServerRoleClient.mockResolvedValue(client as any)
    mockUnmarshal.mockResolvedValue(createTransactionCompletedEvent())

    const response = await POST(createMockRequest("{}"))

    expect(response.status).toBe(200)
    expect(mocks.checkoutEventInsertMock).toHaveBeenCalledWith({
      user_id: "user_123",
      checkout_session_id: "txn_123",
      plan: "PRO",
      granted_tokens: 1_000_000
    })
    expect(mocks.accessPassInsertMock).toHaveBeenCalledWith({
      user_id: "user_123",
      plan: "PRO",
      quota_chat_tokens: 1_000_000,
      used_chat_tokens: 0
    })
  })

  it("accumulates tokens when the user already has a balance", async () => {
    const { client, mocks } = buildWebhookSupabaseClient({
      existingAccessPass: {
        id: "pass_123",
        user_id: "user_123",
        plan: "LITE",
        quota_chat_tokens: 100_000,
        used_chat_tokens: 50_000
      }
    })
    mockCreateServerRoleClient.mockResolvedValue(client as any)
    mockUnmarshal.mockResolvedValue(
      createTransactionCompletedEvent({
        customData: {
          supabase_user_id: "user_123",
          plan: "LITE"
        }
      })
    )

    const response = await POST(createMockRequest("{}"))

    expect(response.status).toBe(200)
    expect(mocks.accessPassUpdateMock).toHaveBeenCalledWith({
      plan: "LITE",
      quota_chat_tokens: 600_000
    })
    expect(mocks.accessPassUpdateEqMock).toHaveBeenCalledWith("id", "pass_123")
  })

  it("returns 200 without touching balances when the transaction was already processed", async () => {
    const { client, mocks } = buildWebhookSupabaseClient({
      checkoutEventInsertError: {
        code: "23505",
        message: "duplicate key value"
      }
    })
    mockCreateServerRoleClient.mockResolvedValue(client as any)
    mockUnmarshal.mockResolvedValue(createTransactionCompletedEvent())

    const response = await POST(createMockRequest("{}"))

    expect(response.status).toBe(200)
    expect(mocks.accessPassInsertMock).not.toHaveBeenCalled()
    expect(mocks.accessPassUpdateMock).not.toHaveBeenCalled()
  })

  it("rolls back the checkout event when access pass insert fails", async () => {
    const { client, mocks } = buildWebhookSupabaseClient({
      accessPassInsertError: { message: "insert failed" }
    })
    mockCreateServerRoleClient.mockResolvedValue(client as any)
    mockUnmarshal.mockResolvedValue(createTransactionCompletedEvent())

    const response = await POST(createMockRequest("{}"))

    expect(response.status).toBe(500)
    expect(mocks.checkoutEventDeleteMock).toHaveBeenCalled()
    expect(mocks.checkoutEventDeleteEqMock).toHaveBeenCalledWith(
      "checkout_session_id",
      "txn_123"
    )
  })
})
