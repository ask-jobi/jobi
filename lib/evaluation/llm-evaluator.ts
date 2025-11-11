"use server"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import {EducationBlock, EmploymentBlock, ResumeData, SkillBlock} from '@/types/resume';
import type { ResumeEvaluationOutput } from "@/lib/evaluation/types";

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

const parser = StructuredOutputParser.fromZodSchema(evaluationSchema)

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-lite",
  temperature: 0.3,
  streaming: false,
  maxRetries: 0,
  json: true
});

const buildPrompt = (): string => {
  return `You are an AI Resume Evaluation System.

Your task is to analyze a candidate's resume and a job description (JD),
then produce a structured JSON evaluation report that matches the given TypeScript interface.



=== OUTPUT RULES ===

- Output must be valid JSON, no explanations or extra text.
- "matchScore" must reflect the overall fit between resume and JD (0–100).
- Include at least 3–5 evaluation criteria (e.g., "Technical Skills", "Experience Fit", "Communication").
- Each comment should be concise and factual.
- Summarize key strengths and weaknesses clearly.
- recommendation.decision must always be one of: "strong_hire", "hire", "neutral", "no_hire".
- Include improvementSuggestions when possible.
- Use "keywords" to reflect which important terms from JD are found or missing in the resume.
- If unsure, make reasonable inferences from the resume content.

Resume Content:
{resumeContent}

Job Description:
{jobDescription}

=== OUTPUT FORMAT ===
{format_instructions}`;
}

export const evaluateResume = async (
  resumeData: ResumeData,
  jobDescription?: string
): Promise<EvaluationSchemaType> => {
  try {
    const prompt = buildPrompt();

    const chain = RunnableSequence.from([
      ChatPromptTemplate.fromTemplate(prompt),
      model,
      parser,
    ]);

    // Convert resume data to text format
    const resumeContent = `
Personal Information:
Name: ${resumeData.personalInfo?.firstName || ''} ${resumeData.personalInfo?.lastName || ''}
Email: ${resumeData.personalInfo?.email || ''}
Phone: ${resumeData.personalInfo?.phone || ''}
Website: ${resumeData.personalInfo?.website || 'Not provided'}
LinkedIn: ${resumeData.personalInfo?.linkedin || 'Not provided'}

Education Experience:
${resumeData.education?.blocks?.map((edu: EducationBlock, index: number) => 
`Education Block ${index + 1}:\n${edu.school} - ${edu.degree}\n${edu.content} [${edu.start} ~ ${edu.end}]`
).join('\n\n') || 'None'}

Employment Experience:
${resumeData.employment?.blocks?.map((emp: EmploymentBlock, index: number) => 
`Employment Block ${index + 1}:\n${emp.company} - ${emp.jobTitle}\n${emp.content}`
).join('\n\n') || 'None'}

Skills:
${resumeData.skills?.blocks?.map((skill: SkillBlock, index: number) => 
`Skills Block ${index + 1}:\n${skill.group}: ${skill.content}`
).join('\n\n') || 'None'}
`;

    // Default JD if not provided
    const defaultJD = jobDescription || 'General position requiring relevant experience and skills.';

    const result = await chain.invoke({
      resumeContent,
      jobDescription: defaultJD,
      format_instructions: parser.getFormatInstructions(),
    }) as EvaluationSchemaType;

    return result;
  } catch (error) {
    throw new Error(`LLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
