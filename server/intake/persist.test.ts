/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createClient } from "@/lib/supabase/server"
import type { ResumeData } from "@/types/resume"
import type { RollbackRegistry } from "./types"
import { persistApplicationResume } from "./persist"

vi.mock("@/lib/supabase/server")

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>

function createResume(): ResumeData {
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
    skills: { entries: [] }
  }
}

function createRollbackRegistry(): RollbackRegistry {
  return {
    register: vi.fn(),
    executeAll: vi.fn(async () => ({ allSucceeded: true, failures: [] }))
  }
}

describe("persistApplicationResume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the initial revision snapshot before creating the job application", async () => {
    const resumeData = createResume()
    const jobsInsertSingle = vi.fn().mockResolvedValue({
      data: { id: "job-1" },
      error: null
    })
    const jobsInsertSelect = vi
      .fn()
      .mockReturnValue({ single: jobsInsertSingle })
    const jobsInsert = vi.fn().mockReturnValue({ select: jobsInsertSelect })

    const resumesInsertSingle = vi.fn().mockResolvedValue({
      data: { id: "resume-1" },
      error: null
    })
    const resumesInsertSelect = vi
      .fn()
      .mockReturnValue({ single: resumesInsertSingle })
    const resumesInsert = vi
      .fn()
      .mockReturnValue({ select: resumesInsertSelect })

    const snapshotInsert = vi.fn().mockResolvedValue({ error: null })

    const applicationsInsertSingle = vi.fn().mockResolvedValue({
      data: { id: "application-1" },
      error: null
    })
    const applicationsInsertSelect = vi
      .fn()
      .mockReturnValue({ single: applicationsInsertSingle })
    const applicationsInsert = vi
      .fn()
      .mockReturnValue({ select: applicationsInsertSelect })

    const from = vi.fn((table: string) => {
      if (table === "jobs") {
        return { insert: jobsInsert }
      }

      if (table === "resumes") {
        return { insert: resumesInsert }
      }

      if (table === "resumes_snapshot") {
        return { insert: snapshotInsert }
      }

      if (table === "job_applications") {
        return { insert: applicationsInsert }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    await expect(
      persistApplicationResume(
        {
          userId: "user-1",
          jobInfo: {
            name: "Engineer",
            company: "Jobi",
            description: "Build reliable systems"
          },
          resumeData,
          resumeLanguage: "en",
          uploadedResumePublicUrl: "https://example.com/resume.pdf"
        },
        createRollbackRegistry()
      )
    ).resolves.toEqual({
      jobData: { id: "job-1" },
      resumeData: { id: "resume-1" },
      applicationData: { id: "application-1" }
    })

    expect(resumesInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      job_id: "job-1",
      upload_url: "https://example.com/resume.pdf",
      language: "en",
      resume_json: resumeData
    })
    expect(snapshotInsert).toHaveBeenCalledWith({
      resume_id: "resume-1",
      revision: 1,
      resume_json: resumeData,
      event_id: null
    })
    expect(snapshotInsert.mock.invocationCallOrder[0]).toBeLessThan(
      applicationsInsert.mock.invocationCallOrder[0]
    )
  })

  it("does not create the job application when the initial snapshot write fails", async () => {
    const resumeData = createResume()
    const jobsInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "job-1" },
          error: null
        })
      })
    })
    const resumesInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "resume-1" },
          error: null
        })
      })
    })
    const snapshotError = { message: "snapshot failed" }
    const snapshotInsert = vi.fn().mockResolvedValue({ error: snapshotError })
    const applicationsInsert = vi.fn()

    const from = vi.fn((table: string) => {
      if (table === "jobs") {
        return { insert: jobsInsert }
      }

      if (table === "resumes") {
        return { insert: resumesInsert }
      }

      if (table === "resumes_snapshot") {
        return { insert: snapshotInsert }
      }

      if (table === "job_applications") {
        return { insert: applicationsInsert }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    mockCreateClient.mockResolvedValue({ from } as never)

    await expect(
      persistApplicationResume(
        {
          userId: "user-1",
          jobInfo: {
            name: "Engineer",
            company: "Jobi",
            description: "Build reliable systems"
          },
          resumeData,
          resumeLanguage: "en",
          uploadedResumePublicUrl: null
        },
        createRollbackRegistry()
      )
    ).rejects.toBe(snapshotError)

    expect(applicationsInsert).not.toHaveBeenCalled()
  })
})
