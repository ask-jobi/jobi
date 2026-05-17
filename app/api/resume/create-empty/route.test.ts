/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { createEmptyApplicationResumeRecord } from "@/server/resume"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

vi.mock("@/server/resume", () => ({
  createEmptyApplicationResumeRecord: vi.fn()
}))

describe("POST /api/resume/create-empty", () => {
  let mockCreateEmptyResumeRecord: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateEmptyResumeRecord = vi.mocked(createEmptyApplicationResumeRecord)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: object): NextRequest => {
    return new NextRequest("http://localhost:3000/api/resume/create-empty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  describe("Validation scenarios", () => {
    it("should return 400 when jobInfo is missing", async () => {
      const request = createMockRequest({})
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("No job info provided")
    })

    it("should return 400 when jobInfo is null", async () => {
      const request = createMockRequest({ jobInfo: null })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe("Success scenarios", () => {
    it("should successfully create empty resume record", async () => {
      const mockJobInfo = {
        name: "Frontend Developer",
        company: "Tech Corp",
        description: "Looking for a skilled developer"
      }

      const mockResult = {
        id: "resume-123",
        job_id: "job-123",
        created_at: "2024-01-01T00:00:00Z"
      }

      mockCreateEmptyResumeRecord.mockResolvedValue(mockResult)

      const request = createMockRequest({ jobInfo: mockJobInfo })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResult)
      expect(mockCreateEmptyResumeRecord).toHaveBeenCalledWith(
        mockJobInfo,
        "en"
      )
    })

    it("should handle empty job description", async () => {
      const mockJobInfo = {
        name: "Developer",
        company: "Startup",
        description: ""
      }

      const mockResult = { id: "resume-456" }
      mockCreateEmptyResumeRecord.mockResolvedValue(mockResult)

      const request = createMockRequest({ jobInfo: mockJobInfo })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it("should pass through supported language", async () => {
      const mockJobInfo = {
        name: "Developer",
        company: "Startup",
        description: ""
      }

      mockCreateEmptyResumeRecord.mockResolvedValue({ id: "resume-zh" })

      const request = createMockRequest({
        jobInfo: mockJobInfo,
        language: "zh"
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockCreateEmptyResumeRecord).toHaveBeenCalledWith(
        mockJobInfo,
        "zh"
      )
    })
  })

  describe("Error scenarios", () => {
    it("should return 500 when createEmptyApplicationResumeRecord throws an error", async () => {
      const mockJobInfo = {
        name: "Developer",
        company: "Tech",
        description: "Job description"
      }

      mockCreateEmptyResumeRecord.mockRejectedValue(new Error("Database error"))

      const request = createMockRequest({ jobInfo: mockJobInfo })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Database error")
    })

    it("should return 500 when unknown error occurs", async () => {
      const mockJobInfo = {
        name: "Developer",
        company: "Tech",
        description: "Job description"
      }

      mockCreateEmptyResumeRecord.mockRejectedValue("Unknown error")

      const request = createMockRequest({ jobInfo: mockJobInfo })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
