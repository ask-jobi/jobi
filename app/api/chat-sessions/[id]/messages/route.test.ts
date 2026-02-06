/**
 * @vitest-environment node
 */
import { GET } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as chatHistoryModule from "@/lib/agent/chat-history"
import * as supabaseModule from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server")
vi.mock("@/lib/agent/chat-history")

describe("GET /api/chat-sessions/[id]/messages", () => {
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

    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(true)
    vi.mocked(chatHistoryModule.loadHistory).mockResolvedValue([
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
        createdAt: "2024-01-01T00:00:00Z"
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi there!" }],
        createdAt: "2024-01-01T00:01:00Z"
      }
    ])

    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = () => {
    return new NextRequest(
      "http://localhost:3000/api/chat-sessions/session-1/messages"
    )
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

  it("should return chat messages on success", async () => {
    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    expect(data[0].id).toBe("msg-1")
    expect(data[1].id).toBe("msg-2")
  })

  it("should call loadHistory with sessionId", async () => {
    const params = Promise.resolve({ id: "session-1" })
    await GET(createMockRequest(), { params })

    expect(vi.mocked(chatHistoryModule.loadHistory)).toHaveBeenCalledWith(
      "session-1"
    )
  })

  it("should return 500 on internal error", async () => {
    vi.mocked(chatHistoryModule.loadHistory).mockRejectedValue(
      new Error("Database error")
    )

    const params = Promise.resolve({ id: "session-1" })
    const response = await GET(createMockRequest(), { params })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe("Database error")
  })
})
