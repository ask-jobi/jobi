/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ResumeData } from "@/types/resume"
import { createResumeChatServerTools } from "./registry"
import { commitResumeOperation } from "@/server/resume/commit"

vi.mock("@/server/chat-events", () => ({
  logChatEvent: vi.fn()
}))

vi.mock("@/server/resume/commit", () => ({
  commitResumeOperation: vi.fn()
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

function mockCommitOperationWithResume({
  resume = baseResume,
  baseRevision = 1,
  nextRevision = 2
}: {
  resume?: ResumeData
  baseRevision?: number
  nextRevision?: number
} = {}) {
  vi.mocked(commitResumeOperation).mockImplementation(async ({ operation }) => {
    const { nextResume, metadata } = await operation({
      resume,
      currentRevision: baseRevision
    })

    return {
      resume: nextResume,
      currentRevision: nextRevision,
      baseRevision,
      metadata
    }
  })
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
    mockCommitOperationWithResume()
  })

  it("commits tool output and streams an authoritative resume patch", async () => {
    const { logChatEvent } = await import("@/server/chat-events")
    const { commitResumeOperation } = await import("@/server/resume/commit")
    const { tools, write } = createTools()

    vi.mocked(logChatEvent)
      .mockResolvedValueOnce("tool-call-event")
      .mockResolvedValueOnce("tool-result-event")
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
    expect(commitResumeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        resumeId: "resume-1",
        eventId: "tool-call-event",
        operation: expect.any(Function)
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
    const { commitResumeOperation } = await import("@/server/resume/commit")
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

    expect(commitResumeOperation).toHaveBeenCalled()
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

  it("includes delete rollback metadata in persisted tool output", async () => {
    const { logChatEvent } = await import("@/server/chat-events")
    const { commitResumeOperation } = await import("@/server/resume/commit")
    const { tools } = createTools()

    vi.mocked(logChatEvent)
      .mockResolvedValueOnce("tool-call-event")
      .mockResolvedValueOnce("tool-result-event")
    const output = await tools.resumeEditorModify.execute?.(
      {
        operation: "delete",
        entity: "education",
        id: "edu-1"
      },
      {
        toolCallId: "tool-delete",
        messages: [],
        experimental_context: undefined
      }
    )

    expect(output).toMatchObject({
      operation: "delete",
      entity: "education",
      id: "edu-1",
      originalIndex: 0,
      originalSectionOrder: ["education", "skills"]
    })
    expect(logChatEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "tool_result",
        eventData: expect.objectContaining({
          output: expect.objectContaining({
            originalIndex: 0,
            originalSectionOrder: ["education", "skills"]
          })
        })
      })
    )
  })

  it("includes add section lifecycle metadata in streamed patches", async () => {
    const { logChatEvent } = await import("@/server/chat-events")
    const { commitResumeOperation } = await import("@/server/resume/commit")
    const { tools, write } = createTools()

    vi.mocked(logChatEvent)
      .mockResolvedValueOnce("tool-call-event")
      .mockResolvedValueOnce("tool-result-event")
    const output = await tools.resumeEditorModify.execute?.(
      {
        operation: "add",
        entity: "projects"
      },
      {
        toolCallId: "tool-add",
        messages: [],
        experimental_context: undefined
      }
    )

    expect(output).toMatchObject({
      operation: "add",
      entity: "projects",
      createdSection: true,
      sectionDidNotExistBefore: true
    })
    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "data-resume-patch",
        data: expect.objectContaining({
          body: expect.objectContaining({
            output: expect.objectContaining({
              createdSection: true,
              sectionDidNotExistBefore: true
            })
          })
        })
      })
    )
  })

  it("normalizes date rewrites to canonical date range output", async () => {
    const { logChatEvent } = await import("@/server/chat-events")
    const { commitResumeOperation } = await import("@/server/resume/commit")
    const { tools } = createTools()

    vi.mocked(logChatEvent)
      .mockResolvedValueOnce("tool-call-event")
      .mockResolvedValueOnce("tool-result-event")
    const output = await tools.resumeEditorModify.execute?.(
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "end",
        value: "Present"
      },
      {
        toolCallId: "tool-date",
        messages: [],
        experimental_context: undefined
      }
    )

    expect(output).toMatchObject({
      operation: "rewrite",
      entity: "education",
      id: "edu-1",
      field: "end",
      originalValue: "2024",
      value: "Present"
    })
    expect(commitResumeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: expect.any(Function)
      })
    )
  })

  it("regenerates rollback metadata against the rebased authoritative resume", async () => {
    const { logChatEvent } = await import("@/server/chat-events")
    const { tools } = createTools()
    const latestResume = structuredClone(baseResume) as ResumeData
    latestResume.education!.entries[0]!.school = "Manual School"

    vi.mocked(logChatEvent)
      .mockResolvedValueOnce("tool-call-event")
      .mockResolvedValueOnce("tool-result-event")
    mockCommitOperationWithResume({
      resume: latestResume,
      baseRevision: 4,
      nextRevision: 5
    })

    const output = await tools.resumeEditorModify.execute?.(
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        value: "Edited School"
      },
      {
        toolCallId: "tool-rebase",
        messages: [],
        experimental_context: undefined
      }
    )

    expect(output).toMatchObject({
      operation: "rewrite",
      entity: "education",
      id: "edu-1",
      field: "school",
      originalValue: "Manual School",
      value: "Edited School"
    })
    expect(logChatEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "tool_result",
        eventData: expect.objectContaining({
          baseVersion: 4,
          nextVersion: 5,
          output: expect.objectContaining({
            originalValue: "Manual School"
          })
        })
      })
    )
  })
})
