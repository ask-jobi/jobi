/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { evaluateResume } from "./resume-evaluator"
import type { ResumeData } from "@/types/resume"
import { generateText } from "ai"

vi.mock("ai", () => ({
  generateText: vi.fn(),
  wrapLanguageModel: vi.fn((config: any) => config.model),
  Output: {
    object: vi.fn()
  }
}))

vi.mock("@/lib/agent/model", () => ({
  model: vi.fn()
}))

vi.mock("@/lib/utils", () => ({
  resumeFormat: vi.fn()
}))

const createMockResumeData = (overrides?: Partial<ResumeData>): ResumeData =>
  ({
    sectionOrder: ["education", "employment", "skills", "research", "projects"],
    personalInfo: {
      blockId: "p1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123-456-7890"
    },
    education: {
      entries: [
        {
          entryId: "e-b1",
          content: "Computer Science degree",
          school: "MIT",
          degree: "Bachelor",
          start: "2018-09",
          end: "2022-06"
        }
      ]
    },
    employment: {
      entries: [
        {
          entryId: "emp-b1",
          content: "Software Engineer",
          company: "Tech Corp",
          jobTitle: "Senior Engineer",
          start: "2022-07",
          end: "present"
        }
      ]
    },
    skills: {
      entries: [
        {
          entryId: "s-b1",
          group: "Programming",
          content: "JavaScript, TypeScript"
        }
      ]
    },
    ...overrides
  }) as ResumeData

