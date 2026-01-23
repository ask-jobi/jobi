/**
 * @vitest-environment node
 */

import {
  evaluateAndSaveResume,
  updateResumeEvaluationReport,
  updateResumeEvaluationReportRefreshFlag
} from "./evaluation"
import { createClient } from "@/lib/supabase/server"
import { evaluateResume } from "@/server/ai/resume-evaluator"
import type { ResumeData } from "@/types/resume"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { ResumeEvaluationOutput } from "@/types/evaluation"

vi.mock("@/lib/supabase/server")
vi.mock("@/server/ai/resume-evaluator")

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>
const mockEvaluateResume = evaluateResume as unknown as ReturnType<typeof vi.fn>

describe("evaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockResumeData: ResumeData = {
    personalInfo: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: ""
    },
    education: { title: "Education", order: 0, blocks: [] },
    employment: { title: "Employment", order: 1, blocks: [] },
    skills: { title: "Skills", order: 2, blocks: [] }
  }

  const mockReport: ResumeEvaluationOutput = {
    gates: {
      ats: "pass",
      hr: "pass",
      hiringManager: "borderline"
    },
    gaps: [
      {
        dimension: "metrics",
        severity: "important",
        description: "Add more quantifiable achievements",
        evidence: "Current experience lacks specific metrics"
      }
    ],
    actions: [
      {
        priority: "1",
        targetSection: "work_experience",
        instruction: "Add metrics and numbers to demonstrate impact"
      }
    ]
  }

  describe("evaluateAndSaveResume", () => {
    it("should evaluate and save resume successfully", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )
      mockEvaluateResume.mockResolvedValue(mockReport)

      const result = await evaluateAndSaveResume("resume-123", mockResumeData)

      expect(result).toEqual(mockReport)
      expect(mockEvaluateResume).toHaveBeenCalledWith(mockResumeData, undefined)
      expect(mockSupabase.from).toHaveBeenCalledWith("resumes")
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })

    it("should evaluate with job description when provided", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )
      mockEvaluateResume.mockResolvedValue(mockReport)

      const jobDescription = "Looking for a senior engineer"
      await evaluateAndSaveResume("resume-123", mockResumeData, jobDescription)

      expect(mockEvaluateResume).toHaveBeenCalledWith(
        mockResumeData,
        jobDescription
      )
    })

    it("should throw error when database update fails", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: "Update failed" }
            })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )
      mockEvaluateResume.mockResolvedValue(mockReport)

      await expect(
        evaluateAndSaveResume("resume-123", mockResumeData)
      ).rejects.toThrow("Failed to save resume evaluation: Update failed")
    })

    it("should throw error when AI evaluation fails", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )
      mockEvaluateResume.mockRejectedValue(new Error("AI service unavailable"))

      await expect(
        evaluateAndSaveResume("resume-123", mockResumeData)
      ).rejects.toThrow("AI service unavailable")
    })

    it("should set evaluation_report_refresh_flag to false", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )
      mockEvaluateResume.mockResolvedValue(mockReport)

      await evaluateAndSaveResume("resume-123", mockResumeData)

      const updateCall = mockSupabase.from("resumes").update
      expect(updateCall).toHaveBeenCalledWith({
        evaluation_report: mockReport,
        evaluation_report_refresh_flag: false
      })
    })
  })

  describe("updateResumeEvaluationReport", () => {
    it("should update evaluation report successfully", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )

      const result = await updateResumeEvaluationReport(
        "resume-123",
        mockReport
      )

      expect(result).toEqual(mockReport)
      expect(mockSupabase.from).toHaveBeenCalledWith("resumes")
      const updateCall = mockSupabase.from("resumes").update
      expect(updateCall).toHaveBeenCalledWith({
        evaluation_report: mockReport,
        evaluation_report_refresh_flag: false
      })
    })

    it("should throw error when update fails", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: "Database error" }
            })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )

      await expect(
        updateResumeEvaluationReport("resume-123", mockReport)
      ).rejects.toThrow("Failed to update resume evaluation: Database error")
    })

    it("should use correct resume ID for update", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )

      await updateResumeEvaluationReport("specific-resume-id", mockReport)

      const eqCall = mockSupabase.from("resumes").update(expect.any(Object)).eq
      expect(eqCall).toHaveBeenCalledWith("id", "specific-resume-id")
    })
  })

  describe("updateResumeEvaluationReportRefreshFlag", () => {
    it("should set refresh flag to true by default", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )

      await updateResumeEvaluationReportRefreshFlag("resume-123")

      const updateCall = mockSupabase.from("resumes").update
      expect(updateCall).toHaveBeenCalledWith({
        evaluation_report_refresh_flag: true
      })
    })

    it("should set refresh flag to false when explicitly specified", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )

      await updateResumeEvaluationReportRefreshFlag("resume-123", false)

      const updateCall = mockSupabase.from("resumes").update
      expect(updateCall).toHaveBeenCalledWith({
        evaluation_report_refresh_flag: false
      })
    })

    it("should throw error when update fails", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: "Update flag failed" }
            })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )

      await expect(
        updateResumeEvaluationReportRefreshFlag("resume-123")
      ).rejects.toThrow(
        "Failed to update resume evaluation: Update flag failed"
      )
    })

    it("should use correct resume ID for update", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
      mockCreateClient.mockResolvedValue(
        mockSupabase as unknown as ReturnType<typeof createClient>
      )

      await updateResumeEvaluationReportRefreshFlag("target-resume-id")

      const eqCall = mockSupabase.from("resumes").update(expect.any(Object)).eq
      expect(eqCall).toHaveBeenCalledWith("id", "target-resume-id")
    })
  })
})
