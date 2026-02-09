import { NextRequest } from "next/server"
import type { ResumeData } from "@/types/resume"
import { Locale } from "@/lib/i18n/config"
import { jest } from "@jest/globals"

let GET: typeof import("./route").GET
const mockGetJobApplication = jest.fn()
const mockGenerateOps = jest.fn()
const mockConsumeQuota = jest.fn()

jest.unstable_mockModule("@/server/resume", () => ({
  getJobApplication: (...args: any[]) => mockGetJobApplication(...args)
}))

jest.unstable_mockModule("@/server/ai/resume-ops-from-eval", () => ({
  generateResumeEditOpsFromEvaluation: (...args: any[]) =>
    mockGenerateOps(...args)
}))

jest.unstable_mockModule("@/server/quota", () => ({
  consumeQuota: (...args: any[]) => mockConsumeQuota(...args)
}))

const mockResumeData: ResumeData = {
  personalInfo: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890"
  },
  education: { title: "Education", order: 1, blocks: [] },
  employment: {
    title: "Employment",
    order: 2,
    blocks: [
      {
        company: "Acme",
        jobTitle: "Engineer",
        start: "2020",
        end: "2022",
        content: "Original content"
      }
    ]
  },
  skills: { title: "Skills", order: 3, blocks: [] }
}

const mockJobApplication = {
  id: "job-app-123",
  resumes: {
    id: "resume-123",
    language: "en" as Locale,
    resume_json: mockResumeData,
    evaluation_report: {
      gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
      gaps: [],
      actions: []
    }
  },
  jobs: {
    id: "job-123",
    name: "Frontend Developer",
    company: "Tech Corp",
    description: "We are looking..."
  }
}

const createMockRequest = (jobApplicationId?: string) => {
  const url = new URL("http://localhost:3000/api/resume/ops-from-evaluation")
  if (jobApplicationId) {
    url.searchParams.set("jobApplicationId", jobApplicationId)
  }
  return new NextRequest(url.toString(), { method: "GET" })
}

describe("GET /api/resume/ops-from-evaluation", () => {
  beforeAll(async () => {
    const module = await import("./route")
    GET = module.GET
  })

  beforeEach(() => jest.clearAllMocks())

  it("returns op previews", async () => {
    mockGetJobApplication.mockResolvedValue(mockJobApplication as any)
    mockGenerateOps.mockResolvedValue({
      ops: [
        {
          op: "updateBlock",
          section: "employment",
          blockIndex: 0,
          payload: { content: "Updated content" }
        }
      ],
      errors: []
    })
    mockConsumeQuota.mockResolvedValue(undefined as any)

    const response = await GET(createMockRequest("job-app-123"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.opPreviews)).toBe(true)
    expect(data.opPreviews.length).toBe(1)
    expect(data.errors).toEqual([])
  })

  it("filters no-op updates and reports an error", async () => {
    mockGetJobApplication.mockResolvedValue(mockJobApplication as any)
    mockGenerateOps.mockResolvedValue({
      ops: [
        {
          op: "updateBlock",
          section: "employment",
          blockIndex: 0,
          payload: { content: "Original content" }
        }
      ],
      errors: []
    })
    mockConsumeQuota.mockResolvedValue(undefined as any)

    const response = await GET(createMockRequest("job-app-123"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.opPreviews.length).toBe(0)
    expect(data.errors).toEqual([
      { opIndex: 0, message: "no changes detected" }
    ])
  })

  it("filters payloads without valid fields and reports an error", async () => {
    mockGetJobApplication.mockResolvedValue(mockJobApplication as any)
    mockGenerateOps.mockResolvedValue({
      ops: [
        {
          op: "updateBlock",
          section: "employment",
          blockIndex: 0,
          payload: { title: "Not a valid field" }
        }
      ],
      errors: []
    })
    mockConsumeQuota.mockResolvedValue(undefined as any)

    const response = await GET(createMockRequest("job-app-123"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.opPreviews.length).toBe(0)
    expect(data.errors).toEqual([
      { opIndex: 0, message: "payload has no valid fields" }
    ])
  })
})
