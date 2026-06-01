/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ResumeData } from "@/types/resume"
import { createResumeChatServerTools } from "./registry"

vi.mock("@/server/chat-events", () => ({
  logChatEvent: vi.fn()
}))

vi.mock("@/server/resume/commit", () => ({
  commitResumeChange: vi.fn()
}))

const baseResume: ResumeData = {
  sectionOrder: ["education", "skills"],
  personalInfo: {
    entryId: "pi-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "1234567890"
  },
  education: {
    entries: [
      {
        entryId: "edu-1",
        school: "Draft School",
        degree: "BSc",
        content: "",
        start: "2020",
        end: "2024"
      }
    ]
  },
  skills: { entries: [] }
}

function createTools() {
  const write = vi.fn()
  const tools = createResumeChatServerTools({
    supabase: {} as never,
    userId: "user-1",
    resumeId: "resume-1",
    sessionId: "session-1",
    assistantMessageId: "assistant-1",
    initialResume: baseResume,
    initialRevision: 1,
    writer: {
      write,
      merge: vi.fn(),
      onError: undefined
    }
  })

  return { tools, write }
}

describe("createResumeChatServerTools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("commits tool output and streams an authoritative resume patch", async () => {
    const { logChatEvent } = await import("@/server/chat-events")
    const { commitResumeChange } = await import("@/server/resume/commit")
    const { tools, write } = createTools()

    vi.mocked(logChatEvent)
      .mockResolvedValueOnce("tool-call-event")
      .mockResolvedValueOnce("tool-result-event")
    vi.mocked(commitResumeChange).mockImplementation(
      async ({ nextResume }) => ({
        resume: nextResume,
        currentRevision: 2
      })
    )

    const output = await tools.resumeEditorModify.execute?.(
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        value: "Edited School"
      },
      {
        toolCallId: "tool-1",
        messages: [],
        experimental_context: undefined
      }
    )

    expect(output).toMatchObject({
      operation: "rewrite",
      entity: "education",
      id: "edu-1",
      field: "school",
      originalValue: "Draft School",
      value: "Edited School"
    })
    expect(commitResumeChange).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        resumeId: "resume-1",
        eventId: "tool-call-event",
        nextResume: expect.objectContaining({
          education: expect.objectContaining({
            entries: [
              expect.objectContaining({
                entryId: "edu-1",
                school: "Edited School"
              })
            ]
          })
        })
      })
    )
    expect(logChatEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "tool_call",
        messageId: "assistant-1"
      })
    )
    expect(logChatEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "tool_result",
        eventData: expect.objectContaining({
          snapshotId: "resume-1:2",
          baseVersion: 1,
          nextVersion: 2
        })
      })
    )
    expect(write).toHaveBeenCalledWith({
      type: "data-resume-patch",
      id: "tool-1",
      transient: true,
      data: expect.objectContaining({
        snapshotId: "resume-1:2",
        messageId: "assistant-1",
        baseVersion: 1,
        nextVersion: 2
      })
    })
  })

  it("logs tool_failed when applicability validation fails", async () => {
    const { logChatEvent } = await import("@/server/chat-events")
    const { commitResumeChange } = await import("@/server/resume/commit")
    const { tools, write } = createTools()

    vi.mocked(logChatEvent).mockResolvedValue("tool-failed-event")

    await expect(
      tools.resumeEditorModify.execute?.(
        {
          operation: "delete",
          entity: "education",
          id: "missing-entry"
        },
        {
          toolCallId: "tool-2",
          messages: [],
          experimental_context: undefined
        }
      )
    ).rejects.toThrow("Entry with id missing-entry not found")

    expect(commitResumeChange).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
    expect(logChatEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "tool_failed",
        eventData: expect.objectContaining({
          toolName: "resumeEditorModify",
          toolCallId: "tool-2",
          baseVersion: 1
        })
      })
    )
  })
})
