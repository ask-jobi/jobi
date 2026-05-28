/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ResumeData } from "@/types/resume"
import * as chatHistoryModule from "@/lib/agent/chat-history"
import * as resumeModule from "@/server/resume"
import { POST } from "./route"

vi.mock("@/lib/supabase/server")
vi.mock("@/lib/agent/chat-history")
vi.mock("@/server/chat-events", () => ({
  logRollback: vi.fn().mockResolvedValue(undefined)
}))
vi.mock("@/server/resume", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/resume")>()

  return {
    ...actual,
    getJobApplicationByResumeId: vi.fn()
  }
})

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>

function createResume(school: string): ResumeData {
  return {
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
          school,
          degree: "BSc",
          content: "Computer Science",
          start: "2020",
          end: "2024"
        }
      ]
    },
    skills: { entries: [] }
  }
}

describe("POST /api/chat/truncate rollback persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("persists a tool rollback through the commit path that marks evaluation refresh required", async () => {
    const currentResume = createResume("Updated School")
    const revertedResume = createResume("Original School")

    vi.mocked(chatHistoryModule.verifySessionOwnership).mockResolvedValue(true)
    vi.mocked(chatHistoryModule.getMessage).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "session-1",
      role: "user",
      parts: [],
      truncated: false,
      has_tools: false,
      created_at: "2024-01-01T00:00:00Z",
      input_tokens: 0,
      output_tokens: 0,
      cached_tokens: 0,
      reasoning_tokens: 0
    })
    vi.mocked(chatHistoryModule.getMessagesAfter).mockResolvedValue([
      {
        id: "msg-2",
        session_id: "session-1",
        role: "assistant",
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z",
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        reasoning_tokens: 0
      }
    ])
    vi.mocked(chatHistoryModule.truncateMessages).mockResolvedValue()
    vi.mocked(
      chatHistoryModule.restoreConversationSummaryAfterTruncate
    ).mockResolvedValue()
    vi.mocked(chatHistoryModule.extractToolOriginalValues).mockReturnValue([
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Original School"
      } as any
    ])
    vi.mocked(resumeModule.getJobApplicationByResumeId).mockResolvedValue({
      id: "app-1",
      resumes: {
        current_revision: 3,
        resume_json: currentResume
      }
    } as any)

    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })
    const snapshotInsert = vi.fn().mockResolvedValue({ error: null })

    const from = vi.fn((table: string) => {
      if (table === "resume_chat_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { session_id: "session-1" },
                error: null
              })
            })
          })
        }
      }

      if (table === "resume_chat_sessions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { resume_id: "resume-1" },
                error: null
              })
            })
          })
        }
      }

      if (table === "resumes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "resume-1",
                  user_id: "user-1",
                  resume_json: currentResume,
                  current_revision: 3
                },
                error: null
              })
            })
          }),
          update
        }
      }

      if (table === "resumes_snapshot") {
        return { insert: snapshotInsert }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    mockCreateClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "user-1" } },
          error: null
        })
      },
      from
    } as never)

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat/truncate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: "550e8400-e29b-41d4-a716-446655440000"
        })
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      resume: revertedResume,
      currentRevision: 4
    })
    expect(update).toHaveBeenCalledWith({
      resume_json: revertedResume,
      current_revision: 4,
      evaluation_report_refresh_flag: true
    })
    expect(snapshotInsert).toHaveBeenCalledWith({
      resume_id: "resume-1",
      revision: 4,
      resume_json: revertedResume,
      event_id: null
    })
  })
})
