import "server-only"
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import {ResumeData} from '@/types/resume';
import type { ResumeEvaluationOutput } from "@/types/evaluation";
import {resumeFormat} from "@/lib/utils";
import { resumeEvaluationPrompt } from "@/server/ai/prompts/resume-evaluation.prompt";

// New unified evaluation schema for structured output
const evaluationSchema = z.object({
  summary: z.string().describe("Overall summary of the candidate and resume quality"),
  matchScore: z.number().min(0).max(100).describe("Match score between resume and JD (0-100)"),
  criteria: z.array(z.object({
    name: z.string().describe("Criterion name, e.g., Technical Skills, Communication"),
    score: z.number().min(0).max(100).describe("Criterion score (0-100)"),
    comment: z.string().optional().describe("Comments on this criterion"),
  })).describe("List of evaluation criteria"),
  strengths: z.array(z.string()).optional().describe("Key strengths"),
  weaknesses: z.array(z.string()).optional().describe("Areas for improvement"),
  recommendation: z.object({
    decision: z.enum(["strong_hire","hire","neutral","no_hire"]).describe("Final hiring recommendation"),
    confidence: z.number().min(0).max(1).optional().describe("Confidence level (0-1)"),
    rationale: z.string().optional().describe("Rationale for the decision"),
  }),
  improvementSuggestions: z.array(z.object({
    area: z.string().describe("Area to improve"),
    suggestion: z.string().describe("Specific suggestion"),
    priority: z.enum(["low","medium","high"]).optional().describe("Priority level"),
  })).optional(),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
  }).optional(),
  risks: z.array(z.string()).optional(),
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

    const formatInstructions = evaluationSchema.shape;
    const prompt = resumeEvaluationPrompt.format({
      resumeContent,
      jobDescription: defaultJD,
      formatInstructions,
    });

    const { object: result } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: evaluationSchema,
      prompt,
      temperature: 0.3,
      maxRetries: 0,
    });

    return result as EvaluationSchemaType;
  } catch (error) {
    throw new Error(`LLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
