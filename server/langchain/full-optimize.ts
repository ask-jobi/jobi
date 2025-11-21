import {AISuggestionQueue, ResumeData, ResumeJobDescription} from "@/types/resume";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { FULL_RESUME_OPTIMIZE_PROMPT } from "./prompts";
import z from "zod";
import {ResumeEvaluationOutput} from "@/lib/evaluation";

const fullOptimizeSuggestionSchema = z.object({
  suggestions: z.array(z.object({
    section: z.enum(["education", "employment", "skills"]),
    blockIndex: z.number(),
    suggestionType: z.string(),
    reason: z.string(),
    optimizedContent: z.string().nullable(),
    highlight: z.array(z.string())
  }))
});

const promptTemplate = new PromptTemplate({
  template: FULL_RESUME_OPTIMIZE_PROMPT,
  inputVariables: ["resume", "job_description", "evaluation_report", "language"],
});

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
    employment: resume.employment ? resume.employment.blocks.map((block, idx) => ({
      section: "employment",
      blockIndex: idx,
      title: block.company,
      content: block.content
    })) : [],
    skills: resume.skills.blocks.flatMap((block, idx) => ({
      section: "skills",
      blockIndex: idx,
      title: block.group,
      content: block.content
    }))
  };

  const prompt = await promptTemplate.format({
    resume: resumeFormatted,
    job_description: jobDescription,
    evaluation_report: evaluationReport,
    language
  });
  console.log(prompt)
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.3,
    json: true,
    maxRetries: 3
  });
  model.withStructuredOutput(fullOptimizeSuggestionSchema);
  const response = await model.invoke(prompt);
  try {
    const result  = fullOptimizeSuggestionSchema.parse(JSON.parse(response.content.toString()));
    return result.suggestions.map(suggestion => ({
      section: suggestion.section,
      blockIndex: suggestion.blockIndex,
      suggestionType: suggestion.suggestionType,
      reason: suggestion.reason,
      originalContent: resumeFormatted[suggestion.section][suggestion.blockIndex].content,
      optimizedContent: suggestion.optimizedContent,
      highlight: suggestion.highlight
    }));
  } catch (err) {
    console.error("AI 输出解析错误:", err);
    throw new Error("AI 输出格式异常：" + response.content);
  }
}

