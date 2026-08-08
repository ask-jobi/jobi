/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDatabase } from "@/lib/db/client"
import { requireVerifiedUserIdentity } from "@/server/auth-helper"
import { evaluateResume } from "@/server/ai/resume-evaluator"
import {
  evaluateAndSaveResume,
  updateResumeEvaluationReport,
  updateResumeEvaluationReportRefreshFlag
} from "./evaluation"

const set = vi.fn()
const returning = vi.fn(async () => [{ id: "resume-1" }])

vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }))
vi.mock("@/server/auth-helper", () => ({
  requireVerifiedUserIdentity: vi.fn()
}))
vi.mock("@/server/ai/resume-evaluator", () => ({ evaluateResume: vi.fn() }))

describe("evaluation persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    set.mockReturnValue({ where: vi.fn(() => ({ returning })) })
    vi.mocked(getDatabase).mockResolvedValue({
      update: vi.fn(() => ({ set }))
    } as never)
    vi.mocked(requireVerifiedUserIdentity).mockResolvedValue({
      id: "workspace-1"
    })
  })

  it("evaluates and persists the report", async () => {
    const report = { score: 88 } as never
    vi.mocked(evaluateResume).mockResolvedValue(report)

    await expect(
      evaluateAndSaveResume("resume-1", {} as never, "job")
    ).resolves.toBe(report)
    expect(set).toHaveBeenCalledWith({
      evaluationReport: report,
      evaluationReportRefreshFlag: false
    })
  })

  it("updates an existing report", async () => {
    const report = { score: 90 } as never
    await expect(
      updateResumeEvaluationReport("resume-1", report)
    ).resolves.toBe(report)
  })

  it("updates the refresh flag", async () => {
    await updateResumeEvaluationReportRefreshFlag("resume-1", true)
    expect(set).toHaveBeenCalledWith({ evaluationReportRefreshFlag: true })
  })

  it("rejects a resume outside the workspace", async () => {
    returning.mockResolvedValueOnce([])
    await expect(
      updateResumeEvaluationReportRefreshFlag("other-resume")
    ).rejects.toThrow("Resume not found")
  })
})
