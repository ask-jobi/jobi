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
  // required
  personalInfo: z.object({
    firstName: z.string().describe("First name of the candidate").prefault(""),
    lastName: z.string().describe("Last name of the candidate").prefault(""),
    email: z.string().describe("Email address of the candidate").prefault(""),
    phone: z.string().describe("Phone number of the candidate").prefault(""),
  }),
  education: z.object({
    title: z.string().describe("Title of the education section").prefault("Education"),
    order: z.number().describe("Order of the education section").prefault(0),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the education experience, return markdown formatted"),
        school: z.string().describe("Name of the school"),
        degree: z.string().describe("Degree obtained"),
        start: z.string().describe("Start date in YYYY-MM format").prefault(""),
        end: z.string().describe("End date in YYYY-MM format, if contains current/present/now, format as 'present'").prefault(""),
      })
    ),
  }),
  skills: z.object({
    title: z.string().describe("Title of the skills section").prefault("Skills"),
    order: z.number().describe("Order of the skills section").prefault(2),
    blocks: z.array(
      z.object({
        group: z.string().describe("Category of skills"),
        content: z.string().describe("List of skills in this category, split by comma"),
      })
    ),
  }),
  // optional
  employment: z.object({
    title: z.string().describe("Title of the work experience section").prefault("Work Experience"),
    order: z.number().describe("Order of the work experience section").prefault(1),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the work experience, return markdown formatted"),
        company: z.string().describe("Name of the company"),
        jobTitle: z.string().describe("Job title"),
        start: z.string().describe("Start date in YYYY-MM format").prefault(""),
        end: z.string().describe("End date in YYYY-MM format, if contains current/present/now this kind of ongoing word, format as 'present'").prefault(""),
      })
    ),
  }).optional().transform(s => (s && s.blocks.length > 0 ? s : undefined)),
  research: z.object({
    title: z.string().describe("Title of the research section").prefault("Research Experience"),
    order: z.number().describe("Order of the research section").prefault(3),
    blocks: z.array(
      z.object({
        title: z.string().describe("Title of this research experience"),
        content: z.string().describe("Description of this research experience, return markdown formatted"),
        role: z.string().describe("Role of the research experience").optional(),
        date: z.object({
          start: z.string().describe("Start date in YYYY-MM format").prefault(""),
          end: z.string().describe("End date in YYYY-MM format, if contains current/present/now this kind of ongoing word, format as 'present'").prefault(""),
          isCurrent: z.boolean().describe("Whether the research experience is ongoing").prefault(false),
        }),
      })
    ),
  }).optional().transform(s => (s && s.blocks.length > 0 ? s : undefined)),
  projects: z.object({
    title: z.string().describe("Title of the projects section").prefault("Projects"),
    order: z.number().describe("Order of the projects section").prefault(4),
    blocks: z.array(
      z.object({
        title: z.string().describe("Title of this project experience"),
        content: z.string().describe("Description of this project experience, return markdown formatted"),
        role: z.string().describe("Role of this project experience").optional(),
        date: z.object({
          start: z.string().describe("Start date in YYYY-MM format").prefault(""),
          end: z.string().describe("End date in YYYY-MM format, if contains current/present/now this kind of ongoing word, format as 'present'").prefault(""),
          isCurrent: z.boolean().describe("Whether the project experience is ongoing").prefault(false),
        }).optional(),
      })
    ),
  }).optional().transform(s => (s && s.blocks.length > 0 ? s : undefined)),
  publications: z.object({
    title: z.string().describe("Title of the publications section").prefault("Publications"),
    order: z.number().describe("Order of the publications section").prefault(5),
    blocks: z.array(
      z.object({
        title: z.string().describe("Title of this publication"),
        date: z.string().describe("Date of this publication, in YYYY-MM format"),
        description: z.string().describe("Description of this publication").optional(),
      })
    ),
  }).optional().transform(s => (s && s.blocks.length > 0 ? s : undefined)),
  awards: z.object({
    title: z.string().describe("Title of the awards section").prefault("Awards"),
    order: z.number().describe("Order of the awards section").prefault(6),
    blocks: z.array(
      z.object({
        title: z.string().describe("Title of this award"),
        issuer: z.string().describe("Issuer of this award").optional(),
        date: z.string().describe("Date of this award").optional(),
        description: z.string().describe("Description of this award").optional(),
      })
    ),
  }).optional().transform(s => (s && s.blocks.length > 0 ? s : undefined)),
  certifications: z.object({
    title: z.string().describe("Title of the certifications section").prefault("Certifications"),
    order: z.number().describe("Order of the certifications section").prefault(7),
    blocks: z.array(
      z.object({
        name: z.string().describe("Name of this certification"),
        issuer: z.string().describe("Issuer of this certification").optional(),
        date: z.string().describe("Date of this certification").optional(),
      })
    ),
  }).optional().transform(s => (s && s.blocks.length > 0 ? s : undefined)),
  _metadata: z.object({
    language: z.string().describe("Language of the resume, only 'en' or 'zh'").prefault("en")
  }),
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
    // required
    personalInfo: validatedData.personalInfo,
    education: validatedData.education,
    skills: validatedData.skills,
    // optional
    employment: validatedData.employment,
    research: validatedData.research ,
    projects: validatedData.projects,
    publications: validatedData.publications,
    awards: validatedData.awards,
    certifications: validatedData.certifications,
  };

  // TODO 当存在别的metadata时，优化这里的返回值
  return [resumeData, validatedData._metadata.language as Locale];
}
