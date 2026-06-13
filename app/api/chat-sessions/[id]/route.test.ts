/**
 * @vitest-environment node
 */
import { GET, PATCH, DELETE } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as chatHistoryModule from "@/server/ai/chat/history"
import * as supabaseModule from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server")
vi.mock("@/server/ai/chat/history")

describe("GET /api/chat-sessions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockSupabaseClient = {
      auth: {
        getClaims: vi.fn()
      }
    } as any
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    vi.mocked(mockSupabaseClient.auth.getClaims).mockResolvedValue({
      data: { claims: { sub: "test-user-id" } },
      error: null
    })

    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(true)
    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue({
      id: "session-1",
      title: "Test Chat",
      resumeId: "resume-123",
      status: "active",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      messageCount: 5,
      totalTokens: 150,
      totalInputTokens: 100,
      totalOutputTokens: 30,
      totalCachedTokens: 15,
      totalReasoningTokens: 5
    })

    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = () => {
    return new NextRequest("http://localhost:3000/api/chat-sessions/session-1")
  }

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(supabaseModule.createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new Error("Not authenticated")
        })
      }
    } as any)

    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(401)
  })

  it("should return 403 when user does not own the session", async () => {
    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(false)

    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(403)
  })

  it("should return session data on success", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.id).toBe("session-1")
    expect(data.data.totalTokens).toBe(150)
    expect(data.data.totalCachedTokens).toBe(15)
  })

  it("should return 500 on internal error", async () => {
    vi.mocked(chatHistoryModule.getSessionSummary).mockRejectedValue(
      new Error("Database error")
    )

    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(500)
  })
})

describe("PATCH /api/chat-sessions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockSupabaseClient = {
      auth: {
        getClaims: vi.fn()
      }
    } as any
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    vi.mocked(mockSupabaseClient.auth.getClaims).mockResolvedValue({
      data: { claims: { sub: "test-user-id" } },
      error: null
    })

    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(true)
    vi.mocked(chatHistoryModule.updateSessionStatus).mockResolvedValue()
    vi.mocked(chatHistoryModule.updateSessionTitle).mockResolvedValue()
    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue({
      id: "session-1",
      title: "Updated Chat",
      resumeId: "resume-123",
      status: "completed",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      messageCount: 5,
      totalTokens: 150,
      totalInputTokens: 100,
      totalOutputTokens: 30,
      totalCachedTokens: 15,
      totalReasoningTokens: 5
    })

    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: any) => {
    return new NextRequest(
      "http://localhost:3000/api/chat-sessions/session-1",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    )
  }

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(supabaseModule.createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new Error("Not authenticated")
        })
      }
    } as any)

    const params = Promise.resolve({ id: "session-1" })
    const response = await PATCH(createMockRequest({ status: "completed" }), {
      params
    })

    expect(response.status).toBe(401)
  })

  it("should return 403 when user does not own the session", async () => {
    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(false)

    const params = Promise.resolve({ id: "session-1" })
    const response = await PATCH(createMockRequest({ status: "completed" }), {
      params
    })

    expect(response.status).toBe(403)
  })

  it("should return 400 when status is invalid", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await PATCH(createMockRequest({ status: "invalid" }), {
      params
    })

    expect(response.status).toBe(400)
  })

  it("should return 400 when title is too long", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await PATCH(
      createMockRequest({ title: "a".repeat(201) }),
      {
        params
      }
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.details[0].message).toContain("200 characters")
  })

  it("should update session status", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await PATCH(createMockRequest({ status: "completed" }), {
      params
    })

    expect(response.status).toBe(200)
    expect(
      vi.mocked(chatHistoryModule.updateSessionStatus)
    ).toHaveBeenCalledWith("session-1", "completed")
  })

  it("should update session title", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await PATCH(
      createMockRequest({ title: "Tailor for PM role" }),
      {
        params
      }
    )

    expect(response.status).toBe(200)
    expect(
      vi.mocked(chatHistoryModule.updateSessionTitle)
    ).toHaveBeenCalledWith("session-1", "Tailor for PM role")
  })

  it("should return 500 on internal error", async () => {
    vi.mocked(chatHistoryModule.updateSessionStatus).mockRejectedValue(
      new Error("Database error")
    )

    const params = Promise.resolve({ id: "session-1" })
    const response = await PATCH(createMockRequest({ status: "completed" }), {
      params
    })

    expect(response.status).toBe(500)
  })
})

describe("DELETE /api/chat-sessions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockSupabaseClient = {
      auth: {
        getClaims: vi.fn()
      }
    } as any
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    vi.mocked(mockSupabaseClient.auth.getClaims).mockResolvedValue({
      data: { claims: { sub: "test-user-id" } },
      error: null
    })

    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(true)
    vi.mocked(chatHistoryModule.permanentlyDeleteSession).mockResolvedValue()

    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = () => {
    return new NextRequest(
      "http://localhost:3000/api/chat-sessions/session-1",
      {
        method: "DELETE"
      }
    )
  }

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(supabaseModule.createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new Error("Not authenticated")
        })
      }
    } as any)

    const params = Promise.resolve({ id: "session-1" })
    const response = await DELETE(createMockRequest(), { params })

    expect(response.status).toBe(401)
  })

  it("should return 403 when user does not own the session", async () => {
    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(false)

    const params = Promise.resolve({ id: "session-1" })
    const response = await DELETE(createMockRequest(), { params })

    expect(response.status).toBe(403)
  })

  it("should permanently delete session on success", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await DELETE(createMockRequest(), { params })

    expect(response.status).toBe(200)
    expect(
      vi.mocked(chatHistoryModule.permanentlyDeleteSession)
    ).toHaveBeenCalledWith("session-1")
  })

  it("should return 500 on internal error", async () => {
    vi.mocked(chatHistoryModule.permanentlyDeleteSession).mockRejectedValue(
      new Error("Database error")
    )

    const params = Promise.resolve({ id: "session-1" })
    const response = await DELETE(createMockRequest(), { params })

    expect(response.status).toBe(500)
  })
})
