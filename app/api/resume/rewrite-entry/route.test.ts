import { POST } from "./route"
import { rewriteEntry } from "@/server/ai/resume-entry-rewriter"
import type { RewriteEntryRequest } from "@/types/api/requests"
import { vi, describe, it, expect, beforeEach } from "vitest"

// Mock the rewriteEntry function
vi.mock("@/server/ai/resume-entry-rewriter", () => ({
  rewriteEntry: vi.fn()
}))

const mockRewriteEntry = rewriteEntry as unknown as ReturnType<typeof vi.fn>

describe("POST /api/resume/rewrite-entry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (body: RewriteEntryRequest): Request => {
    return new Request("http://localhost:3000/api/resume/rewrite-entry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
  }

  const validRequestBody: RewriteEntryRequest = {
    resumeSection: "工作经验部分",
    originalContent: "负责前端开发工作",
    jd: "需要3年前端开发经验，熟悉React和TypeScript",
    instruction: "量化成果",
    language: "zh"
  }

  describe("Success scenarios", () => {
    it("should successfully process valid request and return rewrite results", async () => {
      const mockResponse = "负责前端开发工作，提升了30%的用户体验"

      mockRewriteEntry.mockResolvedValue(mockResponse)

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
      expect(mockRewriteEntry).toHaveBeenCalledWith({
        resumeSection: validRequestBody.resumeSection,
        originalContent: validRequestBody.originalContent,
        jd: validRequestBody.jd,
        instruction: validRequestBody.instruction,
        language: validRequestBody.language
      })
    })

    it("should handle English language requests", async () => {
      const englishRequestBody: RewriteEntryRequest = {
        ...validRequestBody,
        language: "en"
      }

      const mockResponse = "Responsible for frontend development"

      mockRewriteEntry.mockResolvedValue(mockResponse)

      const request = createMockRequest(englishRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
    })
  })

  describe("Validation error scenarios", () => {
    it("should return 400 error when originalContent is missing", async () => {
      const invalidBody = {
        ...validRequestBody,
        originalContent: ""
      }

      const request = createMockRequest(invalidBody as RewriteEntryRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteEntry).not.toHaveBeenCalled()
    })

    it("should return 400 error when jd is missing", async () => {
      const invalidBody = {
        ...validRequestBody,
        jd: ""
      }

      const request = createMockRequest(invalidBody as RewriteEntryRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteEntry).not.toHaveBeenCalled()
    })

    it("should return 400 error when instruction is missing", async () => {
      const invalidBody = {
        ...validRequestBody,
        instruction: ""
      }

      const request = createMockRequest(invalidBody as RewriteEntryRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteEntry).not.toHaveBeenCalled()
    })

    it("should return 400 error when originalContent is null", async () => {
      const invalidBody = {
        ...validRequestBody,
        originalContent: null as any
      }

      const request = createMockRequest(invalidBody as RewriteEntryRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteEntry).not.toHaveBeenCalled()
    })
  })

  describe("Server error scenarios", () => {
    it("should return 500 error when rewriteEntry throws an exception", async () => {
      const error = new Error("AI service unavailable")
      mockRewriteEntry.mockRejectedValue(error)

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("internal server error")
    })

    it("should return 500 error when request body parsing fails", async () => {
      const invalidRequest = new Request(
        "http://localhost:3000/api/resume/rewrite-entry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: "invalid json"
        }
      )

      const response = await POST(invalidRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("internal server error")
    })
  })

  describe("Edge cases", () => {
    it("should handle content with special characters", async () => {
      const specialCharBody: RewriteEntryRequest = {
        ...validRequestBody,
        originalContent:
          "负责前端开发工作，使用React & TypeScript，处理过100+个bug",
        instruction: "突出技术栈 & 量化成果"
      }

      const mockResponse =
        "使用React和TypeScript进行前端开发，解决了100多个技术问题"

      mockRewriteEntry.mockResolvedValue(mockResponse)

      const request = createMockRequest(specialCharBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
    })

    it("should handle very long content", async () => {
      const longContent = "a".repeat(1000)
      const longBody: RewriteEntryRequest = {
        ...validRequestBody,
        originalContent: longContent
      }

      const mockResponse = "优化后的长内容"

      mockRewriteEntry.mockResolvedValue(mockResponse)

      const request = createMockRequest(longBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
    })
  })
})
