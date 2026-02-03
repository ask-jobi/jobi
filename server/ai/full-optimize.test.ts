/**
 * @vitest-environment node
 */
import { generateAISuggestionQueue } from "./full-optimize"
import type { ResumeData, ResumeJobDescription } from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("@ai-sdk/google")

vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: {
    object: vi.fn()
  }
}))

const mockGoogle = vi.mocked(google)

describe("generateAISuggestionQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockResume: ResumeData = {
    personalInfo: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123-456-7890"
    },
    education: {
      title: "Education",
      order: 0,
      blocks: [
        {
          content: "Computer Science degree",
          school: "MIT",
          degree: "Bachelor",
          start: "2018-09",
          end: "2022-06"
        }
      ]
    },
    skills: {
      title: "Skills",
      order: 2,
      blocks: [{ group: "Programming", content: "JavaScript, TypeScript" }]
    }
  }

  const mockJobDescription: ResumeJobDescription = {
    id: "job-1",
    name: "Software Engineer",
    company: "Tech Corp",
    description: "We are looking for a skilled software engineer"
  }

  const mockEvaluation: ResumeEvaluationOutput = {
    gates: {
      ats: "pass",
      hr: "borderline",
      hiringManager: "pass"
    },
    gaps: [
      {
        dimension: "experience",
        severity: "important",
        description: "Add more work experience"
      }
    ],
    actions: [
      {
        priority: "2",
        targetSection: "work_experience",
        instruction: "Add more details about your previous role"
      }
    ]
  }

  describe("successful AI suggestion generation", () => {
    it("should return suggestions queue with valid structure", async () => {
      const mockSuggestions = [
        {
          section: "education" as const,
          blockIndex: 0,
          suggestionType: "improve_content",
          reason: "Add more details",
          optimizedContent: "Updated content",
          highlight: ["details"]
        }
      ]

      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockResolvedValue({
        output: {
          suggestions: mockSuggestions
        }
      })

      const result = await generateAISuggestionQueue(
        mockResume,
        mockJobDescription,
        mockEvaluation,
        "en"
      )

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty("section")
      expect(result[0]).toHaveProperty("blockIndex")
      expect(result[0]).toHaveProperty("suggestionType")
      expect(result[0]).toHaveProperty("reason")
      expect(result[0]).toHaveProperty("originalContent")
      expect(result[0]).toHaveProperty("optimizedContent")
      expect(result[0]).toHaveProperty("highlight")
    })

    it("should map section correctly in suggestions", async () => {
      const mockSuggestions = [
        {
          section: "skills" as const,
          blockIndex: 0,
          suggestionType: "add_skills",
          reason: "Add relevant skills",
          optimizedContent: "React, Node.js, PostgreSQL",
          highlight: ["React", "Node.js"]
        }
      ]

      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockResolvedValue({
        output: {
          suggestions: mockSuggestions
        }
      })

      const result = await generateAISuggestionQueue(
        mockResume,
        mockJobDescription,
        mockEvaluation,
        "en"
      )

      expect(result).toHaveLength(1)
      expect(result[0].section).toBe("skills")
    })

    it("should handle null optimizedContent", async () => {
      const mockSuggestions = [
        {
          section: "education" as const,
          blockIndex: 0,
          suggestionType: "rewrite",
          reason: "Improve clarity",
          optimizedContent: null,
          highlight: ["clarity"]
        }
      ]

      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockResolvedValue({
        output: {
          suggestions: mockSuggestions
        }
      })

      const result = await generateAISuggestionQueue(
        mockResume,
        mockJobDescription,
        mockEvaluation,
        "en"
      )

      expect(result[0].optimizedContent).toBeNull()
    })
  })

  describe("error handling", () => {
    it("should throw error when AI output format is invalid", async () => {
      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockResolvedValue({
        output: {
          invalid: "structure"
        }
      })

      await expect(
        generateAISuggestionQueue(
          mockResume,
          mockJobDescription,
          mockEvaluation,
          "en"
        )
      ).rejects.toThrow()
    })

    it("should throw meaningful error when generateText fails", async () => {
      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockRejectedValue(
        new Error("AI service unavailable")
      )

      await expect(
        generateAISuggestionQueue(
          mockResume,
          mockJobDescription,
          mockEvaluation,
          "en"
        )
      ).rejects.toThrow("AI 输出格式异常")
    })
  })

  describe("resume data formatting", () => {
    it("should be callable with valid parameters", async () => {
      const mockSuggestions: any[] = []

      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockResolvedValue({
        output: {
          suggestions: mockSuggestions
        }
      })

      const result = await generateAISuggestionQueue(
        mockResume,
        mockJobDescription,
        mockEvaluation,
        "en"
      )

      expect(Array.isArray(result)).toBe(true)
    })

    it("should handle resume without employment section", async () => {
      const resumeWithoutEmployment: ResumeData = {
        ...mockResume,
        employment: undefined
      }

      const mockSuggestions: any[] = []

      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockResolvedValue({
        output: {
          suggestions: mockSuggestions
        }
      })

      const result = await generateAISuggestionQueue(
        resumeWithoutEmployment,
        mockJobDescription,
        mockEvaluation,
        "en"
      )

      expect(result).toHaveLength(0)
    })

    it("should handle multiple skills blocks", async () => {
      const resumeWithMultipleSkills: ResumeData = {
        ...mockResume,
        skills: {
          title: "Skills",
          order: 2,
          blocks: [
            { group: "Frontend", content: "React, Vue" },
            { group: "Backend", content: "Node.js, Python" },
            { group: "Database", content: "PostgreSQL, MongoDB" }
          ]
        }
      }

      const mockSuggestions = [
        {
          section: "skills" as const,
          blockIndex: 1,
          suggestionType: "add",
          reason: "Add more backend skills",
          optimizedContent: "Go, Rust",
          highlight: ["Go"]
        }
      ]

      mockGoogle.mockReturnValue({
        "gemini-2.0-flash-lite": {}
      } as any)
      ;(generateText as any).mockResolvedValue({
        output: {
          suggestions: mockSuggestions
        }
      })

      const result = await generateAISuggestionQueue(
        resumeWithMultipleSkills,
        mockJobDescription,
        mockEvaluation,
        "en"
      )

      expect(result[0].blockIndex).toBe(1)
    })
  })
})
