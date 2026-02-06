/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { rewriteBlock } from "./resume-rewriter"
import { generateText } from "ai"
import { model } from "@/lib/agent/model"

vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: {
    text: vi.fn().mockReturnValue({})
  }
}))

vi.mock("@/lib/agent/model", () => ({
  model: {
    "MiniMax-M2.1": {}
  }
}))

describe("rewriteBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("successful rewrite", () => {
    it("should return rewritten content when AI generates valid output", async () => {
      const mockRewrittenContent =
        "- Improved user experience by redesigning key workflows\n- Reduced load time by 40% through performance optimization"

      ;(generateText as any).mockResolvedValue({
        output: mockRewrittenContent
      })

      const result = await rewriteBlock({
        resumeSection:
          "Worked on frontend development using React and TypeScript",
        originalContent: "Improved website performance",
        jd: "Looking for a frontend developer with React experience",
        instruction: "Make the achievement more impactful",
        language: "en"
      })

      expect(result).toBe(mockRewrittenContent)
      expect(generateText).toHaveBeenCalledTimes(1)
    })

    it("should pass correct parameters to generateText", async () => {
      ;(generateText as any).mockResolvedValue({
        output: "Rewritten content"
      })

      await rewriteBlock({
        resumeSection: "Education section content",
        originalContent: "Bachelor's degree in Computer Science",
        jd: "Software Engineer position",
        instruction: "Emphasize technical skills",
        language: "en"
      })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: model,
          output: expect.any(Object),
          temperature: 0.7,
          maxRetries: 3
        })
      )
    })
  })

  describe("language handling", () => {
    it("should use '英文' for English language", async () => {
      ;(generateText as any).mockResolvedValue({
        output: "English content"
      })

      await rewriteBlock({
        resumeSection: "Section content",
        originalContent: "Original content",
        jd: "Job description",
        instruction: "Rewrite this",
        language: "en"
      })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("英文")
        })
      )
    })

    it("should use '中文' for Chinese language", async () => {
      ;(generateText as any).mockResolvedValue({
        output: "中文内容"
      })

      await rewriteBlock({
        resumeSection: "Section content",
        originalContent: "Original content",
        jd: "Job description",
        instruction: "Rewrite this",
        language: "zh"
      })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("中文")
        })
      )
    })
  })

  describe("prompt formatting", () => {
    it("should include all required fields in prompt", async () => {
      ;(generateText as any).mockResolvedValue({
        output: "Result"
      })

      await rewriteBlock({
        resumeSection: "My work experience includes...",
        originalContent: "Led a team of 5 developers",
        jd: "Senior Developer needed",
        instruction: "Add metrics to show impact",
        language: "en"
      })

      const callArgs = (generateText as any).mock.calls[0][0]
      const prompt = callArgs.prompt

      expect(prompt).toContain("My work experience includes...")
      expect(prompt).toContain("Led a team of 5 developers")
      expect(prompt).toContain("Senior Developer needed")
      expect(prompt).toContain("Add metrics to show impact")
    })
  })

  describe("error handling", () => {
    it("should throw error when generateText fails", async () => {
      ;(generateText as any).mockRejectedValue(new Error("AI service error"))

      await expect(
        rewriteBlock({
          resumeSection: "Section",
          originalContent: "Content",
          jd: "JD",
          instruction: "Rewrite",
          language: "en"
        })
      ).rejects.toThrow()
    })
  })

  describe("input validation", () => {
    it("should handle empty resume section", async () => {
      ;(generateText as any).mockResolvedValue({
        output: "Rewritten"
      })

      const result = await rewriteBlock({
        resumeSection: "",
        originalContent: "Content",
        jd: "JD",
        instruction: "Rewrite",
        language: "en"
      })

      expect(result).toBe("Rewritten")
    })

    it("should handle long job descriptions", async () => {
      ;(generateText as any).mockResolvedValue({
        output: "Rewritten"
      })

      const longJd =
        "We are looking for a highly skilled software engineer with the following requirements: " +
        "5+ years of experience, proficiency in React, TypeScript, Node.js, " +
        "experience with cloud services, strong problem-solving skills..."

      const result = await rewriteBlock({
        resumeSection: "Section",
        originalContent: "Content",
        jd: longJd,
        instruction: "Match JD requirements",
        language: "en"
      })

      expect(result).toBe("Rewritten")
    })
  })
})
