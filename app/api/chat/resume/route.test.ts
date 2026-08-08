/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("ai", () => ({
  convertToModelMessages: vi.fn(),
  createUIMessageStream: vi.fn(),
  createUIMessageStreamResponse: vi.fn(() => new Response("stream")),
  smoothStream: vi.fn(),
  stepCountIs: vi.fn(),
  streamText: vi.fn(),
  validateUIMessages: vi.fn()
}))

vi.mock("@/lib/agent/tools", () => ({ tools: {} }))

vi.mock("@/server/ai/chat/history", () => ({
  getLatestValidSummaryCheckpoint: vi.fn(),
  loadHistory: vi.fn(),
  loadMessagesAfter: vi.fn(),
  saveMessage: vi.fn(),
  updateMessage: vi.fn(),
  updateConversationSummary: vi.fn(),
  getSessionSummary: vi.fn(),
  updateSessionTitle: vi.fn()
}))

vi.mock("@/server/ai/chat/session-title-generator", () => ({
  generateChatSessionTitle: vi.fn()
}))

vi.mock("@/server/ai/chat/conversation-summary", () => ({
  generateConversationSummary: vi.fn()
}))

vi.mock("@/server/resume", () => ({
  getJobApplicationByResumeId: vi.fn()
}))

vi.mock("@/server/ai/model", () => ({ model: {} }))
vi.mock("@/lib/utils", () => ({ generateUUID: vi.fn(() => "generated-id") }))
vi.mock("@/server/ai/prompts/resume-chat.prompt", () => ({
  default: { format: vi.fn(() => "prompt") }
}))
vi.mock("@/server/chat-events", () => ({ logSummaryCheckpoint: vi.fn() }))
vi.mock("@/server/ai/chat/tools/registry", () => ({
  createResumeChatServerTools: vi.fn(() => ({}))
}))
vi.mock("@/lib/db/client", () => ({
  getDatabase: vi.fn(async () => ({}))
}))

vi.mock("@/server/auth-helper", () => {
  class ApiError extends Error {
    constructor(
      message: string,
      public statusCode: number
    ) {
      super(message)
    }
  }

  return {
    ApiError,
    requireVerifiedUserIdentity: vi.fn(),
    verifyOwnership: vi.fn(),
    handleApiError: vi.fn((error: unknown) => {
      if (error instanceof ApiError) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode }
        )
      }
      return Response.json({ error: "Internal server error" }, { status: 500 })
    })
  }
})

function createRequest() {
  return new NextRequest("http://localhost:3000/api/chat/resume", {
    method: "POST",
    body: JSON.stringify({
      id: "session-1",
      message: {
        id: "message-1",
        role: "user",
        parts: [{ type: "text", text: "hello" }]
      }
    })
  })
}

async function mockSuccessfulContext() {
  const auth = await import("@/server/auth-helper")
  const history = await import("@/server/ai/chat/history")
  const resume = await import("@/server/resume")
  const ai = await import("ai")

  vi.mocked(auth.requireVerifiedUserIdentity).mockResolvedValue({
    id: "user-1"
  } as never)
  vi.mocked(auth.verifyOwnership).mockResolvedValue(undefined)
  vi.mocked(history.getSessionSummary).mockResolvedValue({
    id: "session-1",
    resumeId: "resume-1",
    title: "Existing chat",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    messageCount: 0
  } as never)
  vi.mocked(history.getLatestValidSummaryCheckpoint).mockResolvedValue(null)
  vi.mocked(history.loadHistory).mockResolvedValue([])
  vi.mocked(history.saveMessage).mockResolvedValue({} as never)
  vi.mocked(history.updateMessage).mockResolvedValue()
  vi.mocked(resume.getJobApplicationByResumeId).mockResolvedValue({
    resumes: {
      resume_json: {},
      current_revision: 1,
      language: "en",
      evaluation_report: {}
    },
    jobs: { id: "job-1", description: "job description" }
  } as never)
  vi.mocked(ai.validateUIMessages).mockImplementation(
    async ({ messages }) => messages as never
  )
  vi.mocked(ai.convertToModelMessages).mockResolvedValue([] as never)
  vi.mocked(ai.streamText).mockReturnValue({
    toUIMessageStream: () => []
  } as never)

  return { auth, history, ai }
}

describe("POST /api/chat/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("verifies ownership before loading chat context", async () => {
    const auth = await import("@/server/auth-helper")
    const history = await import("@/server/ai/chat/history")
    const route = await import("./route")

    vi.mocked(auth.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
    vi.mocked(auth.verifyOwnership).mockRejectedValue(
      new auth.ApiError("Forbidden", 403)
    )

    const response = await route.POST(createRequest())

    expect(response.status).toBe(403)
    expect(auth.verifyOwnership).toHaveBeenCalledWith("session-1", "user-1")
    expect(history.getSessionSummary).not.toHaveBeenCalled()
  })

  it("persists the user and assistant messages without usage metadata", async () => {
    const { history, ai } = await mockSuccessfulContext()
    const route = await import("./route")
    let finishPromise: Promise<void> | undefined

    vi.mocked(ai.createUIMessageStream).mockImplementation(
      ({ execute, onFinish }) => {
        finishPromise = (async () => {
          await execute({
            writer: { write: vi.fn(), merge: vi.fn() }
          } as never)
          await onFinish?.({
            messages: [
              {
                id: "message-1",
                role: "user",
                parts: [{ type: "text", text: "hello" }]
              },
              {
                id: "assistant-1",
                role: "assistant",
                parts: [{ type: "text", text: "hi" }]
              }
            ],
            responseMessage: {
              id: "assistant-1",
              role: "assistant",
              parts: [{ type: "text", text: "hi" }]
            }
          } as never)
        })()
        return [] as never
      }
    )

    const request = createRequest()
    const response = await route.POST(request)
    await finishPromise

    expect(response.status).toBe(200)
    expect(ai.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: request.signal,
        maxOutputTokens: 2048,
        timeout: {
          totalMs: 120000,
          stepMs: 60000,
          chunkMs: 30000
        }
      })
    )
    expect(history.saveMessage).toHaveBeenCalledWith({
      id: "message-1",
      sessionId: "session-1",
      role: "user",
      parts: [{ type: "text", text: "hello" }]
    })
    expect(history.saveMessage).toHaveBeenCalledWith({
      id: "assistant-1",
      sessionId: "session-1",
      role: "assistant",
      parts: [{ type: "text", text: "hi" }]
    })
  })

  it("maps provider and timeout failures to retryable messages", async () => {
    const { ai } = await mockSuccessfulContext()
    const route = await import("./route")
    let mapStreamError: ((error: unknown) => string) | undefined

    vi.mocked(ai.createUIMessageStream).mockImplementation(
      ({ execute, onError }) => {
        mapStreamError = onError
        void execute({
          writer: { write: vi.fn(), merge: vi.fn() }
        } as never)
        return [] as never
      }
    )

    const response = await route.POST(createRequest())

    expect(response.status).toBe(200)
    expect(mapStreamError?.(new Error("provider failed"))).toBe(
      "The chat response could not be completed. Please retry."
    )
    expect(
      mapStreamError?.(new DOMException("timed out", "TimeoutError"))
    ).toBe("The chat response took too long. Please retry.")
  })
})
