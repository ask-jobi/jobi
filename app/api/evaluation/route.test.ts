/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { evaluateResume } from "@/server/ai/resume-evaluator"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

vi.mock("@/server/ai/resume-evaluator", () => ({
  evaluateResume: vi.fn()
}))

describe("POST /api/evaluation", () => {
  let mockEvaluateResume: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockEvaluateResume = vi.mocked(evaluateResume)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: object): NextRequest => {
    return new NextRequest("http://localhost:3000/api/evaluation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  describe("Validation scenarios", () => {
    it("should return 400 when resumeData is missing", async () => {
      const request = createMockRequest({
        jobDescription: "Looking for a developer"
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Resume data is required")
    })
  })

  describe("Success scenarios", () => {
    it("should successfully evaluate resume", async () => {
      const mockResult = {
        score: 85,
        strengths: ["Good experience", "Clear structure"],
        improvements: ["Add more metrics"]
      }
      mockEvaluateResume.mockResolvedValue(mockResult)

      const request = createMockRequest({
        resumeData: { name: "John", experience: [] },
        jobDescription: "Looking for a senior developer"
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockResult)
      expect(mockEvaluateResume).toHaveBeenCalledWith(
        { name: "John", experience: [] },
        "Looking for a senior developer"
      )
    })

    it("should handle empty job description", async () => {
      const mockResult = { score: 50, strengths: [], improvements: [] }
      mockEvaluateResume.mockResolvedValue(mockResult)

      const request = createMockRequest({
        resumeData: { name: "John" }
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockEvaluateResume).toHaveBeenCalledWith(
        { name: "John" },
        undefined
      )
    })
  })

  describe("Error scenarios", () => {
    it("should return 500 when evaluation throws an error", async () => {
      mockEvaluateResume.mockRejectedValue(new Error("AI service unavailable"))

      const request = createMockRequest({
        resumeData: { name: "John" },
        jobDescription: "Looking for a developer"
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Evaluation failed")
      expect(data.details).toBe("AI service unavailable")
    })

    it("should return 500 when evaluation throws a non-Error", async () => {
      mockEvaluateResume.mockRejectedValue("Unknown error")

      const request = createMockRequest({
        resumeData: { name: "John" }
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Evaluation failed")
      expect(data.details).toBe("Unknown error")
    })
  })
})
