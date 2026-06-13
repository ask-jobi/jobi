/**
 * @vitest-environment node
 */
import { describe, expect, it, vi, beforeEach } from "vitest"
import { logChatEvent, logSummaryCheckpoint } from "./chat-events"

const { mockInsert, mockSingle } = vi.hoisted(() => {
  const singleMock = vi.fn().mockResolvedValue({
    data: { id: "event-1" },
    error: null
  })
  const insertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: singleMock
    })
  })
  return { mockInsert: insertMock, mockSingle: singleMock }
})

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      insert: mockInsert
    })
  })
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle
    })
  })
  mockSingle.mockResolvedValue({
    data: { id: "event-1" },
    error: null
  })
})

describe("chat_events", () => {
  describe("logChatEvent", () => {
    it("validates tool_call event data", async () => {
      await logChatEvent({
        sessionId: "session-1",
        messageId: "msg-1",
        eventType: "tool_call",
        eventData: {
          toolCallId: "tc-1",
          toolName: "resumeEditorModify",
          input: { operation: "rewrite" },
          baseVersion: 1
        }
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "tool_call",
          event_data: expect.objectContaining({
            toolCallId: "tc-1",
            toolName: "resumeEditorModify"
          })
        })
      )
    })

    it("rejects tool_call event data missing required fields", async () => {
      await expect(
        logChatEvent({
          sessionId: "session-1",
          messageId: "msg-1",
          eventType: "tool_call",
          eventData: {
            missingToolCallId: true
          } as unknown as Record<string, unknown>
        })
      ).rejects.toThrow()
    })

    it("validates tool_result event data", async () => {
      await logChatEvent({
        sessionId: "session-1",
        messageId: "msg-1",
        eventType: "tool_result",
        eventData: {
          toolCallId: "tc-1",
          toolName: "resumeEditorModify",
          output: { operation: "rewrite" },
          snapshotId: "resume-1:2",
          baseVersion: 1,
          nextVersion: 2
        }
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "tool_result",
          event_data: expect.objectContaining({
            snapshotId: "resume-1:2",
            baseVersion: 1,
            nextVersion: 2
          })
        })
      )
    })

    it("validates tool_failed event data", async () => {
      await logChatEvent({
        sessionId: "session-1",
        messageId: "msg-1",
        eventType: "tool_failed",
        eventData: {
          toolCallId: "tc-1",
          toolName: "resumeEditorModify",
          input: { operation: "rewrite" },
          baseVersion: 1,
          error: "Personal info only supports rewrite"
        }
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "tool_failed",
          event_data: expect.objectContaining({
            toolCallId: "tc-1",
            error: "Personal info only supports rewrite"
          })
        })
      )
    })

    it("passes through unknown event types without validation", async () => {
      await logChatEvent({
        sessionId: "session-1",
        messageId: "msg-1",
        eventType: "unknown_type" as any,
        eventData: {
          customField: "any-value"
        }
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "unknown_type",
          event_data: { customField: "any-value" }
        })
      )
    })
  })

  describe("logSummaryCheckpoint", () => {
    it("validates summary_checkpoint event data", async () => {
      await logSummaryCheckpoint("session-1", "msg-1", "This is a summary")

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "summary_checkpoint",
          event_data: { summary_text: "This is a summary" }
        })
      )
    })
  })
})
