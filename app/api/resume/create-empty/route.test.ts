/**
 * @vitest-environment node
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

// Mock Supabase client to avoid cookies() call outside request scope
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}))

vi.mock("@/server/intake/empty-orchestrator", () => ({
  createEmptyResume: vi.fn()
}))

const { createClient } = await import("@/lib/supabase/server")
const { createEmptyResume } = await import("@/server/intake/empty-orchestrator")

describe("POST /api/resume/create-empty", () => {
  let mockCreateEmptyResume: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "test-user-id" } },
          error: null
        })
      }
    } as any)

    mockCreateEmptyResume = vi.mocked(createEmptyResume)
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

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: null },
            error: null
          })
        }
      } as any)

      const request = createMockRequest({
        jobInfo: { name: "Dev", company: "Co", description: "desc" }
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

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
        jobData: { id: "job-123" },
        resumeData: { id: "resume-123" },
        applicationData: { id: "app-123" }
      }

      mockCreateEmptyResume.mockResolvedValue(mockResult)

      const request = createMockRequest({ jobInfo: mockJobInfo })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResult)
      expect(mockCreateEmptyResume).toHaveBeenCalledWith({
        actorId: "test-user-id",
        jobInfo: mockJobInfo,
        language: "en"
      })
    })

    it("should pass through supported language", async () => {
      const mockJobInfo = {
        name: "Developer",
        company: "Startup",
        description: ""
      }

      mockCreateEmptyResume.mockResolvedValue({
        jobData: { id: "job-zh" },
        resumeData: { id: "resume-zh" },
        applicationData: { id: "app-zh" }
      })

      const request = createMockRequest({
        jobInfo: mockJobInfo,
        language: "zh"
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockCreateEmptyResume).toHaveBeenCalledWith({
        actorId: "test-user-id",
        jobInfo: mockJobInfo,
        language: "zh"
      })
    })
  })

  describe("Error scenarios", () => {
    it("should return 500 when createEmptyResume throws", async () => {
      const mockJobInfo = {
        name: "Developer",
        company: "Tech",
        description: "Job description"
      }

      mockCreateEmptyResume.mockRejectedValue(new Error("Database error"))

      const request = createMockRequest({ jobInfo: mockJobInfo })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Database error")
    })
  })
})
