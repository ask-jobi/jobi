import { GET } from "./route"
import { getJobApplication } from "@/server/resume"
import { generateResumeEditOpsFromEvaluation } from "@/server/ai/resume-ops-from-eval"
import { consumeQuota } from "@/server/quota"
import { NextRequest } from "next/server"
import type { ResumeData } from "@/types/resume"
import { Locale } from "@/lib/i18n/config"

jest.mock("@/server/resume", () => ({
  getJobApplication: jest.fn()
}))

jest.mock("@/server/ai/resume-ops-from-eval", () => ({
  generateResumeEditOpsFromEvaluation: jest.fn()
}))

jest.mock("@/server/quota", () => ({
  consumeQuota: jest.fn()
}))

const mockGetJobApplication = getJobApplication as jest.MockedFunction<
  typeof getJobApplication
>
const mockGenerateOps =
  generateResumeEditOpsFromEvaluation as jest.MockedFunction<
    typeof generateResumeEditOpsFromEvaluation
  >
const mockConsumeQuota = consumeQuota as jest.MockedFunction<
  typeof consumeQuota
>

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
})
