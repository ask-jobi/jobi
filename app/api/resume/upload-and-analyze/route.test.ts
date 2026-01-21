/**
 * @jest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { parseResume } from "@/server/ai/resume-parser"
import { createResumeRecord, uploadResumeFile } from "@/server/resume"
import { consumeQuota, verifyJobApplicationLimit } from "@/server/quota"
import { loadPdfToDoc } from "@/server/ai/tools"
import { evaluateAndSaveResume } from "@/server/evaluation"
import {
  registerWriter,
  sendData,
  closeWriter
} from "@/server/sse/writer-manager"
import path from "node:path"
import * as fs from "node:fs"
import { Locale } from "@/lib/i18n/config"

// Mock the dependencies
jest.mock("@/server/ai/resume-parser", () => ({
  parseResume: jest.fn()
}))

jest.mock("@/server/resume", () => ({
  createResumeRecord: jest.fn(),
  uploadResumeFile: jest.fn()
}))

jest.mock("@/server/quota", () => ({
  consumeQuota: jest.fn(),
  verifyJobApplicationLimit: jest.fn()
}))

jest.mock("@/server/ai/tools", () => ({
  loadPdfToDoc: jest.fn()
}))

jest.mock("@/server/evaluation", () => ({
  evaluateAndSaveResume: jest.fn()
}))

jest.mock("@/server/sse/writer-manager", () => ({
  registerWriter: jest.fn(),
  sendData: jest.fn().mockResolvedValue(undefined),
  closeWriter: jest.fn()
}))

jest.mock("@/server/rollback", () => ({
  rollbackStorage: {
    run: async (_ctx: any, fn: any) => fn(),
    getStore: () => ({ executeRollback: jest.fn() })
  },
  RollbackContext: class {}
}))

describe("POST /api/resume/upload-and-analyze", () => {
  const mockParseResume = parseResume as jest.MockedFunction<typeof parseResume>
  const mockCreateResumeRecord = createResumeRecord as jest.MockedFunction<
    typeof createResumeRecord
  >
  const mockUploadResumeFile = uploadResumeFile as jest.MockedFunction<
    typeof uploadResumeFile
  >
  const mockConsumeQuota = consumeQuota as jest.MockedFunction<
    typeof consumeQuota
  >
  const mockVerifyJobApplicationLimit =
    verifyJobApplicationLimit as jest.MockedFunction<
      typeof verifyJobApplicationLimit
    >
  const mockLoadPdfToDoc = loadPdfToDoc as jest.MockedFunction<
    typeof loadPdfToDoc
  >
  const mockEvaluateAndSaveResume =
    evaluateAndSaveResume as jest.MockedFunction<typeof evaluateAndSaveResume>
  const mockRegisterWriter = registerWriter as jest.MockedFunction<
    typeof registerWriter
  >
  const mockSendData = sendData as jest.MockedFunction<typeof sendData>
  const mockCloseWriter = closeWriter as jest.MockedFunction<typeof closeWriter>

  beforeAll(() => {
    jest.setTimeout(30000)
  })

  beforeEach(() => {
    jest.resetAllMocks()
    mockConsumeQuota.mockResolvedValue(undefined)
    mockVerifyJobApplicationLimit.mockResolvedValue(undefined)
    mockLoadPdfToDoc.mockResolvedValue([
      { pageContent: "test content", metadata: { totalPages: 1 } }
    ])
    mockEvaluateAndSaveResume.mockResolvedValue({
      gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
      gaps: [],
      actions: []
    })
    mockRegisterWriter.mockReturnValue(undefined)
    mockSendData.mockResolvedValue(undefined)
    mockCloseWriter.mockReturnValue(undefined)
  })

  const getMockPdfFile = (): File => {
    const pdfPath = path.resolve("test/test_pdf.pdf")
    const buffer = fs.readFileSync(pdfPath)
    return new File([buffer], "test_pdf.pdf", { type: "application/pdf" })
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
    personalInfo: {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "1234567890"
    },
    education: { title: "Education", order: 0, blocks: [] },
    employment: { title: "Employments", order: 1, blocks: [] },
    skills: { title: "Skills", order: 2, blocks: [] }
  }

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
    }
  }

  async function readStreamAndParseDataLines(
    stream: ReadableStream<Uint8Array>
  ): Promise<Array<any>> {
    if (!stream) {
      throw new Error("Stream is null or undefined.")
    }

    const reader = stream.getReader()
    const textDecoder = new TextDecoder()
    let accumulatedResult = ""
    const parsedData: Array<any> = []
    const dataLineRegex = /^data:\s*(?<jsonData>\{.*\})$/m

    const webReader = reader as ReadableStreamDefaultReader<Uint8Array>
    while (true) {
      const { done, value } = await webReader.read()
      if (done) break
      accumulatedResult += textDecoder.decode(value)

      const lines = accumulatedResult.split("\n")
      accumulatedResult = lines.pop() || ""

      for (const line of lines) {
        const match = line.match(dataLineRegex)
        if (match && match.groups?.jsonData) {
          try {
            parsedData.push(JSON.parse(match.groups.jsonData))
          } catch (e) {
            console.error("Error parsing JSON from stream line:", line, e)
          }
        }
      }
    }

    return parsedData
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

      mockUploadResumeFile.mockResolvedValue(mockUploadResult)
      mockParseResume.mockResolvedValue([mockResumeData, "en"])
      mockCreateResumeRecord.mockResolvedValue(mockCreateResumeRecordResult)
      mockConsumeQuota.mockResolvedValue(undefined)

      const request = createMockRequest(file, mockJobInfo)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")
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

      mockUploadResumeFile.mockResolvedValue(mockUploadResult)
      mockParseResume.mockResolvedValue([mockResumeData, "zh"])
      mockCreateResumeRecord.mockResolvedValue(mockCreateResumeRecordResult)
      mockConsumeQuota.mockResolvedValue(undefined)

      const request = createMockRequest(file, mockJobInfo)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe("Validation error scenarios", () => {
    it("should return 400 error when no file is provided", async () => {
      const request = createMockRequest(undefined, mockJobInfo)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("No file provided")
      expect(mockUploadResumeFile).not.toHaveBeenCalled()
      expect(mockParseResume).not.toHaveBeenCalled()
      expect(mockCreateResumeRecord).not.toHaveBeenCalled()
      expect(mockVerifyJobApplicationLimit).toHaveBeenCalled()
    })

    it("should send error response when file is not PDF format", async () => {
      const file = new File([Buffer.from("not a pdf")], "test.txt", {
        type: "text/plain"
      })
      const request = createMockRequest(file, mockJobInfo)

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")
      expect(mockUploadResumeFile).not.toHaveBeenCalled()
      expect(mockParseResume).not.toHaveBeenCalled()
      expect(mockCreateResumeRecord).not.toHaveBeenCalled()
    })
  })

  describe("Quota error scenarios", () => {
    it("should handle quota exceeded error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      mockConsumeQuota.mockImplementation(() => {
        throw new Error("Limit reached")
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")
    })
  })

  describe("Server error scenarios", () => {
    it("should handle upload file error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      mockUploadResumeFile.mockRejectedValue(new Error("Upload failed"))

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")
      expect(mockParseResume).not.toHaveBeenCalled()
      expect(mockCreateResumeRecord).not.toHaveBeenCalled()
    })

    it("should handle resume parsing error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      mockUploadResumeFile.mockResolvedValue(mockUploadResult)
      mockParseResume.mockRejectedValue(new Error("Parsing failed"))

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")
      expect(mockCreateResumeRecord).not.toHaveBeenCalled()
    })

    it("should handle create resume record error", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      mockUploadResumeFile.mockResolvedValue(mockUploadResult)
      mockParseResume.mockResolvedValue([mockResumeData, "en"])
      mockCreateResumeRecord.mockRejectedValue(new Error("Database error"))

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")
    })
  })

  describe("Edge cases", () => {
    it("should handle request abortion", async () => {
      const buffer = Buffer.from("test pdf content")
      const file = new File([buffer], "test.pdf", {
        type: "application/pdf"
      })
      const request = createMockRequest(file, mockJobInfo)

      setTimeout(() => {
        request.signal.dispatchEvent(new Event("abort"))
      }, 100)

      const response = await POST(request)
      expect(response.status).toBe(200)
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

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get("Content-Type")).toBe("text/event-stream")
    })
  })
})
