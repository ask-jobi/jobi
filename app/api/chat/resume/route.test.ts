/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as chatHistoryModule from "@/lib/agent/chat-history"
import * as supabaseModule from "@/lib/supabase/server"
import * as aiModule from "ai"

vi.mock("@/lib/supabase/server")
vi.mock("@/lib/agent/chat-history", () => ({
  getLatestValidSummaryCheckpoint: vi.fn().mockResolvedValue(null),
  loadHistory: vi.fn().mockResolvedValue([]),
  loadMessagesAfter: vi.fn().mockResolvedValue([]),
  saveMessage: vi.fn().mockResolvedValue({
    id: "test-message-id",
    session_id: "test-session-id"
  }),
  updateMessage: vi.fn().mockResolvedValue({ id: "test-message-id" }),
  updateConversationSummary: vi.fn().mockResolvedValue(undefined),
  getSessionSummary: vi.fn().mockResolvedValue({
    id: "test-session-id",
    title: "Resume Chat",
    resumeId: "test-resume-id",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0
  }),
  updateSessionTokenUsage: vi.fn().mockResolvedValue(undefined)
}))
vi.mock("@/lib/agent/system-prompt")
vi.mock("@/lib/agent/tools")
vi.mock("@/lib/agent/model", () => ({
  model: {}
}))
vi.mock("@/lib/utils", () => ({
  generateUUID: vi.fn(() => "mock-uuid")
}))
vi.mock("@/server/quota")
vi.mock("@/server/resume", () => ({
  getJobApplicationByResumeId: vi.fn().mockResolvedValue({
    resumes: {
      resume_json: {},
      language: "en",
      evaluation_report: {}
    },
    jobs: "mock job description"
  })
}))
vi.mock("@/server/ai/prompts/resume-chat.prompt", () => ({
  default: {
    format: vi.fn(() => "mocked prompt")
  }
}))
vi.mock("@/server/chat-events", () => ({
  logSummaryCheckpoint: vi.fn().mockResolvedValue(undefined),
  logResumeModification: vi.fn().mockResolvedValue(undefined)
}))

vi.mock("ai", () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  smoothStream: vi.fn(),
  stepCountIs: vi.fn(),
  validateUIMessages: vi.fn().mockResolvedValue([]),
  createUIMessageStream: vi.fn().mockReturnValue({
    pipe: vi.fn()
  }),
  createUIMessageStreamResponse: vi
    .fn()
    .mockImplementation(() => new Response(null, { status: 200 })),
  generateText: vi.fn(),
  tool: vi.fn()
}))

describe("POST /api/chat/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase client
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn()
      }
    } as any
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    // Default auth behavior - authenticated
    vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null
    })

    // Mock chat history functions
    vi.mocked(chatHistoryModule.loadHistory).mockResolvedValue([])

    vi.mocked(chatHistoryModule.saveMessage).mockResolvedValue({
      id: "test-message-id",
      session_id: "test-session-id"
    } as any)

    vi.mocked(chatHistoryModule.updateMessage).mockResolvedValue({
      id: "test-message-id"
    } as any)

    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue({
      id: "test-session-id",
      title: "Resume Chat",
      resumeId: "test-resume-id",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0
    } as any)

    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: {
    message: {
      role: string
      content?: string
      parts?: Array<{ type: string; text: string }>
      id?: string
    }
    id?: string
  }): NextRequest => {
    return new NextRequest("http://localhost:3000/api/chat/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Override default auth mock to return unauthenticated
      vi.mocked(supabaseModule.createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Not authenticated")
          })
        }
      } as any)

      const request = createMockRequest({
        message: {
          role: "user",
          content: "Hello",
          parts: [{ type: "text", text: "Hello" }],
          id: "test-msg-id"
        },
        id: "test-session-id"
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe("Message Persistence", () => {
    it("should not throw when processing valid request", async () => {
      const request = createMockRequest({
        message: {
          role: "user",
          content: "Hello",
          parts: [{ type: "text", text: "Hello" }],
          id: "test-msg-id"
        },
        id: "test-session-id"
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it("should persist usage from streamText onFinish", async () => {
      const streamCallbacks: Promise<unknown>[] = []

      vi.mocked(aiModule.streamText).mockImplementation(() => {
        return {
          toUIMessageStream: vi.fn()
        } as any
      })

      vi.mocked(aiModule.createUIMessageStream).mockImplementation(
        ({ execute, onFinish }: any) => {
          streamCallbacks.push(
            Promise.resolve(
              execute({
                writer: {
                  merge: vi.fn()
                }
              })
            ).then(() =>
              onFinish({
                messages: [
                  {
                    id: "test-msg-id",
                    role: "user",
                    parts: [{ type: "text", text: "Hello" }]
                  },
                  {
                    id: "assistant-msg-id",
                    role: "assistant",
                    parts: [{ type: "text", text: "Hi there" }]
                  }
                ],
                responseMessage: {
                  id: "assistant-msg-id",
                  role: "assistant",
                  parts: [{ type: "text", text: "Hi there" }],
                  metadata: {
                    tokenUsage: {
                      inputTokens: 1,
                      outputTokens: 270,
                      cachedTokens: 4242,
                      reasoningTokens: 0,
                      totalTokens: 4513
                    }
                  }
                }
              })
            )
          )

          return {
            pipe: vi.fn()
          } as any
        }
      )

      const request = createMockRequest({
        message: {
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
          id: "test-msg-id"
        },
        id: "test-session-id"
      })

      await POST(request)
      await Promise.all(streamCallbacks)

      expect(chatHistoryModule.updateMessage).toHaveBeenCalledWith({
        messageId: "test-msg-id",
        parts: [{ type: "text", text: "Hello" }]
      })
      expect(chatHistoryModule.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "assistant-msg-id",
          sessionId: "test-session-id",
          role: "assistant",
          parts: [{ type: "text", text: "Hi there" }],
          tokenCount: 4513,
          inputTokens: 1,
          outputTokens: 270,
          cachedTokens: 4242,
          reasoningTokens: 0
        })
      )
      expect(chatHistoryModule.updateSessionTokenUsage).toHaveBeenCalledWith(
        "test-session-id"
      )
    })
  })

  describe("Error Handling", () => {
    it("should return 500 on internal error", async () => {
      vi.mocked(chatHistoryModule.loadHistory).mockRejectedValue(
        new Error("Database error")
      )

      const request = createMockRequest({
        message: {
          role: "user",
          content: "Hello",
          parts: [{ type: "text", text: "Hello" }],
          id: "test-msg-id"
        },
        id: "test-session-id"
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