describe("evaluateResume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("successful evaluation", () => {
    it("should return evaluation result with correct structure", async () => {
      const mockEvaluationResult = {
        gates: {
          ats: "pass",
          hr: "borderline",
          hiringManager: "pass"
        },
        gaps: [
          {
            dimension: "experience",
            severity: "important",
            description: "Add more work experience",
            evidence: "Only 1 employment block found"
          }
        ],
        actions: [
          {
            priority: "1",
            targetSection: "work_experience",
            instruction: "Add more details about your previous role"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      const result = await evaluateResume(mockResume)

      expect(result.gaps).toHaveLength(1)
      expect(result.actions).toHaveLength(1)
    })

    it("should return exactly 3 actions as required by schema", async () => {
      const mockEvaluationResult = {
        gates: {
          ats: "pass",
          hr: "pass",
          hiringManager: "pass"
        },
        gaps: [
          {
            dimension: "keywords",
            severity: "critical",
            description: "Missing required skills"
          },
          {
            dimension: "metrics",
            severity: "important",
            description: "No quantifiable achievements"
          }
        ],
        actions: [
          {
            priority: "1",
            targetSection: "skills",
            instruction: "Add React and TypeScript to skills section"
          },
          {
            priority: "2",
            targetSection: "work_experience",
            instruction: "Add metrics to your achievements"
          },
          {
            priority: "3",
            targetSection: "projects",
            instruction: "Add more project descriptions"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        education: {
          entries: [
            {
              entryId: "e-b1",
              content: "Degree",
              school: "University",
              degree: "Master",
              start: "2019-09",
              end: "2021-06"
            }
          ]
        },
        skills: {
          entries: [
            { entryId: "s-b1", group: "General", content: "Problem solving" }
          ]
        }
      })

      const result = await evaluateResume(mockResume)

      expect(result.actions).toHaveLength(3)
      expect(result.actions[0]).toHaveProperty("priority")
      expect(result.actions[0]).toHaveProperty("targetSection")
      expect(result.actions[0]).toHaveProperty("instruction")
    })
  })

  describe("with job description", () => {
    it("should use provided job description", async () => {
      const mockEvaluationResult = {
        gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
        gaps: [],
        actions: [
          {
            priority: "1",
            targetSection: "skills",
            instruction: "Add Python skill"
          },
          {
            priority: "2",
            targetSection: "work_experience",
            instruction: "Add AWS experience"
          },
          {
            priority: "3",
            targetSection: "education",
            instruction: "Highlight relevant coursework"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      const jobDescription =
        "Looking for a Python developer with AWS experience"

      await evaluateResume(mockResume, jobDescription)

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(jobDescription)
        })
      )
    })
  })

  describe("default job description", () => {
    it("should use default JD when not provided", async () => {
      const mockEvaluationResult = {
        gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
        gaps: [],
        actions: [
          {
            priority: "1",
            targetSection: "skills",
            instruction: "Add skills"
          },
          {
            priority: "2",
            targetSection: "work_experience",
            instruction: "Add experience"
          },
          {
            priority: "3",
            targetSection: "education",
            instruction: "Add education"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      await evaluateResume(mockResume)

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(
            "General position requiring relevant experience and skills"
          )
        })
      )
    })
  })

  describe("generateText parameters", () => {
    it("should call generateText with correct model and settings", async () => {
      const mockEvaluationResult = {
        gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
        gaps: [],
        actions: [
          {
            priority: "1",
            targetSection: "skills",
            instruction: "Add skill"
          },
          {
            priority: "2",
            targetSection: "work_experience",
            instruction: "Add experience"
          },
          {
            priority: "3",
            targetSection: "projects",
            instruction: "Add project"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "123"
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      await evaluateResume(mockResume)

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          maxRetries: 3,
          model: expect.any(Function)
        })
      )
    })
  })

  describe("gates validation", () => {
    it("should handle all gate combinations", async () => {
      const mockEvaluationResult = {
        gates: {
          ats: "borderline",
          hr: "fail",
          hiringManager: "pass"
        },
        gaps: [
          {
            dimension: "structure",
            severity: "critical",
            description: "Important info not in top half"
          }
        ],
        actions: [
          {
            priority: "1",
            targetSection: "work_experience",
            instruction: "Move key achievements to top"
          },
          {
            priority: "2",
            targetSection: "work_experience",
            instruction: "Add more details"
          },
          {
            priority: "3",
            targetSection: "skills",
            instruction: "Organize skills by relevance"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      const result = await evaluateResume(mockResume)

      expect(result.gates.ats).toBe("borderline")
      expect(result.gates.hr).toBe("fail")
      expect(result.gates.hiringManager).toBe("pass")
    })
  })

  describe("gaps validation", () => {
    it("should validate gap dimensions", async () => {
      const mockEvaluationResult = {
        gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
        gaps: [
          {
            dimension: "experience",
            severity: "critical",
            description: "Insufficient experience"
          },
          {
            dimension: "skills",
            severity: "important",
            description: "Missing required skills"
          },
          {
            dimension: "structure",
            severity: "minor",
            description: "Section order could be improved"
          },
          {
            dimension: "metrics",
            severity: "important",
            description: "No measurable outcomes"
          },
          {
            dimension: "keywords",
            severity: "important",
            description: "Missing ATS keywords"
          }
        ],
        actions: [
          {
            priority: "1",
            targetSection: "work_experience",
            instruction: "Add experience"
          },
          {
            priority: "2",
            targetSection: "skills",
            instruction: "Add skills"
          },
          {
            priority: "3",
            targetSection: "work_experience",
            instruction: "Add metrics"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      const result = await evaluateResume(mockResume)

      const dimensions = result.gaps.map((g) => g.dimension)
      expect(dimensions).toContain("experience")
      expect(dimensions).toContain("skills")
      expect(dimensions).toContain("structure")
      expect(dimensions).toContain("metrics")
      expect(dimensions).toContain("keywords")
    })

    it("should validate gap severity levels", async () => {
      const mockEvaluationResult = {
        gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
        gaps: [
          {
            dimension: "experience",
            severity: "critical",
            description: "Critical issue"
          },
          {
            dimension: "skills",
            severity: "important",
            description: "Important issue"
          },
          {
            dimension: "structure",
            severity: "minor",
            description: "Minor issue"
          }
        ],
        actions: [
          {
            priority: "1",
            targetSection: "work_experience",
            instruction: "Fix critical"
          },
          {
            priority: "2",
            targetSection: "skills",
            instruction: "Fix important"
          },
          {
            priority: "3",
            targetSection: "projects",
            instruction: "Fix minor"
          }
        ]
      }

      ;(generateText as any).mockResolvedValue({
        output: mockEvaluationResult
      })

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      const result = await evaluateResume(mockResume)

      expect(result.gaps[0].severity).toBe("critical")
      expect(result.gaps[1].severity).toBe("important")
      expect(result.gaps[2].severity).toBe("minor")
    })
  })

  describe("error handling", () => {
    it("should throw error when generateText fails", async () => {
      ;(generateText as any).mockRejectedValue(
        new Error("AI service unavailable")
      )

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      await expect(evaluateResume(mockResume)).rejects.toThrow(
        "LLM evaluation failed"
      )
    })

    it("should include error message in thrown error", async () => {
      ;(generateText as any).mockRejectedValue(new Error("Connection timeout"))

      const mockResume = createMockResumeData({
        personalInfo: {
          blockId: "p1",
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          phone: ""
        },
        education: {
          entries: []
        },
        skills: {
          entries: []
        }
      })

      try {
        await evaluateResume(mockResume)
        expect(false).toBe(true)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain("Connection timeout")
      }
    })
  })
})
