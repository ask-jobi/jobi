/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ResumeData } from "@/types/resume"
import {
  commitResumeChange,
  commitResumeOperation,
  ResumeCommitError
} from "./commit"

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
    const updateRevisionEq = vi
      .fn()
      .mockResolvedValue({ error: null, count: 1 })
    const updateIdEq = vi.fn().mockReturnValue({ eq: updateRevisionEq })
    const update = vi.fn().mockReturnValue({ eq: updateIdEq })
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

    expect(update).toHaveBeenCalledWith(
      {
        resume_json: nextResume,
        current_revision: 4,
        evaluation_report_refresh_flag: true
      },
      { count: "exact" }
    )
    expect(updateIdEq).toHaveBeenCalledWith("id", "resume-1")
    expect(updateRevisionEq).toHaveBeenCalledWith("current_revision", 3)
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

  it("rejects a full-json save when the caller base revision is stale", async () => {
    const currentResume = createResume()
    const selectSingle = vi.fn().mockResolvedValue({
      data: {
        id: "resume-1",
        user_id: "user-1",
        resume_json: currentResume,
        current_revision: 4
      },
      error: null
    })
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
    const select = vi.fn().mockReturnValue({ eq: selectEq })
    const update = vi.fn()
    const from = vi.fn((table: string) => {
      if (table === "resumes") {
        return { select, update }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(
      commitResumeChange({
        supabase: { from } as any,
        actorId: "user-1",
        resumeId: "resume-1",
        nextResume: createResume({ skills: { entries: [] } }),
        baseRevision: 3
      })
    ).rejects.toMatchObject({
      code: "stale-json-conflict"
    })
    expect(update).not.toHaveBeenCalled()
  })
})

describe("commitResumeOperation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rebases an operation onto the latest resume after a revision race", async () => {
    const initialResume = createResume()
    const latestResume = createResume({
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
    const finalResume = createResume({
      ...latestResume,
      education: {
        entries: [
          {
            entryId: "edu-1",
            school: "Rebased School",
            degree: "BSc",
            content: "CS",
            start: "2024",
            end: "2024"
          }
        ]
      }
    })

    const selectSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: "resume-1",
          user_id: "user-1",
          resume_json: initialResume,
          current_revision: 3
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: {
          id: "resume-1",
          user_id: "user-1",
          resume_json: latestResume,
          current_revision: 4
        },
        error: null
      })
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
    const select = vi.fn().mockReturnValue({ eq: selectEq })
    const updateRevisionEq = vi
      .fn()
      .mockResolvedValueOnce({ error: null, count: 0 })
      .mockResolvedValueOnce({ error: null, count: 1 })
    const updateIdEq = vi.fn().mockReturnValue({ eq: updateRevisionEq })
    const update = vi.fn().mockReturnValue({ eq: updateIdEq })
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

    const result = await commitResumeOperation({
      supabase: { from } as any,
      actorId: "user-1",
      resumeId: "resume-1",
      eventId: "event-1",
      operation: ({ resume }) => ({
        nextResume: {
          ...resume,
          education: finalResume.education
        },
        metadata: { appliedToSkillsCount: resume.skills?.entries.length ?? 0 }
      })
    })

    expect(result).toEqual({
      resume: finalResume,
      currentRevision: 5,
      baseRevision: 4,
      metadata: { appliedToSkillsCount: 1 }
    })
    expect(updateRevisionEq).toHaveBeenNthCalledWith(1, "current_revision", 3)
    expect(updateRevisionEq).toHaveBeenNthCalledWith(2, "current_revision", 4)
    expect(insert).toHaveBeenCalledWith({
      resume_id: "resume-1",
      revision: 5,
      resume_json: finalResume,
      event_id: "event-1"
    })
  })

  it("propagates semantic conflicts from operation replay", async () => {
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
    const from = vi.fn((table: string) => {
      if (table === "resumes") {
        return { select, update }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(
      commitResumeOperation({
        supabase: { from } as any,
        actorId: "user-1",
        resumeId: "resume-1",
        operation: () => {
          throw new ResumeCommitError(
            "Entry changed before operation replay.",
            "semantic-conflict"
          )
        }
      })
    ).rejects.toMatchObject({
      code: "semantic-conflict"
    })
    expect(update).not.toHaveBeenCalled()
  })
})
