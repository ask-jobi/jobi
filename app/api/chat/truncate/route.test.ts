/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as chatHistoryModule from "@/lib/agent/chat-history"
import * as supabaseModule from "@/lib/supabase/server"
import * as resumeModule from "@/server/resume"

vi.mock("@/lib/supabase/server")
vi.mock("@/lib/agent/chat-history")
vi.mock("@/server/resume")
vi.mock("@/server/chat-events", () => ({
  logRollback: vi.fn().mockResolvedValue(undefined)
}))

describe("POST /api/chat/truncate", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn()
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "msg-1",
                session_id: "session-1"
              },
              error: null
            })
          })
        })
      })
    } as any
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null
    })

    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(true)
    vi.mocked(chatHistoryModule.getMessage).mockResolvedValue({
      id: "msg-1",
      session_id: "session-1",
      role: "user" as const,
      parts: [],
      truncated: false,
      has_tools: false,
      created_at: "2024-01-01T00:00:00Z",
      input_tokens: 0,
      output_tokens: 0,
      cached_tokens: 0,
      reasoning_tokens: 0
    })
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([])
    vi.mocked(chatHistoryModule.truncateMessages).mockResolvedValue()
    vi.mocked(
      chatHistoryModule.restoreConversationSummaryAfterTruncate
    ).mockResolvedValue()
    vi.mocked(chatHistoryModule.extractToolOriginalValues).mockReturnValue([])

    vi.mocked(resumeModule.getJobApplicationByResumeId).mockResolvedValue({
      id: "app-1",
      resumes: {
        resume_json: {
          personalInfo: { entryId: "p1", firstName: "John", lastName: "Doe" },
          education: { entries: [] }
        }
      }
    } as any)
    vi.mocked(resumeModule.getApplicationResumeData).mockResolvedValue({
      personalInfo: { entryId: "p1", firstName: "John" }
    } as any)
    vi.mocked(resumeModule.saveApplicationResumeChange).mockResolvedValue()

    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: { messageId: string }): NextRequest => {
    return new NextRequest("http://localhost:3000/api/chat/truncate", {
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
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it("should return 400 when messageId is invalid", async () => {
    const request = createMockRequest({
      messageId: "invalid-uuid"
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it("should return 404 when message not found", async () => {
    vi.mocked(supabaseModule.createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Not found")
            })
          })
        })
      })
    } as any)

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
  })

  it("should return 403 when user does not own the session", async () => {
    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(false)

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it("should return 404 when session not found", async () => {
    vi.mocked(supabaseModule.createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Session not found")
            })
          })
        })
      })
    } as any)

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
  })

  it("should truncate messages and return resume data on success", async () => {
    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.resume).toBeDefined()
  })

  it("should call truncateMessages with correct messages", async () => {
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant",
        parts: [],
        truncated: false,
        has_tools: false,
        created_at: "2024-01-01T00:01:00Z",
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        reasoning_tokens: 0
      }
    ])

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    await POST(request)

    expect(vi.mocked(chatHistoryModule.truncateMessages)).toHaveBeenCalled()
  })

  it("should return 500 on internal error", async () => {
    vi.mocked(chatHistoryModule.getMessage).mockRejectedValue(
      new Error("Database error")
    )

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
  })
})
