import { POST } from "./route"
import { rewriteBlock } from "@/server/ai/resume-rewriter"
import { consumeQuota } from "@/server/quota"
import type { RewriteBlockRequest } from "@/types/api/requests"

// Mock the rewriteBlock function
jest.mock("@/server/ai/resume-rewriter", () => ({
  rewriteBlock: jest.fn()
}))

jest.mock("@/server/quota", () => ({
  consumeQuota: jest.fn()
}))

const mockRewriteBlock = rewriteBlock as jest.MockedFunction<
  typeof rewriteBlock
>
const mockConsumeQuota = consumeQuota as jest.MockedFunction<
  typeof consumeQuota
>

describe("POST /api/resume/rewrite-block", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConsumeQuota.mockResolvedValue(undefined)
  })

  const createMockRequest = (body: RewriteBlockRequest): Request => {
    return new Request("http://localhost:3000/api/resume/rewrite-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
  }

  const validRequestBody: RewriteBlockRequest = {
    resumeSection: "工作经验部分",
    originalContent: "负责前端开发工作",
    jd: "需要3年前端开发经验，熟悉React和TypeScript",
    instruction: "量化成果",
    language: "zh"
  }

  describe("Success scenarios", () => {
    it("should successfully process valid request and return rewrite results", async () => {
      const mockResponse = "负责前端开发工作，提升了30%的用户体验"

      mockRewriteBlock.mockResolvedValue(mockResponse)

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
      expect(mockRewriteBlock).toHaveBeenCalledWith({
        resumeSection: validRequestBody.resumeSection,
        originalContent: validRequestBody.originalContent,
        jd: validRequestBody.jd,
        instruction: validRequestBody.instruction,
        language: validRequestBody.language
      })
    })

    it("should handle English language requests", async () => {
      const englishRequestBody: RewriteBlockRequest = {
        ...validRequestBody,
        language: "en"
      }

      const mockResponse = "Responsible for frontend development"

      mockRewriteBlock.mockResolvedValue(mockResponse)

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

      const request = createMockRequest(invalidBody as RewriteBlockRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteBlock).not.toHaveBeenCalled()
    })

    it("should return 400 error when jd is missing", async () => {
      const invalidBody = {
        ...validRequestBody,
        jd: ""
      }

      const request = createMockRequest(invalidBody as RewriteBlockRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteBlock).not.toHaveBeenCalled()
    })

    it("should return 400 error when instruction is missing", async () => {
      const invalidBody = {
        ...validRequestBody,
        instruction: ""
      }

      const request = createMockRequest(invalidBody as RewriteBlockRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteBlock).not.toHaveBeenCalled()
    })

    it("should return 400 error when originalContent is null", async () => {
      const invalidBody = {
        ...validRequestBody,
        originalContent: null as any
      }

      const request = createMockRequest(invalidBody as RewriteBlockRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("required fields are missed")
      expect(mockRewriteBlock).not.toHaveBeenCalled()
    })
  })

  describe("Server error scenarios", () => {
    it("should return 500 error when rewriteBlock throws an exception", async () => {
      const error = new Error("AI service unavailable")
      mockRewriteBlock.mockRejectedValue(error)

      const request = createMockRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("internal server error")
    })

    it("should return 500 error when request body parsing fails", async () => {
      const invalidRequest = new Request(
        "http://localhost:3000/api/resume/rewrite-block",
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
      const specialCharBody: RewriteBlockRequest = {
        ...validRequestBody,
        originalContent:
          "负责前端开发工作，使用React & TypeScript，处理过100+个bug",
        instruction: "突出技术栈 & 量化成果"
      }

      const mockResponse =
        "使用React和TypeScript进行前端开发，解决了100多个技术问题"

      mockRewriteBlock.mockResolvedValue(mockResponse)

      const request = createMockRequest(specialCharBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
    })

    it("should handle very long content", async () => {
      const longContent = "a".repeat(1000)
      const longBody: RewriteBlockRequest = {
        ...validRequestBody,
        originalContent: longContent
      }

      const mockResponse = "优化后的长内容"

      mockRewriteBlock.mockResolvedValue(mockResponse)

      const request = createMockRequest(longBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
    })
  })
})
