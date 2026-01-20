import {
  AISuggestionQueue,
  ResumeData,
  ResumeJobDescription
} from "@/types/resume"
import { google } from "@ai-sdk/google"
import { generateText, Output } from "ai"
import { resumeFullOptimizePrompt } from "./prompts/resume-full-optimize.prompt"
import z from "zod"
import { ResumeEvaluationOutput } from "@/types/evaluation"

const fullOptimizeSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      section: z.enum(["education", "employment", "skills"]),
      blockIndex: z.number(),
      suggestionType: z.string(),
      reason: z.string(),
      optimizedContent: z.string().nullable(),
      highlight: z.array(z.string())
    })
  )
})

export async function generateAISuggestionQueue(
  resume: ResumeData,
  jobDescription: ResumeJobDescription,
  evaluationReport: ResumeEvaluationOutput,
  language: string
): Promise<AISuggestionQueue> {
  // 构建完整的简历内容字符串
  const resumeFormatted = {
    education: resume.education.blocks.map((block, idx) => ({
      section: "education",
      blockIndex: idx,
      title: block.school,
      content: block.content
    })),
    employment: resume.employment
      ? resume.employment.blocks.map((block, idx) => ({
          section: "employment",
          blockIndex: idx,
          title: block.company,
          content: block.content
        }))
      : [],
    skills: resume.skills.blocks.flatMap((block, idx) => ({
      section: "skills",
      blockIndex: idx,
      title: block.group,
      content: block.content
    }))
  }

  const prompt = resumeFullOptimizePrompt.format({
    resume: resumeFormatted,
    jobDescription: jobDescription,
    evaluationReport: evaluationReport,
    language
  })

  try {
    const { output: result } = await generateText({
      model: google("gemini-2.0-flash-lite"),
      output: Output.object({ schema: fullOptimizeSuggestionSchema }),
      prompt,
      temperature: 0.3,
      maxRetries: 3
    })

    return result.suggestions.map((suggestion) => ({
      section: suggestion.section,
      blockIndex: suggestion.blockIndex,
      suggestionType: suggestion.suggestionType,
      reason: suggestion.reason,
      originalContent:
        resumeFormatted[suggestion.section][suggestion.blockIndex].content,
      optimizedContent: suggestion.optimizedContent,
      highlight: suggestion.highlight
    }))
  } catch (err) {
    console.error("AI 输出解析错误:", err)
    throw new Error(
      "AI 输出格式异常：" + (err instanceof Error ? err.message : String(err))
    )
  }
}
