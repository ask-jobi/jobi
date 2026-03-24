/**
 * @vitest-environment node
 */
import { GET, POST } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as chatHistoryModule from "@/lib/agent/chat-history"
import * as supabaseModule from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server")
vi.mock("@/lib/agent/chat-history")

describe("GET /api/chat-sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return empty array when resumeId is not provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat-sessions")
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual([])
  })

  it("should call listSessions with resumeId", async () => {
    vi.mocked(chatHistoryModule.listSessions).mockResolvedValue([
      {
        id: "session-1",
        title: "Chat 1",
        resumeId: "resume-123",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        messageCount: 5
      }
    ])

    const request = new NextRequest(
      "http://localhost:3000/api/chat-sessions?resumeId=resume-123"
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(vi.mocked(chatHistoryModule.listSessions)).toHaveBeenCalledWith(
      "resume-123"
    )
  })

  it("should return 500 on error", async () => {
    vi.mocked(chatHistoryModule.listSessions).mockRejectedValue(
      new Error("Database error")
    )

    const request = new NextRequest(
      "http://localhost:3000/api/chat-sessions?resumeId=resume-123"
    )
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe("Database error")
  })
})

describe("POST /api/chat-sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn()
      }
    } as any
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null
    })

    vi.mocked(chatHistoryModule.createSession).mockResolvedValue({
      id: "new-session-id",
      user_id: "test-user-id",
      resume_id: "resume-123",
      title: "New Chat",
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    } as any)

    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: { resumeId: string }): NextRequest => {
    return new NextRequest("http://localhost:3000/api/chat-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(supabaseModule.createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Not authenticated")
        })
      }
    } as any)

    const request = createMockRequest({
      resumeId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it("should return 400 when resumeId is invalid", async () => {
    const request = createMockRequest({
      resumeId: "invalid-uuid"
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Invalid request parameters")
  })

  it("should return 400 when resumeId is missing", async () => {
    const request = createMockRequest({
      resumeId: ""
    } as any)
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it("should create session without title", async () => {
    const request = createMockRequest({
      resumeId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(vi.mocked(chatHistoryModule.createSession)).toHaveBeenCalledWith({
      userId: "test-user-id",
      resumeId: "550e8400-e29b-41d4-a716-446655440000"
    })
  })

  it("should return 500 on internal error", async () => {
    vi.mocked(chatHistoryModule.createSession).mockRejectedValue(
      new Error("Database error")
    )

    const request = createMockRequest({
      resumeId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe("Database error")
  })
})
