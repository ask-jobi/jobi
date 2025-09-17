import'server-only';
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ResumeData } from "@/types/resume";
import { RESUME_PARSE_PROMPT } from "./prompts";
import {Locale} from "@/lib/i18n/config";

const resumeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().describe("First name of the candidate").default(""),
    lastName: z.string().describe("Last name of the candidate").default(""),
    email: z.string().describe("Email address of the candidate").default(""),
    phone: z.string().describe("Phone number of the candidate").default(""),
  }),
  education: z.object({
    title: z.string().describe("Title of the education section").default("Education"),
    order: z.number().describe("Order of the education section").default(0),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the education experience, return markdown formatted"),
        school: z.string().describe("Name of the school"),
        degree: z.string().describe("Degree obtained"),
        start: z.string().describe("Start date in YYYY-MM format"),
        end: z.string().describe("End date in YYYY-MM format, if contains current/present/now, format as 'present'"),
      })
    ),
  }),
  employment: z.object({
    title: z.string().describe("Title of the employment section").default("Employments"),
    order: z.number().describe("Order of the employment section").default(1),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the work experience, return markdown formatted"),
        company: z.string().describe("Name of the company"),
        jobTitle: z.string().describe("Job title"),
        start: z.string().describe("Start date in YYYY-MM format"),
        end: z.string().describe("End date in YYYY-MM format, if contains current/present/now, format as 'present'"),
      })
    ),
  }),
  skills: z.object({
    title: z.string().describe("Title of the skills section").default("Skills"),
    order: z.number().describe("Order of the skills section").default(2),
    blocks: z.array(
      z.object({
        group: z.string().describe("Category of skills"),
        content: z.string().describe("List of skills in this category, split by comma"),
      })
    ),
  }),
  _metadata: z.object({
    language: z.string().describe("Language of the resume, only 'en' or 'zh'").default("en")
  })
});

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-lite",
  temperature: 0,
  streaming: false,
  maxRetries: 0,
  json: true,
})

const parser = StructuredOutputParser.fromZodSchema(resumeSchema)

const chain = RunnableSequence.from([
  ChatPromptTemplate.fromTemplate(RESUME_PARSE_PROMPT),
  model,
  parser,
])


export const parseResume = async (resumeText: string): Promise<[ResumeData, Locale]> => {
  const result = await chain.invoke({
    resumeText: resumeText,
    format_instructions: parser.getFormatInstructions(),
  });

  // 验证并转换结果
  const validatedData = resumeSchema.parse(result);

  // 转换为 ResumeData 类型
  const resumeData: ResumeData = {
    personalInfo: validatedData.personalInfo,
    education: validatedData.education,
    employment: validatedData.employment,
    skills: validatedData.skills,
  };

  // TODO 当存在别的metadata时，优化这里的返回值
  return [resumeData, validatedData._metadata.language as Locale];
}
