import "server-only"
import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { ResumeData } from '@/types/resume';
import type { ResumeEvaluationOutput } from "@/types/evaluation";
import { resumeFormat } from "@/lib/utils";
import { resumeEvaluationPrompt } from "@/server/ai/prompts/resume-evaluation.prompt";

// New unified evaluation schema for structured output
export const evaluationSchema = z.object({
  gates: z.object({
    ats: z.enum(["pass", "borderline", "fail"]),
    hr: z.enum(["pass", "borderline", "fail"]),
    hiringManager: z.enum(["pass", "borderline", "fail"]),
  }),

  gaps: z
    .array(
      z.object({
        dimension: z.enum(["experience", "skills", "structure", "metrics", "keywords"]),
        severity: z.enum(["critical", "important", "minor"]),
        description: z.string().min(1),
        evidence: z.string().min(1).optional(),
      })
    )
    .max(5, "gaps should contain at most 5 items"),

  actions: z
    .array(
      z.object({
        priority: z.enum(["1", "2", "3"]),
        targetSection: z.enum(["work_experience", "projects", "skills", "education"]),
        instruction: z.string().min(1),
      })
    )
    .length(3, "actions must contain exactly 3 items"),
});


type EvaluationSchemaType = ResumeEvaluationOutput;

export const evaluateResume = async (
  resumeData: ResumeData,
  jobDescription?: string
): Promise<EvaluationSchemaType> => {
  try {
    // Convert resume data to text format
    const resumeContent = resumeFormat(resumeData);

    // Default JD if not provided
    const defaultJD = jobDescription || 'General position requiring relevant experience and skills.';

    const prompt = resumeEvaluationPrompt.format({
      resumeContent,
      jobDescription: defaultJD,
    });

    const { output: result } = await generateText({
      model: google("gemini-2.0-flash-lite"),
      output: Output.object({
        schema: evaluationSchema
      }),
      prompt,
      temperature: 0.3,
      maxRetries: 0,
    });

    return result as EvaluationSchemaType;
  } catch (error) {
    throw new Error(`LLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
