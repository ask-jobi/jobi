/**
 * @vitest-environment node
 */
import {
  fetchJobApplication,
  getJobApplication,
  getApplicationResumeData,
  uploadResumeFile,
  updateResumeJobDescription,
  saveApplicationResumeChange,
  deleteJobApplication
} from "./resume"
import { createClient } from "@/lib/supabase/server"
import { ResumeData } from "@/types/resume"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server")
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-nanoid")
}))

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>

describe("fetchJobApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return job applications", async () => {
    const mockData = [
      {
        id: "app-1",
        optimized_resume_url: "https://example.com/resume.pdf",
        created_at: "2024-01-01",
        resumes: {
          id: "resume-1",
          upload_url: "https://example.com/resume.pdf"
        },
        jobs: {
          id: "job-1",
          name: "Engineer",
          company: "Tech Corp",
          description: "Desc"
        }
      }
    ]

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await fetchJobApplication()

    expect(result).toEqual(mockData)
    expect(mockSupabase.from).toHaveBeenCalledWith("job_applications")
  })

  it("should return null on database error", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi
          .fn()
          .mockResolvedValue({ data: null, error: new Error("DB Error") })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await fetchJobApplication()

    expect(result).toBeNull()
  })
})

describe("getJobApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return job application when exists", async () => {
    const mockData = {
      id: "app-1",
      optimized_resume_url: "https://example.com/resume.pdf",
      created_at: "2024-01-01",
      resumes: { id: "resume-1", upload_url: "https://example.com/resume.pdf" },
      jobs: {
        id: "job-1",
        name: "Engineer",
        company: "Tech Corp",
        description: "Desc"
      }
    }

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [mockData], error: null })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await getJobApplication("app-1")

    expect(result).toEqual(mockData)
  })

  it("should throw error when not found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(getJobApplication("non-existent")).rejects.toThrow(
      "No job application found with id: non-existent"
    )
  })

  it("should throw error when multiple found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: "app-1" }, { id: "app-2" }],
            error: null
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(getJobApplication("app-1")).rejects.toThrow(
      "Multiple job applications found with id: app-1"
    )
  })
})

describe("getApplicationResumeData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return resume data when exists", async () => {
    const mockResumeJson = { personalInfo: { firstName: "John" } }

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ resume_json: mockResumeJson }],
            error: null
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await getApplicationResumeData("resume-1")

    expect(result).toEqual(mockResumeJson)
  })

  it("should throw error when not found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(getApplicationResumeData("non-existent")).rejects.toThrow(
      "No resume found with id: non-existent"
    )
  })

  it("should throw error when multiple found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ resume_json: {} }, { resume_json: {} }],
            error: null
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(getApplicationResumeData("resume-1")).rejects.toThrow(
      "Multiple resume found with id: resume-1"
    )
  })
})

describe("uploadResumeFile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should upload file successfully", async () => {
    const mockFile = new File(["test"], "resume.pdf", {
      type: "application/pdf"
    })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({
            data: { path: "user-123/resume_mock-nanoid.pdf" },
            error: null
          }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: {
              publicUrl: "https://example.com/user-123/resume_mock-nanoid.pdf"
            }
          })
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await uploadResumeFile(mockFile)

    expect(result.fileName).toBe("user-123/resume_mock-nanoid.pdf")
    expect(result.publicUrl).toBe(
      "https://example.com/user-123/resume_mock-nanoid.pdf"
    )
    expect(result.userId).toBe("user-123")
  })

  it("should throw error when user not authenticated", async () => {
    const mockFile = new File(["test"], "resume.pdf", {
      type: "application/pdf"
    })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(uploadResumeFile(mockFile)).rejects.toThrow(
      "User not authenticated"
    )
  })

  it("should throw error when upload fails", async () => {
    const mockFile = new File(["test"], "resume.pdf", {
      type: "application/pdf"
    })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Upload failed" }
          })
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(uploadResumeFile(mockFile)).rejects.toThrow(
      "Failed to upload file: Upload failed"
    )
  })
})

describe("updateResumeJobDescription", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should update job description and flag", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    })

    const mockSupabase = {
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await updateResumeJobDescription({
      id: "job-123",
      name: "Updated Name",
      company: "Updated Company",
      description: "Updated Description"
    })

    expect(mockFrom).toHaveBeenCalledTimes(2)
  })

  it("should throw error when update fails", async () => {
    let callCount = 0
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: "Update failed" }
            })
          })
        }
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      }
    })

    const mockSupabase = {
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(
      updateResumeJobDescription({
        id: "job-123",
        name: "Updated Name",
        company: "Updated Company",
        description: "Updated Description"
      })
    ).rejects.toEqual({ message: "Update failed" })
  })
})

describe("saveApplicationResumeChange", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should save resume change successfully", async () => {
    const resumeData: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
      personalInfo: {
        entryId: "p1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: ""
      },
      education: { entries: [] },
      employment: { entries: [] },
      skills: { entries: [] }
    }

    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    })

    const mockSupabase = {
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await saveApplicationResumeChange("resume-123", resumeData)

    expect(mockFrom).toHaveBeenCalledWith("resumes")
  })

  it("should throw error when save fails", async () => {
    const resumeData: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
      personalInfo: {
        entryId: "p1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: ""
      },
      education: { entries: [] },
      employment: { entries: [] },
      skills: { entries: [] }
    }

    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: "Save failed" }
        })
      })
    })

    const mockSupabase = {
      from: mockFrom
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(
      saveApplicationResumeChange("resume-123", resumeData)
    ).rejects.toEqual({
      message: "Save failed"
    })
  })
})

describe("deleteJobApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should delete job application successfully", async () => {
    const mockFrom = vi.fn()
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "app-123",
                resumes: {
                  id: "resume-123",
                  upload_url:
                    "https://example.com/storage/v1/object/public/upload-resumes/user-123/resume.pdf"
                },
                jobs: { id: "job-123" }
              },
              error: null
            })
          })
        })
      })
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      from: mockFrom,
      storage: {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue({ error: null })
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await deleteJobApplication("app-123")

    expect(mockFrom).toHaveBeenCalledTimes(4)
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("upload-resumes")
  })

  it("should throw error when user not authenticated", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(deleteJobApplication("app-123")).rejects.toThrow(
      "User not authenticated"
    )
  })

  it("should throw error when job application not found", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" }
            })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(deleteJobApplication("non-existent")).rejects.toThrow(
      "Failed to fetch job application: Not found"
    )
  })
})
