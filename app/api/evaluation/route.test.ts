import { vi } from "vitest"
import { POST } from "./route"
import { NextRequest } from "next/server"
import { evaluateAndSaveResume } from "@/server/evaluation"
import type { ResumeData } from "@/types/resume"

vi.mock("@/server/evaluation", () => ({
  evaluateAndSaveResume: vi.fn()
}))

const mockEvaluateAndSave = evaluateAndSaveResume as unknown as vi.Mock

const mockResumeData: ResumeData = {
  personalInfo: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "123"
  },
  education: { title: "Education", order: 0, blocks: [] },
  employment: { title: "Employment", order: 1, blocks: [] },
  skills: { title: "Skills", order: 2, blocks: [] }
}

describe("POST /api/evaluation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("evaluates and saves report", async () => {
    const report = {
      gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
      gaps: [],
      actions: []
    }
    mockEvaluateAndSave.mockResolvedValue(report as any)

    const request = new NextRequest("http://localhost:3000/api/evaluation", {
      method: "POST",
      body: JSON.stringify({
        resumeId: "resume-123",
        resumeData: mockResumeData,
        jobDescription: "JD"
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(report)
    expect(mockEvaluateAndSave).toHaveBeenCalledWith(
      "resume-123",
      mockResumeData,
      "JD"
    )
  })
})
