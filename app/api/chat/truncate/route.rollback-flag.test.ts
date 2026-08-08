/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"
import * as auth from "@/server/auth-helper"
import * as history from "@/server/ai/chat/history"
import { commitResumeOperation } from "@/server/resume/commit"
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
vi.mock("@/server/resume/commit")
vi.mock("@/server/chat-events", () => ({ logRollback: vi.fn() }))
vi.mock("@/server/resume", () => ({
  getJobApplicationByResumeId: vi.fn()
}))

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
    vi.mocked(auth.requireVerifiedUserIdentity).mockResolvedValue({
      id: "workspace-1"
    })
    vi.mocked(auth.verifyOwnership).mockResolvedValue()
    vi.mocked(history.getMessage).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "session-1",
      role: "user",
      parts: [],
      truncated: false,
      has_tools: false,
      created_at: "2024-01-01T00:00:00Z"
    })
    vi.mocked(history.getSessionSummary).mockResolvedValue({
      id: "session-1",
      title: null,
      resumeId: "resume-1",
      status: "active",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      messageCount: 1
    })
    vi.mocked(history.getMessagesAfter).mockResolvedValue([
      {
        id: "message-2",
        session_id: "session-1",
        role: "assistant",
        parts: [],
        truncated: false,
        has_tools: true,
        created_at: "2024-01-01T00:01:00Z"
      }
    ])
    vi.mocked(history.extractAiResumeEditOutputs).mockReturnValue([
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Original School"
      } as never
    ])
    vi.mocked(commitResumeOperation).mockResolvedValue({
      resume: createResume("Original School"),
      currentRevision: 4,
      baseRevision: 3,
      metadata: undefined
    })
  })

  it("returns the authoritative state produced by the revision commit", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/chat/truncate", {
        method: "POST",
        body: JSON.stringify({
          messageId: "550e8400-e29b-41d4-a716-446655440000"
        })
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      resume: createResume("Original School"),
      currentRevision: 4
    })
    expect(commitResumeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "workspace-1",
        resumeId: "resume-1"
      })
    )
  })
})
