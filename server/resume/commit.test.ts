/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ResumeData } from "@/types/resume"
import { commitResumeChange } from "./commit"

function createResume(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    sectionOrder: ["education", "skills"],
    personalInfo: {
      entryId: "pi-1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "1234567890"
    },
    education: { entries: [] },
    skills: { entries: [] },
    ...overrides
  }
}

describe("commitResumeChange", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the authoritative resume and next revision after a changed save", async () => {
    const currentResume = createResume()
    const nextResume = createResume({
      education: {
        entries: [
          {
            entryId: "edu-1",
            school: "Updated School",
            degree: "BSc",
            content: "CS",
            start: "2024",
            end: "2024"
          }
        ]
      }
    })

    const selectSingle = vi.fn().mockResolvedValue({
      data: {
        id: "resume-1",
        user_id: "user-1",
        resume_json: currentResume,
        current_revision: 3
      },
      error: null
    })
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
    const select = vi.fn().mockReturnValue({ eq: selectEq })
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })
    const insert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn((table: string) => {
      if (table === "resumes") {
        return { select, update }
      }

      if (table === "resumes_snapshot") {
        return { insert }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await commitResumeChange({
      supabase: { from } as any,
      actorId: "user-1",
      resumeId: "resume-1",
      nextResume,
      eventId: "event-1"
    })

    expect(update).toHaveBeenCalledWith({
      resume_json: nextResume,
      current_revision: 4,
      evaluation_report_refresh_flag: true
    })
    expect(insert).toHaveBeenCalledWith({
      resume_id: "resume-1",
      revision: 4,
      resume_json: nextResume,
      event_id: "event-1"
    })
    expect(result).toEqual({
      resume: nextResume,
      currentRevision: 4
    })
  })
  it("returns the existing authoritative state without writing when the resume is unchanged", async () => {
    const currentResume = createResume()

    const selectSingle = vi.fn().mockResolvedValue({
      data: {
        id: "resume-1",
        user_id: "user-1",
        resume_json: currentResume,
        current_revision: 3
      },
      error: null
    })
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
    const select = vi.fn().mockReturnValue({ eq: selectEq })
    const update = vi.fn()
    const insert = vi.fn()
    const from = vi.fn((table: string) => {
      if (table === "resumes") {
        return { select, update }
      }

      if (table === "resumes_snapshot") {
        return { insert }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await commitResumeChange({
      supabase: { from } as any,
      actorId: "user-1",
      resumeId: "resume-1",
      nextResume: currentResume
    })

    expect(update).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
    expect(result).toEqual({
      resume: currentResume,
      currentRevision: 3
    })
  })
})
