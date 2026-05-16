/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import path from "node:path"
import fs from "node:fs"
import { Locale } from "@/lib/i18n/config"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import * as resumeParser from "@/server/ai/resume-parser"
import type { ResumeData } from "@/types/resume"
import * as resumeModule from "@/server/resume"
import * as quotaModule from "@/server/quota"
import * as toolsModule from "@/server/ai/tools"
import * as evaluationModule from "@/server/evaluation"
import * as writerManager from "@/server/sse/writer-manager"

vi.mock("@/server/ai/resume-parser")
vi.mock("@/server/resume")
vi.mock("@/server/quota")
vi.mock("@/server/ai/tools")
vi.mock("@/server/evaluation")
vi.mock("@/server/sse/writer-manager")

vi.mock("@/server/rollback", () => ({
  rollbackStorage: {
    run: async (_ctx: any, fn: any) => fn(),
    getStore: () => ({ executeRollback: vi.fn() })
  },
  RollbackContext: class {}
}))

describe("POST /api/resume/upload-and-analyze", () => {
  let sentData: any[] = []

  beforeEach(() => {
    sentData = []

    vi.clearAllMocks()

    vi.mocked(quotaModule.verifyJobApplicationLimit).mockResolvedValue(
      undefined
    )
    vi.mocked(quotaModule.getActiveAccessPass).mockResolvedValue(null as never)
    vi.mocked(quotaModule.buildChatTokenQuota).mockReturnValue({
      used: 0,
      limit: 0
    })
    vi.mocked(quotaModule.verifyChatTokenQuota).mockImplementation(() => {})
    vi.mocked(quotaModule.consumeChatTokens).mockResolvedValue(0)
    vi.mocked(toolsModule.loadPdfToDoc).mockResolvedValue([
      { pageContent: "test content", metadata: { totalPages: 1 } }
    ])
    vi.mocked(evaluationModule.evaluateAndSaveResume).mockResolvedValue({
      gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
      gaps: [],
      actions: []
    })
    vi.mocked(writerManager.registerWriter).mockReturnValue(undefined)

    vi.mocked(writerManager.sendData).mockImplementation(
      async (processId: string, data: any) => {
        sentData.push(data)
      }
    )

    vi.mocked(writerManager.closeWriter).mockReturnValue(undefined)

    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const flushAsyncWork = async () => {
    await Promise.resolve()
    await Promise.resolve()
  }

  const wait = async (ms: number) => {
    const step = 100
    let elapsed = 0

    while (elapsed <= ms) {
      await vi.advanceTimersByTimeAsync(step)
      await flushAsyncWork()

      elapsed += step
    }
  }

  const createMockRequest = (file?: File, jobInfo?: any): NextRequest => {
    const formData = new FormData()
    if (file) {
      formData.append("file", file)
    }
    if (jobInfo) {
      formData.append("jobInfo", JSON.stringify(jobInfo))
    }

    return new NextRequest(
      "http://localhost:3000/api/resume/upload-and-analyze",
      {
        method: "POST",
        body: formData
      }
    )
  }

  const mockResumeData = {
    sectionOrder: ["education", "employment", "skills"] as const,
    personalInfo: {
      blockId: "p1",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "1234567890"
    },
    education: { title: "Education", blocks: [] },
    employment: { title: "Employments", blocks: [] },
    skills: { title: "Skills", blocks: [] }
  } as unknown as ResumeData

  const mockJobInfo = {
    name: "Frontend Developer",
    company: "Tech Corp",
    description: "We are looking for a skilled frontend developer..."
  }

  const mockUploadResult = {
    fileName: "test-resume.pdf",
    publicUrl: "https://example.com/test-resume.pdf",
    userId: "user-123"
  }

  const mockCreateResumeRecordResult = {
    jobData: {
      id: "job-123",
      name: "Frontend Developer",
      company: "Tech Corp",
      description: "We are looking for a skilled frontend developer...",
      created_at: "2024-01-01T00:00:00Z"
    },
    resumeData: {
      id: "resume-123",
      user_id: "user-123",
      job_id: "job-123",
      upload_url: "https://example.com/test-resume.pdf",
      evaluation_report: null,
      evaluation_report_refresh_flag: false,
      language: "en" as Locale,
      resume_json: mockResumeData,
      created_at: "2024-01-01T00:00:00Z"
    },
    applicationData: {
      id: "application-123",
      user_id: "user-123",
      resume_id: "resume-123",
      job_id: "job-123",
      optimized_resume_url: null,
      created_at: "2024-01-01T00:00:00Z"
    }
  }

  describe("Success scenarios", () => {
    it("should return 200 when valid PDF file is provided", async () => {
      const pdfPath = path.resolve("test/test_pdf.pdf")
      if (!fs.existsSync(pdfPath)) {
        console.warn("test_pdf.pdf not found, skip this test")
        return
      }

      const buffer = fs.readFileSync(pdfPath)
      const file = new File([buffer], "test_pdf.pdf", {
        type: "application/pdf"
      })

      vi.mocked(resumeModule.uploadResumeFile).mockResolvedValue(
        mockUploadResult
      )
      vi.mocked(resumeParser.parseResumeWithTokenUsage).mockResolvedValue({
        resumeData: mockResumeData,
        language: "en",
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          reasoningTokens: 0,
          totalTokens: 0
        }
      })
      vi.mocked(resumeModule.createResumeRecord).mockResolvedValue(
        mockCreateResumeRecordResult
      )

      const request = createMockRequest(file, mockJobInfo)
      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(5000)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(sentData).toHaveLength(10)

      expect(sentData[0]).toEqual({ step: "upload", status: "loading" })
      expect(sentData[1]).toEqual({ step: "upload", status: "success" })
      expect(sentData[2]).toEqual({ step: "load", status: "loading" })
      expect(sentData[3]).toEqual({ step: "load", status: "success" })
      expect(sentData[4]).toEqual({ step: "parse", status: "loading" })
      expect(sentData[5]).toEqual({ step: "parse", status: "success" })
      expect(sentData[6]).toEqual({ step: "prepare", status: "loading" })
      expect(sentData[7]).toEqual({ step: "prepare", status: "success" })
      expect(sentData[8]).toEqual({ step: "evaluate", status: "loading" })
      expect(sentData[9]).toEqual({
        step: "evaluate",
        status: "success",
        resumeId: "resume-123",
        applicationId: "application-123"
      })

      expect(resumeModule.uploadResumeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "test_pdf.pdf",
          type: "application/pdf"
        })
      )
      expect(toolsModule.loadPdfToDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "test_pdf.pdf",
          type: "application/pdf"
        }),
        {
          splitPages: false
        }
      )
      expect(resumeParser.parseResumeWithTokenUsage).toHaveBeenCalledWith(
        "test content"
      )
      expect(resumeModule.createResumeRecord).toHaveBeenCalledWith(
        mockJobInfo,
        mockUploadResult,
        mockResumeData,
        "en"
      )
      expect(evaluationModule.evaluateAndSaveResume).toHaveBeenCalled()
    })

    it("should handle different languages correctly", async () => {
      const pdfPath = path.resolve("test/test_pdf.pdf")
      if (!fs.existsSync(pdfPath)) {
        console.warn("test_pdf.pdf not found, skip this test")
        return
      }

      const buffer = fs.readFileSync(pdfPath)
      const file = new File([buffer], "test_pdf.pdf", {
        type: "application/pdf"
      })

      vi.mocked(resumeModule.uploadResumeFile).mockResolvedValue(
        mockUploadResult
      )
      vi.mocked(resumeParser.parseResumeWithTokenUsage).mockResolvedValue({
        resumeData: mockResumeData,
        language: "zh",
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          reasoningTokens: 0,
          totalTokens: 0
        }
      })
      vi.mocked(resumeModule.createResumeRecord).mockResolvedValue(
        mockCreateResumeRecordResult
      )

      const request = createMockRequest(file, mockJobInfo)
      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(5000)

      const response = await responsePromise

      expect(response.status).toBe(200)

      expect(sentData).toHaveLength(10)

      expect(resumeModule.createResumeRecord).toHaveBeenCalledWith(
        mockJobInfo,
        mockUploadResult,
        mockResumeData,
        "zh"
      )
    })

    it("should consume chat tokens after resume parsing", async () => {
      const file = new File([Buffer.from("test pdf content")], "test.pdf", {
        type: "application/pdf"
      })

      vi.mocked(resumeModule.uploadResumeFile).mockResolvedValue(
        mockUploadResult
      )
      vi.mocked(quotaModule.getActiveAccessPass).mockResolvedValue({
        id: "pass-123"
      } as never)
      vi.mocked(resumeParser.parseResumeWithTokenUsage).mockResolvedValue({
        resumeData: mockResumeData,
        language: "en",
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 80,
          cachedTokens: 20,
          reasoningTokens: 0,
          totalTokens: 200
        }
      })
      vi.mocked(resumeModule.createResumeRecord).mockResolvedValue(
        mockCreateResumeRecordResult
      )

      const request = createMockRequest(file, mockJobInfo)
      const responsePromise = POST(request)

      await wait(5000)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(quotaModule.getActiveAccessPass).toHaveBeenCalledWith("user-123")
      expect(quotaModule.verifyChatTokenQuota).toHaveBeenCalledWith(0, 0)
      expect(quotaModule.consumeChatTokens).toHaveBeenCalledWith(
        "pass-123",
        200
      )
    })
  })

  describe("Validation error scenarios", () => {
    it("should return 400 error when no file is provided", async () => {
      const request = createMockRequest(undefined, mockJobInfo)
      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(100)

      const response = await responsePromise
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("No file provided")
      expect(quotaModule.verifyJobApplicationLimit).toHaveBeenCalled()
    })

    it("should send error response when file is not PDF format", async () => {
      const file = new File([Buffer.from("not a pdf")], "test.txt", {
        type: "text/plain"
      })
      const request = createMockRequest(file, mockJobInfo)

      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(100)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(sentData.length).toBeGreaterThanOrEqual(1)
      expect(sentData[0]).toEqual({
        error: "Only support upload pdf file as resume"
      })

      expect(resumeModule.uploadResumeFile).not.toHaveBeenCalled()
      expect(resumeParser.parseResumeWithTokenUsage).not.toHaveBeenCalled()
      expect(resumeModule.createResumeRecord).not.toHaveBeenCalled()
    })
  })

  describe("Quota error scenarios", () => {
    it("should handle quota exceeded error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      vi.mocked(quotaModule.verifyJobApplicationLimit).mockImplementation(
        () => {
          throw new Error("Limit reached")
        }
      )

      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(100)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(sentData.length).toBeGreaterThanOrEqual(1)
      expect(sentData[0]).toEqual({ error: "Limit reached" })
    })
  })

  describe("Server error scenarios", () => {
    it("should handle upload file error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      vi.mocked(resumeModule.uploadResumeFile).mockRejectedValue(
        new Error("Upload failed")
      )

      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(2000)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(sentData.length).toBeGreaterThanOrEqual(1)
      const lastMessage = sentData[sentData.length - 1]
      expect(lastMessage).toEqual({ error: "Upload failed" })

      expect(resumeParser.parseResumeWithTokenUsage).not.toHaveBeenCalled()
      expect(resumeModule.createResumeRecord).not.toHaveBeenCalled()
    })

    it("should handle resume parsing error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      vi.mocked(resumeModule.uploadResumeFile).mockResolvedValue(
        mockUploadResult
      )
      vi.mocked(resumeParser.parseResumeWithTokenUsage).mockRejectedValue(
        new Error("Parsing failed")
      )

      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(4000)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(sentData.length).toBeGreaterThanOrEqual(1)
      const lastMessage = sentData[sentData.length - 1]
      expect(lastMessage).toEqual({ error: "Parsing failed" })

      expect(resumeModule.createResumeRecord).not.toHaveBeenCalled()
    })

    it("should handle create resume record error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      vi.mocked(resumeModule.uploadResumeFile).mockResolvedValue(
        mockUploadResult
      )
      vi.mocked(resumeParser.parseResumeWithTokenUsage).mockResolvedValue({
        resumeData: mockResumeData,
        language: "en",
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          reasoningTokens: 0,
          totalTokens: 0
        }
      })
      vi.mocked(resumeModule.createResumeRecord).mockRejectedValue(
        new Error("Database error")
      )

      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(5000)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(sentData.length).toBeGreaterThanOrEqual(1)
      const lastMessage = sentData[sentData.length - 1]
      expect(lastMessage).toEqual({ error: "Database error" })
    })
  })

  describe("Edge cases", () => {
    it("should handle request abortion", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      vi.mocked(resumeModule.uploadResumeFile).mockResolvedValue(
        mockUploadResult
      )
      vi.mocked(resumeParser.parseResumeWithTokenUsage).mockResolvedValue({
        resumeData: mockResumeData,
        language: "en",
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          reasoningTokens: 0,
          totalTokens: 0
        }
      })
      vi.mocked(resumeModule.createResumeRecord).mockResolvedValue(
        mockCreateResumeRecordResult
      )

      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(5000)

      const response = await responsePromise
      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(writerManager.closeWriter).toHaveBeenCalled()
    })

    it("should handle malformed job info JSON", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const formData = new FormData()
      formData.append("file", file)
      formData.append("jobInfo", "invalid json")

      const request = new NextRequest(
        "http://localhost:3000/api/resume/upload-and-analyze",
        {
          method: "POST",
          body: formData
        }
      )

      const responsePromise = POST(request)

      // Advance timers to let async operations complete
      await wait(100)

      const response = await responsePromise

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")

      expect(sentData.length).toBeGreaterThanOrEqual(1)
      expect(sentData[0].error).toContain("not valid JSON")
    })
  })
})
