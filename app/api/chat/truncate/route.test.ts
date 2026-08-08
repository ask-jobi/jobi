/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as chatHistoryModule from "@/server/ai/chat/history"
import * as authModule from "@/server/auth-helper"
import * as resumeModule from "@/server/resume"
import * as commitModule from "@/server/resume/commit"
import type { ResumeData } from "@/types/resume"

vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn(async () => ({})) }))
vi.mock("@/server/auth-helper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth-helper")>()
  return {
    ...actual,
    requireVerifiedUserIdentity: vi.fn(),
    verifyOwnership: vi.fn()
  }
})
vi.mock("@/server/ai/chat/history")
vi.mock("@/server/resume")
vi.mock("@/server/resume/commit")
vi.mock("@/server/chat-events", () => ({
  logRollback: vi.fn().mockResolvedValue(undefined)
}))

describe("POST /api/chat/truncate", () => {
  let currentResume: ResumeData
  let committedResume: ResumeData | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    currentResume = baseResume()
    committedResume = undefined

    vi.mocked(authModule.requireVerifiedUserIdentity).mockResolvedValue({
      id: "test-user-id"
    })
    vi.mocked(authModule.verifyOwnership).mockResolvedValue()
    vi.mocked(chatHistoryModule.getMessage).mockResolvedValue({
      id: "msg-1",
      session_id: "session-1",
      role: "user" as const,
      parts: [],
      truncated: false,
      has_tools: false,
      created_at: "2024-01-01T00:00:00Z"
    })
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([])
    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue({
      id: "session-1",
      title: null,
      resumeId: "resume-1",
      status: "active",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      messageCount: 0
    })
    vi.mocked(chatHistoryModule.truncateMessages).mockResolvedValue()
    vi.mocked(
      chatHistoryModule.restoreConversationSummaryAfterTruncate
    ).mockResolvedValue()
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([])

    vi.mocked(resumeModule.getJobApplicationByResumeId).mockResolvedValue({
      id: "app-1",
      resumes: {
        current_revision: 3,
        resume_json: {
          personalInfo: { entryId: "p1", firstName: "John", lastName: "Doe" },
          education: { entries: [] }
        }
      }
    } as any)
    vi.mocked(resumeModule.getApplicationResumeData).mockResolvedValue({
      personalInfo: { entryId: "p1", firstName: "John" }
    } as any)
    vi.mocked(resumeModule.saveApplicationResumeChange).mockResolvedValue({
      resume: {
        personalInfo: { entryId: "p1", firstName: "John" },
        education: { entries: [] }
      } as any,
      currentRevision: 4
    })
    vi.mocked(commitModule.commitResumeOperation).mockImplementation(
      async ({ operation }) => {
        const { nextResume, metadata } = await operation({
          resume: currentResume,
          currentRevision: 3
        })
        committedResume = nextResume

        return {
          resume: nextResume,
          currentRevision: 4,
          baseRevision: 3,
          metadata
        }
      }
    )

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

  function mockCurrentResume(resume: ResumeData) {
    currentResume = resume
    vi.mocked(resumeModule.getJobApplicationByResumeId).mockResolvedValue({
      id: "app-1",
      resumes: {
        current_revision: 3,
        resume_json: resume
      }
    } as any)
  }

  function getSavedResume() {
    return committedResume
  }

  const baseResume = (overrides: Partial<ResumeData> = {}): ResumeData => ({
    sectionOrder: ["education"],
    personalInfo: {
      entryId: "p1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123"
    },
    education: {
      entries: [
        {
          entryId: "edu-1",
          school: "Original School",
          degree: "BS",
          content: "Computer Science",
          start: "2020",
          end: "2024"
        }
      ]
    },
    ...overrides
  })

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(authModule.requireVerifiedUserIdentity).mockRejectedValue(
      new authModule.ApiError("Unauthorized", 401)
    )

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
    vi.mocked(chatHistoryModule.getMessage).mockResolvedValue(null)

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
  })

  it("should return 403 when user does not own the session", async () => {
    vi.mocked(authModule.verifyOwnership).mockRejectedValue(
      new authModule.ApiError("Forbidden", 403)
    )

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it("should return 404 when session not found", async () => {
    vi.mocked(chatHistoryModule.getSessionSummary).mockResolvedValue(null)

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(404)
  })

  it("returns the authoritative resume and revision after rollback", async () => {
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Original School"
      } as any
    ])

    const request = createMockRequest({
      messageId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      resume: baseResume(),
      currentRevision: 4
    })
    expect(commitModule.commitResumeOperation).toHaveBeenCalled()
  })

  it("restores a personalInfo rewrite when truncating the AI message", async () => {
    mockCurrentResume(
      baseResume({
        personalInfo: {
          entryId: "p1",
          firstName: "Jane",
          lastName: "Doe",
          email: "john@example.com",
          phone: "123"
        }
      })
    )
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "rewrite",
        entity: "personalInfo",
        id: "p1",
        field: "firstName",
        originalValue: "John",
        value: "Jane"
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(200)
    expect(getSavedResume()?.personalInfo.firstName).toBe("John")
  })

  it("reverts consecutive rewrites of the same field in reverse order", async () => {
    mockCurrentResume(
      baseResume({
        education: {
          entries: [
            {
              entryId: "edu-1",
              school: "Third School",
              degree: "BS",
              content: "Computer Science",
              start: "2020",
              end: "2024"
            }
          ]
        }
      })
    )
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Original School",
        value: "Second School"
      } as any,
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Second School",
        value: "Third School"
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(200)
    expect(getSavedResume()?.education?.entries[0]?.school).toBe(
      "Original School"
    )
  })

  it("restores a section and its last entry after truncating a delete", async () => {
    const deletedEntry = baseResume().education!.entries[0]!
    mockCurrentResume(baseResume({ sectionOrder: [], education: undefined }))
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "delete",
        entity: "education",
        id: "edu-1",
        originalValue: deletedEntry,
        originalIndex: 0,
        originalSectionOrder: ["education"]
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(200)
    expect(getSavedResume()?.sectionOrder).toContain("education")
    expect(getSavedResume()?.education?.entries).toEqual([deletedEntry])
  })

  it("restores a deleted entry to its original position", async () => {
    const firstEntry = baseResume().education!.entries[0]!
    const deletedEntry = {
      ...firstEntry,
      entryId: "edu-2",
      school: "Deleted School"
    }
    const thirdEntry = {
      ...firstEntry,
      entryId: "edu-3",
      school: "Third School"
    }

    mockCurrentResume(
      baseResume({
        education: {
          entries: [firstEntry, thirdEntry]
        }
      })
    )
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "delete",
        entity: "education",
        id: "edu-2",
        originalValue: deletedEntry,
        originalIndex: 1
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(200)
    expect(
      getSavedResume()?.education?.entries.map((entry) => entry.entryId)
    ).toEqual(["edu-1", "edu-2", "edu-3"])
  })

  it("removes an AI-added entry from an existing section", async () => {
    const originalEntry = baseResume().education!.entries[0]!
    const addedEntry = {
      ...originalEntry,
      entryId: "edu-added",
      school: "Added School"
    }

    mockCurrentResume(
      baseResume({
        education: {
          entries: [originalEntry, addedEntry]
        }
      })
    )
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "add",
        entity: "education",
        newEntry: addedEntry,
        createdSection: false,
        sectionDidNotExistBefore: false
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(200)
    expect(getSavedResume()?.sectionOrder).toEqual(["education"])
    expect(
      getSavedResume()?.education?.entries.map((entry) => entry.entryId)
    ).toEqual(["edu-1"])
  })

  it("removes an AI-created section when truncating its add output", async () => {
    const addedProject = {
      entryId: "project-1",
      title: "Added Project",
      role: "Owner",
      content: "Built a demo",
      start: "2024",
      end: ""
    }

    mockCurrentResume(
      baseResume({
        sectionOrder: ["education", "projects"],
        projects: {
          entries: [addedProject]
        }
      })
    )
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "add",
        entity: "projects",
        newEntry: addedProject,
        createdSection: true,
        sectionDidNotExistBefore: true
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(200)
    expect(getSavedResume()?.sectionOrder).toEqual(["education"])
    expect(getSavedResume()?.projects).toBeUndefined()
  })

  it("restores entry and section order after truncating reorder outputs", async () => {
    const firstEntry = baseResume().education!.entries[0]!
    const secondEntry = {
      ...firstEntry,
      entryId: "edu-2",
      school: "Second School"
    }

    mockCurrentResume(
      baseResume({
        sectionOrder: ["skills", "education"],
        education: {
          entries: [secondEntry, firstEntry]
        },
        skills: {
          entries: [
            {
              entryId: "skill-1",
              group: "Languages",
              content: "TypeScript"
            }
          ]
        }
      })
    )
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "reorderEntries",
        entity: "education",
        orderedEntryIds: ["edu-2", "edu-1"],
        originalValue: ["edu-1", "edu-2"]
      } as any,
      {
        operation: "reorderSections",
        entity: null,
        orderedSectionIds: ["skills", "education"],
        originalValue: ["education", "skills"]
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(200)
    expect(getSavedResume()?.sectionOrder).toEqual(["education", "skills"])
    expect(
      getSavedResume()?.education?.entries.map((entry) => entry.entryId)
    ).toEqual(["edu-1", "edu-2"])
  })

  it("does not truncate messages when rollback hits a semantic conflict", async () => {
    mockCurrentResume(
      baseResume({
        education: {
          entries: [
            {
              entryId: "edu-1",
              school: "Manual School",
              degree: "BS",
              content: "Computer Science",
              start: "2020",
              end: "2024"
            }
          ]
        }
      })
    )
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant" as const,
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(chatHistoryModule.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Original School",
        value: "AI School"
      } as any
    ])

    const response = await POST(
      createMockRequest({
        messageId: "550e8400-e29b-41d4-a716-446655440000"
      })
    )

    expect(response.status).toBe(409)
    expect(commitModule.commitResumeOperation).toHaveBeenCalled()
    expect(chatHistoryModule.truncateMessages).not.toHaveBeenCalled()
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
        created_at: "2024-01-01T00:01:00Z"
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
