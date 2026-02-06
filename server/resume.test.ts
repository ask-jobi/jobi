/**
 * @vitest-environment node
 */
import { AsyncLocalStorage } from "node:async_hooks"

global.AsyncLocalStorage = AsyncLocalStorage as any

import {
  fetchJobApplication,
  getJobApplication,
  getResumeData,
  uploadResumeFile,
  createResumeRecord,
  updateResumeJobDescription,
  saveResumeChange,
  createEmptyResumeRecord,
  deleteJobApplication
} from "./resume"
import { createClient } from "@/lib/supabase/server"
import { rollbackStorage, RollbackContext } from "./rollback"
import { JobInfoFormType } from "@/components/forms/job-information-form"
import { ResumeData } from "@/types/resume"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server")
vi.mock("./rollback", () => ({
  ...vi.importActual("./rollback"),
  rollbackStorage: {
    getStore: vi.fn(),
    run: vi.fn()
  }
}))

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>
const mockRollbackStorage = vi.mocked(rollbackStorage)

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

describe("getResumeData", () => {
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

    const result = await getResumeData("resume-1")

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

    await expect(getResumeData("non-existent")).rejects.toThrow(
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

    await expect(getResumeData("resume-1")).rejects.toThrow(
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
          list: vi.fn().mockResolvedValue({ data: [], error: null }),
          upload: vi.fn().mockResolvedValue({
            data: { path: "user-123/resume.pdf" },
            error: null
          }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: "https://example.com/user-123/resume.pdf" }
          })
        })
      }
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await uploadResumeFile(mockFile)

    expect(result.fileName).toContain("resume.pdf")
    expect(result.publicUrl).toBe("https://example.com/user-123/resume.pdf")
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
          list: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe("createResumeRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create resume record successfully", async () => {
    const jobInfo: JobInfoFormType = {
      name: "Engineer",
      company: "Tech Corp",
      description: "Looking for a skilled engineer"
    }

    const uploadResult = {
      fileName: "resume.pdf",
      publicUrl: "https://example.com/resume.pdf",
      userId: "user-123"
    }

    const resumeData: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
      personalInfo: {
        blockId: "p1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: ""
      },
      education: { sectionId: "e1", title: "Education", blocks: [] },
      employment: { sectionId: "emp1", title: "Employment", blocks: [] },
      skills: { sectionId: "s1", title: "Skills", blocks: [] }
    }

    const mockRollbackContext = {
      rollbackActions: [],
      retryTimes: 3,
      addRollback: vi.fn()
    }
    mockRollbackStorage.getStore.mockReturnValue(
      mockRollbackContext as unknown as RollbackContext
    )

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValueOnce({ data: { id: "job-123" }, error: null })
              .mockResolvedValueOnce({
                data: { id: "resume-123" },
                error: null
              })
              .mockResolvedValueOnce({ data: { id: "app-123" }, error: null })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await createResumeRecord(
      jobInfo,
      uploadResult,
      resumeData,
      "en"
    )

    expect(result.jobData.id).toBe("job-123")
    expect(result.resumeData.id).toBe("resume-123")
    expect(mockRollbackContext.addRollback).toHaveBeenCalledTimes(3)
  })

  it("should throw error when job insert fails", async () => {
    const jobInfo: JobInfoFormType = {
      name: "Engineer",
      company: "Tech Corp",
      description: "Looking for a skilled engineer"
    }

    const uploadResult = {
      fileName: "resume.pdf",
      publicUrl: "https://example.com/resume.pdf",
      userId: "user-123"
    }

    const resumeData: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
      personalInfo: {
        blockId: "p1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: ""
      },
      education: { sectionId: "e1", title: "Education", blocks: [] },
      employment: { sectionId: "emp1", title: "Employment", blocks: [] },
      skills: { sectionId: "s1", title: "Skills", blocks: [] }
    }

    const mockRollbackContext = {
      rollbackActions: [],
      retryTimes: 3,
      addRollback: vi.fn()
    }
    mockRollbackStorage.getStore.mockReturnValue(
      mockRollbackContext as unknown as RollbackContext
    )

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Job insert failed" }
            })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    await expect(
      createResumeRecord(jobInfo, uploadResult, resumeData, "en")
    ).rejects.toThrow("Failed to create resume record: Job insert failed")
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

describe("saveResumeChange", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should save resume change successfully", async () => {
    const resumeData: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
      personalInfo: {
        blockId: "p1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: ""
      },
      education: { sectionId: "e1", title: "Education", blocks: [] },
      employment: { sectionId: "emp1", title: "Employment", blocks: [] },
      skills: { sectionId: "s1", title: "Skills", blocks: [] }
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

    await saveResumeChange("resume-123", resumeData)

    expect(mockFrom).toHaveBeenCalledWith("resumes")
  })

  it("should throw error when save fails", async () => {
    const resumeData: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
      personalInfo: {
        blockId: "p1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: ""
      },
      education: { sectionId: "e1", title: "Education", blocks: [] },
      employment: { sectionId: "emp1", title: "Employment", blocks: [] },
      skills: { sectionId: "s1", title: "Skills", blocks: [] }
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

    await expect(saveResumeChange("resume-123", resumeData)).rejects.toEqual({
      message: "Save failed"
    })
  })
})

describe("createEmptyResumeRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create empty resume record successfully", async () => {
    const jobInfo: JobInfoFormType = {
      name: "Engineer",
      company: "Tech Corp",
      description: "Looking for a skilled engineer"
    }

    const mockRollbackContext = {
      rollbackActions: [],
      retryTimes: 3,
      addRollback: vi.fn()
    }
    mockRollbackStorage.getStore.mockReturnValue(
      mockRollbackContext as unknown as RollbackContext
    )

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValueOnce({ data: { id: "job-123" }, error: null })
              .mockResolvedValueOnce({
                data: { id: "resume-123" },
                error: null
              })
              .mockResolvedValueOnce({ data: { id: "app-123" }, error: null })
          })
        })
      })
    }
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    )

    const result = await createEmptyResumeRecord(jobInfo)

    expect(result.jobData.id).toBe("job-123")
    expect(result.resumeData.id).toBe("resume-123")
    expect(result.applicationData.id).toBe("app-123")
  })

  it("should throw error when user not authenticated", async () => {
    const jobInfo: JobInfoFormType = {
      name: "Engineer",
      company: "Tech Corp",
      description: "Looking for a skilled engineer"
    }

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

    await expect(createEmptyResumeRecord(jobInfo)).rejects.toThrow(
      "User not authenticated"
    )
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
