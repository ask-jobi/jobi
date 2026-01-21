/**
 * @jest-environment node
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

jest.mock("@/lib/supabase/server")
jest.mock("./rollback", () => ({
  ...jest.requireActual("./rollback"),
  rollbackStorage: {
    getStore: jest.fn(),
    run: jest.fn()
  }
}))

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>
const mockRollbackStorage = jest.mocked(rollbackStorage)

describe("fetchJobApplication", () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockData, error: null })
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
      from: jest.fn().mockReturnValue({
        select: jest
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
    jest.clearAllMocks()
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
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [mockData], error: null })
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
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
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
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
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
    jest.clearAllMocks()
  })

  it("should return resume data when exists", async () => {
    const mockResumeJson = { personalInfo: { firstName: "John" } }

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
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
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
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
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
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
    jest.clearAllMocks()
  })

  it("should upload file successfully", async () => {
    const mockFile = new File(["test"], "resume.pdf", {
      type: "application/pdf"
    })

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      storage: {
        from: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue({ data: [], error: null }),
          upload: jest
            .fn()
            .mockResolvedValue({
              data: { path: "user-123/resume.pdf" },
              error: null
            }),
          getPublicUrl: jest.fn().mockReturnValue({
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
        getUser: jest.fn().mockResolvedValue({
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
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      storage: {
        from: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue({ data: [], error: null }),
          upload: jest.fn().mockResolvedValue({
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
    jest.clearAllMocks()
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
      personalInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: ""
      },
      education: { title: "Education", order: 0, blocks: [] },
      employment: { title: "Employment", order: 1, blocks: [] },
      skills: { title: "Skills", order: 2, blocks: [] }
    }

    const mockRollbackContext = {
      rollbackActions: [],
      retryTimes: 3,
      addRollback: jest.fn()
    }
    mockRollbackStorage.getStore.mockReturnValue(
      mockRollbackContext as unknown as RollbackContext
    )

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest
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
      personalInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: ""
      },
      education: { title: "Education", order: 0, blocks: [] },
      employment: { title: "Employment", order: 1, blocks: [] },
      skills: { title: "Skills", order: 2, blocks: [] }
    }

    const mockRollbackContext = {
      rollbackActions: [],
      retryTimes: 3,
      addRollback: jest.fn()
    }
    mockRollbackStorage.getStore.mockReturnValue(
      mockRollbackContext as unknown as RollbackContext
    )

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
    jest.clearAllMocks()
  })

  it("should update job description and flag", async () => {
    const mockFrom = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
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
    const mockFrom = jest.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: "Update failed" }
            })
          })
        }
      }
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
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
    jest.clearAllMocks()
  })

  it("should save resume change successfully", async () => {
    const resumeData: ResumeData = {
      personalInfo: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: ""
      },
      education: { title: "Education", order: 0, blocks: [] },
      employment: { title: "Employment", order: 1, blocks: [] },
      skills: { title: "Skills", order: 2, blocks: [] }
    }

    const mockFrom = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
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
      personalInfo: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: ""
      },
      education: { title: "Education", order: 0, blocks: [] },
      employment: { title: "Employment", order: 1, blocks: [] },
      skills: { title: "Skills", order: 2, blocks: [] }
    }

    const mockFrom = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
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
    jest.clearAllMocks()
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
      addRollback: jest.fn()
    }
    mockRollbackStorage.getStore.mockReturnValue(
      mockRollbackContext as unknown as RollbackContext
    )

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest
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
        getUser: jest.fn().mockResolvedValue({
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
    jest.clearAllMocks()
  })

  it("should delete job application successfully", async () => {
    const mockFrom = jest.fn()
    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      from: mockFrom,
      storage: {
        from: jest.fn().mockReturnValue({
          remove: jest.fn().mockResolvedValue({ error: null })
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
        getUser: jest.fn().mockResolvedValue({
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
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
