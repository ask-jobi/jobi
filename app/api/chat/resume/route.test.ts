/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("ai", () => ({
  convertToModelMessages: vi.fn(),
  createUIMessageStream: vi.fn(({ execute }) => {
    const chunks: unknown[] = []
    execute({
      writer: {
        write: (part: unknown) => {
          chunks.push(part)
        }
      }
    })
    return chunks
  }),
  createUIMessageStreamResponse: vi.fn(() => {
    return new Response("stream", { status: 200 })
  }),
  generateText: vi.fn(),
  smoothStream: vi.fn(),
  stepCountIs: vi.fn(),
  streamText: vi.fn(),
  validateUIMessages: vi.fn()
}))

vi.mock("@/lib/agent/tools", () => ({
  tools: {}
}))

vi.mock("@/server/ai/chat/history", () => ({
  getLatestValidSummaryCheckpoint: vi.fn(),
  loadHistory: vi.fn(),
  loadMessagesAfter: vi.fn(),
  saveMessage: vi.fn(),
  updateMessage: vi.fn(),
  updateConversationSummary: vi.fn(),
  getSessionSummary: vi.fn(),
  updateSessionTitle: vi.fn(),
  updateSessionTokenUsage: vi.fn()
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

vi.mock("@/server/ai/model", () => ({
  model: {}
}))

vi.mock("@/lib/utils", () => ({
  generateUUID: vi.fn()
}))

vi.mock("@/server/ai/prompts/resume-chat.prompt", () => ({
  default: {
    format: vi.fn()
  }
}))

vi.mock("@/server/chat-events", () => ({
  logSummaryCheckpoint: vi.fn(),
  logResumeModification: vi.fn()
}))

vi.mock("@/lib/agent/token-usage", () => ({
  parseTokenUsage: vi.fn()
}))

vi.mock("@/server/ai/chat/tools/registry", () => ({
  createResumeChatServerTools: vi.fn(() => ({}))
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({}))
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

vi.mock("@/server/quota", () => ({
  buildChatTokenQuota: vi.fn(),
  consumeChatTokens: vi.fn(),
  getActiveAccessPass: vi.fn(),
  verifyChatTokenQuota: vi.fn()
}))

describe("POST /api/chat/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("verifies session ownership before loading chat context", async () => {
    const authHelpers = await import("@/server/auth-helper")
    const quotaModule = await import("@/server/quota")
    const chatHistoryModule = await import("@/server/ai/chat/history")
    const routeModule = await import("./route")

    vi.mocked(authHelpers.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
    vi.mocked(authHelpers.verifyOwnership).mockRejectedValueOnce(
      new authHelpers.ApiError("Forbidden", 403)
    )

    const request = new NextRequest("http://localhost:3000/api/chat/resume", {
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

    const response = await routeModule.POST(request)

    expect(response.status).toBe(403)
    expect(authHelpers.verifyOwnership).toHaveBeenCalledWith(
      "session-1",
      "user-1"
    )
    expect(quotaModule.getActiveAccessPass).not.toHaveBeenCalled()
    expect(chatHistoryModule.getSessionSummary).not.toHaveBeenCalled()
  })

  it("should reject sending a message when chat token quota is exhausted", async () => {
    const authHelpers = await import("@/server/auth-helper")
    const quotaModule = await import("@/server/quota")
    const chatHistoryModule = await import("@/server/ai/chat/history")
    const aiModule = await import("ai")
    const routeModule = await import("./route")

    vi.mocked(authHelpers.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
    vi.mocked(quotaModule.getActiveAccessPass).mockResolvedValue({
      id: "pass-1"
    } as never)
    vi.mocked(quotaModule.buildChatTokenQuota).mockReturnValue({
      used: 100000,
      limit: 100000
    })
    vi.mocked(quotaModule.verifyChatTokenQuota).mockImplementation(() => {
      throw new Error("Chat token limit reached")
    })

    const request = new NextRequest("http://localhost:3000/api/chat/resume", {
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

    const response = await routeModule.POST(request)

    expect(response.status).toBe(200)
    expect(aiModule.createUIMessageStreamResponse).toHaveBeenCalled()
    expect(chatHistoryModule.saveMessage).not.toHaveBeenCalled()
  })

  it("should update session token usage after message persistence completes", async () => {
    const authHelpers = await import("@/server/auth-helper")
    const quotaModule = await import("@/server/quota")
    const chatHistoryModule = await import("@/server/ai/chat/history")
    const chatSessionTitleModule =
      await import("@/server/ai/chat/session-title-generator")
    const resumeModule = await import("@/server/resume")
    const aiModule = await import("ai")
    const promptModule = await import("@/server/ai/prompts/resume-chat.prompt")
    const routeModule = await import("./route")

    const events: string[] = []
    let onFinishPromise: Promise<void> | null = null

    vi.mocked(authHelpers.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
    vi.mocked(quotaModule.getActiveAccessPass).mockResolvedValue(null as never)
    vi.mocked(quotaModule.verifyChatTokenQuota).mockImplementation(() => {})
    vi.mocked(quotaModule.buildChatTokenQuota).mockReturnValue({
      used: 0,
      limit: 0
    })

    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue({
      id: "session-1",
      resumeId: "resume-1",
      title: "New Chat",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 1
    } as never)
    vi.mocked(
      chatHistoryModule.getLatestValidSummaryCheckpoint
    ).mockResolvedValue(null)
    vi.mocked(
      chatSessionTitleModule.generateChatSessionTitle
    ).mockResolvedValue("Tailor resume for PM role")
    vi.mocked(chatHistoryModule.loadHistory).mockResolvedValue([])
    vi.mocked(chatHistoryModule.saveMessage).mockImplementation(async () => {
      events.push("save")
      return {} as never
    })
    vi.mocked(chatHistoryModule.updateMessage).mockImplementation(async () => {
      events.push("update")
    })
    vi.mocked(chatHistoryModule.updateSessionTokenUsage).mockImplementation(
      async () => {
        expect(events).toEqual(["save", "update"])
      }
    )

    vi.mocked(resumeModule.getJobApplicationByResumeId).mockResolvedValue({
      resumes: {
        resume_json: {},
        language: "en",
        evaluation_report: {}
      },
      jobs: "job description"
    } as never)

    vi.mocked(promptModule.default.format).mockReturnValue("prompt")
    vi.mocked(aiModule.validateUIMessages).mockImplementation(
      async ({ messages }) => messages as never
    )
    vi.mocked(aiModule.convertToModelMessages).mockResolvedValue([] as never)
    vi.mocked(aiModule.streamText).mockReturnValue({
      toUIMessageStream: () => []
    } as never)
    const dataWriterWrite = vi.fn()
    vi.mocked(aiModule.createUIMessageStream).mockImplementation(
      ({ execute, onFinish }) => {
        onFinishPromise = (async () => {
          await execute({
            writer: {
              write: dataWriterWrite,
              merge: vi.fn()
            }
          } as never)

          await onFinish?.({
            messages: [
              {
                id: "message-1",
                role: "user",
                parts: [{ type: "text", text: "hello" }]
              },
              {
                id: "message-2",
                role: "assistant",
                parts: [{ type: "text", text: "hi" }]
              }
            ],
            responseMessage: {
              id: "message-2",
              role: "assistant",
              parts: [{ type: "text", text: "hi" }],
              metadata: {
                tokenUsage: {
                  inputTokens: 10,
                  outputTokens: 20,
                  cachedTokens: 0,
                  reasoningTokens: 0,
                  totalTokens: 30
                }
              }
            }
          } as never)
        })()

        return [] as never
      }
    )

    const request = new NextRequest("http://localhost:3000/api/chat/resume", {
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

    const response = await routeModule.POST(request)
    await onFinishPromise

    expect(response.status).toBe(200)
    expect(chatHistoryModule.updateMessage).toHaveBeenCalledOnce()
    expect(chatHistoryModule.saveMessage).toHaveBeenCalledTimes(2)
    expect(chatHistoryModule.updateSessionTokenUsage).toHaveBeenCalledWith(
      "session-1"
    )
    expect(chatHistoryModule.updateSessionTitle).toHaveBeenCalledWith(
      "session-1",
      "Tailor resume for PM role"
    )
  })

  it("persists AI SDK tool output-error and error parts with assistant history", async () => {
    const authHelpers = await import("@/server/auth-helper")
    const quotaModule = await import("@/server/quota")
    const chatHistoryModule = await import("@/server/ai/chat/history")
    const resumeModule = await import("@/server/resume")
    const aiModule = await import("ai")
    const promptModule = await import("@/server/ai/prompts/resume-chat.prompt")
    const routeModule = await import("./route")

    let onFinishPromise: Promise<void> | null = null
    const assistantParts = [
      {
        type: "tool-resumeEditorModify",
        toolCallId: "tool-1",
        state: "output-error",
        input: {
          operation: "delete",
          entity: "education",
          id: "missing-entry"
        },
        errorText: "Entry with id missing-entry not found"
      },
      {
        type: "error",
        errorText: "The model stopped after a tool failure"
      }
    ]

    vi.mocked(authHelpers.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
    vi.mocked(quotaModule.getActiveAccessPass).mockResolvedValue(null as never)
    vi.mocked(quotaModule.verifyChatTokenQuota).mockImplementation(() => {})
    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue({
      id: "session-1",
      resumeId: "resume-1",
      title: "Existing chat",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 1
    } as never)
    vi.mocked(
      chatHistoryModule.getLatestValidSummaryCheckpoint
    ).mockResolvedValue(null)
    vi.mocked(chatHistoryModule.loadHistory).mockResolvedValue([])
    vi.mocked(chatHistoryModule.saveMessage).mockResolvedValue({} as never)
    vi.mocked(chatHistoryModule.updateMessage).mockResolvedValue()

    vi.mocked(resumeModule.getJobApplicationByResumeId).mockResolvedValue({
      resumes: {
        resume_json: {},
        current_revision: 1,
        language: "en",
        evaluation_report: {}
      },
      jobs: "job description"
    } as never)

    vi.mocked(promptModule.default.format).mockReturnValue("prompt")
    vi.mocked(aiModule.validateUIMessages).mockImplementation(
      async ({ messages }) => messages as never
    )
    vi.mocked(aiModule.convertToModelMessages).mockResolvedValue([] as never)
    vi.mocked(aiModule.streamText).mockReturnValue({
      toUIMessageStream: () => []
    } as never)
    vi.mocked(aiModule.createUIMessageStream).mockImplementation(
      ({ execute, onFinish }) => {
        onFinishPromise = (async () => {
          await execute({
            writer: {
              write: vi.fn(),
              merge: vi.fn()
            }
          } as never)

          await onFinish?.({
            messages: [
              {
                id: "message-1",
                role: "user",
                parts: [{ type: "text", text: "delete missing entry" }]
              },
              {
                id: "assistant-1",
                role: "assistant",
                parts: assistantParts
              }
            ],
            responseMessage: {
              id: "assistant-1",
              role: "assistant",
              parts: assistantParts,
              metadata: {}
            }
          } as never)
        })()

        return [] as never
      }
    )

    const request = new NextRequest("http://localhost:3000/api/chat/resume", {
      method: "POST",
      body: JSON.stringify({
        id: "session-1",
        message: {
          id: "message-1",
          role: "user",
          parts: [{ type: "text", text: "delete missing entry" }]
        }
      })
    })

    const response = await routeModule.POST(request)
    await onFinishPromise

    expect(response.status).toBe(200)
    expect(chatHistoryModule.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "assistant-1",
        role: "assistant",
        parts: assistantParts
      })
    )
  })

  it("should re-check quota before consuming tokens on finish", async () => {
    const authHelpers = await import("@/server/auth-helper")
    const quotaModule = await import("@/server/quota")
    const chatHistoryModule = await import("@/server/ai/chat/history")
    const resumeModule = await import("@/server/resume")
    const aiModule = await import("ai")
    const promptModule = await import("@/server/ai/prompts/resume-chat.prompt")
    const routeModule = await import("./route")

    let onFinishPromise: Promise<void> | null = null

    vi.mocked(authHelpers.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
    vi.mocked(quotaModule.getActiveAccessPass)
      .mockResolvedValueOnce({ id: "pass-1" } as never)
      .mockResolvedValueOnce(null as never)
    vi.mocked(quotaModule.verifyChatTokenQuota).mockImplementation(() => {})
    vi.mocked(quotaModule.buildChatTokenQuota).mockReturnValue({
      used: 0,
      limit: 100
    })

    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue({
      id: "session-1",
      resumeId: "resume-1",
      title: "New Chat",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 1
    } as never)
    vi.mocked(
      chatHistoryModule.getLatestValidSummaryCheckpoint
    ).mockResolvedValue(null)
    vi.mocked(chatHistoryModule.loadHistory).mockResolvedValue([])
    vi.mocked(chatHistoryModule.saveMessage).mockResolvedValue({} as never)
    vi.mocked(chatHistoryModule.updateMessage).mockResolvedValue()

    vi.mocked(resumeModule.getJobApplicationByResumeId).mockResolvedValue({
      resumes: {
        resume_json: {},
        language: "en",
        evaluation_report: {}
      },
      jobs: "job description"
    } as never)

    vi.mocked(promptModule.default.format).mockReturnValue("prompt")
    vi.mocked(aiModule.validateUIMessages).mockImplementation(
      async ({ messages }) => messages as never
    )
    vi.mocked(aiModule.convertToModelMessages).mockResolvedValue([] as never)
    vi.mocked(aiModule.streamText).mockReturnValue({
      toUIMessageStream: () => []
    } as never)
    vi.mocked(aiModule.createUIMessageStream).mockImplementation(
      ({ execute, onFinish }) => {
        onFinishPromise = (async () => {
          await execute({
            writer: {
              write: vi.fn(),
              merge: vi.fn()
            }
          } as never)

          await onFinish?.({
            messages: [
              {
                id: "message-1",
                role: "user",
                parts: [{ type: "text", text: "hello" }]
              },
              {
                id: "message-2",
                role: "assistant",
                parts: [{ type: "text", text: "hi" }]
              }
            ],
            responseMessage: {
              id: "message-2",
              role: "assistant",
              parts: [{ type: "text", text: "hi" }],
              metadata: {
                tokenUsage: {
                  inputTokens: 10,
                  outputTokens: 20,
                  cachedTokens: 0,
                  reasoningTokens: 0,
                  totalTokens: 30
                }
              }
            }
          } as never)
        })()

        return [] as never
      }
    )

    const request = new NextRequest("http://localhost:3000/api/chat/resume", {
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

    const response = await routeModule.POST(request)
    await onFinishPromise

    expect(response.status).toBe(200)
    expect(quotaModule.getActiveAccessPass).toHaveBeenCalledTimes(2)
    expect(quotaModule.consumeChatTokens).not.toHaveBeenCalled()
  })
})
