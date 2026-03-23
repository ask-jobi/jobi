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
  smoothStream: vi.fn(),
  stepCountIs: vi.fn(),
  streamText: vi.fn(),
  validateUIMessages: vi.fn()
}))

vi.mock("@/lib/agent/tools", () => ({
  repairToolCall: vi.fn(),
  tools: {}
}))

vi.mock("@/lib/agent/chat-history", () => ({
  getLatestValidSummaryCheckpoint: vi.fn(),
  loadHistory: vi.fn(),
  loadMessagesAfter: vi.fn(),
  saveMessage: vi.fn(),
  updateMessage: vi.fn(),
  updateConversationSummary: vi.fn(),
  getSessionSummary: vi.fn(),
  updateSessionTokenUsage: vi.fn()
}))

vi.mock("@/lib/agent/conversation-summary", () => ({
  generateConversationSummary: vi.fn()
}))

vi.mock("@/server/resume", () => ({
  getJobApplicationByResumeId: vi.fn()
}))

vi.mock("@/lib/agent/model", () => ({
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

vi.mock("@/server/auth-helpers", () => {
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
    getAuthenticatedUser: vi.fn(),
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

  it("should reject sending a message when chat token quota is exhausted", async () => {
    const authHelpers = await import("@/server/auth-helpers")
    const quotaModule = await import("@/server/quota")
    const chatHistoryModule = await import("@/lib/agent/chat-history")
    const aiModule = await import("ai")
    const routeModule = await import("./route")

    vi.mocked(authHelpers.getAuthenticatedUser).mockResolvedValue({
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
})
