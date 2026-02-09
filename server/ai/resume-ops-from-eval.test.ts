import { vi, describe, it, expect, beforeEach } from "vitest"
import { generateResumeEditOpsFromEvaluation } from "@/server/ai/resume-ops-from-eval"
import type { ResumeData } from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai")
  return {
    ...actual,
    generateText: vi.fn(),
    Output: { object: () => ({}) }
  }
})

const mockGenerateText = vi.mocked((await import("ai")).generateText)

const baseResume: ResumeData = {
  personalInfo: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "123"
  },
  education: { title: "Education", order: 0, blocks: [] },
  employment: {
    title: "Employment",
    order: 1,
    blocks: [
      {
        company: "ACME",
        jobTitle: "Engineer",
        start: "2020",
        end: "2022",
        content: "Did stuff"
      }
    ]
  },
  skills: { title: "Skills", order: 2, blocks: [] }
}

const evaluation: ResumeEvaluationOutput = {
  gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
  gaps: [],
  actions: [
    {
      priority: "1",
      targetSection: "work_experience",
      instruction: "Update the ACME role to emphasize leadership."
    }
  ]
}

describe("generateResumeEditOpsFromEvaluation", () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  it("returns ops from model output", async () => {
    // @ts-expect-error field missing
    mockGenerateText.mockResolvedValue({
      output: {
        ops: [
          {
            op: "updateBlock",
            section: "employment",
            blockIndex: 0,
            payload: { content: "Led team" }
          }
        ]
      }
    })

    const result = await generateResumeEditOpsFromEvaluation(
      evaluation,
      baseResume,
      "en"
    )

    expect(result.errors).toHaveLength(0)
    expect(result.ops[0].section).toBe("employment")
  })

  it("normalizes out-of-range blockIndex", async () => {
    // @ts-expect-error field missing
    mockGenerateText.mockResolvedValue({
      output: {
        ops: [
          {
            op: "updateBlock",
            section: "employment",
            blockIndex: 99,
            payload: { content: "X" }
          }
        ]
      }
    })

    const result = await generateResumeEditOpsFromEvaluation(
      evaluation,
      baseResume,
      "en"
    )

    expect(result.errors).toHaveLength(1)
    expect(result.ops).toHaveLength(0)
  })
})
