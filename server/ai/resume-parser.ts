import "server-only"
import { z } from "zod"
import { generateText, Output } from "ai"
import { ResumeData, ResumeSection } from "@/types/resume"
import { resumeParsePrompt } from "./prompts/resume-parse.prompt"
import { Locale } from "@/lib/i18n/config"
import { model } from "@/server/ai/model"
import { nanoid } from "nanoid"
import { parseTokenUsage, type TokenUsage } from "@/lib/agent/token-usage"
import { normalizeDateEnd } from "@/lib/resume/date-ranges"

const EMPTY_RESUME_TEXT_ERROR =
  "Could not extract text from the uploaded PDF. Please upload a text-based PDF resume."

const DateRangeSchema = z
  .object({
    start: z.string().describe("Start date in YYYY-MM format").prefault(""),
    end: z
      .string()
      .describe(
        "End date in YYYY-MM format; use current/present/now wording only when ongoing"
      )
      .prefault("")
  })
  .transform((date) => ({
    start: date.start,
    end: normalizeDateEnd(date.end)
  }))

const ParsedDateRangeEntryFields = {
  start: z.string().optional(),
  end: z.string().optional()
}

const resumeSchema = z.object({
  // required
  personalInfo: z.object({
    entryId: z.string().default(() => nanoid()),
    firstName: z.string().describe("First name of the candidate").prefault(""),
    lastName: z.string().describe("Last name of the candidate").prefault(""),
    email: z.string().describe("Email address of the candidate").prefault(""),
    phone: z.string().describe("Phone number of the candidate").prefault("")
  }),
  education: z.object({
    entries: z
      .array(
        z
          .object({
            content: z
              .string()
              .describe(
                "Description of the education experience, return markdown formatted"
              ),
            school: z.string().describe("Name of the school"),
            degree: z.string().describe("Degree obtained"),
            ...ParsedDateRangeEntryFields
          })
          .transform((entry) => ({
            ...entry,
            end: normalizeDateEnd(entry.end)
          }))
      )
      .default(() => [])
  }),
  skills: z.object({
    entries: z
      .array(
        z.object({
          group: z.string().describe("Category of skills"),
          content: z
            .string()
            .describe("List of skills in this category, split by comma")
        })
      )
      .default(() => [])
  }),
  // optional
  employment: z
    .object({
      entries: z
        .array(
          z
            .object({
              content: z
                .string()
                .describe(
                  "Description of the work experience, return markdown formatted"
                ),
              company: z.string().describe("Name of the company"),
              jobTitle: z.string().describe("Job title"),
              ...ParsedDateRangeEntryFields
            })
            .transform((entry) => ({
              ...entry,
              end: normalizeDateEnd(entry.end)
            }))
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  research: z
    .object({
      entries: z
        .array(
          z
            .object({
              title: z.string().describe("Title of this research experience"),
              content: z
                .string()
                .describe(
                  "Description of this research experience, return markdown formatted"
                ),
              role: z
                .string()
                .describe("Role of the research experience")
                .optional(),
              date: DateRangeSchema
            })
            .transform(({ date, ...entry }) => ({
              ...entry,
              start: date.start,
              end: date.end
            }))
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  projects: z
    .object({
      entries: z
        .array(
          z
            .object({
              title: z.string().describe("Title of this project experience"),
              content: z
                .string()
                .describe(
                  "Description of this project experience, return markdown formatted"
                ),
              role: z
                .string()
                .describe("Role of this project experience")
                .optional(),
              date: DateRangeSchema.optional()
            })
            .transform(({ date, ...entry }) => ({
              ...entry,
              ...(date ? { start: date.start, end: date.end } : {})
            }))
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  publications: z
    .object({
      entries: z
        .array(
          z.object({
            title: z.string().describe("Title of this publication"),
            date: z
              .string()
              .describe("Date of this publication, in YYYY-MM format"),
            description: z
              .string()
              .describe("Description of this publication")
              .optional()
          })
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  awards: z
    .object({
      entries: z
        .array(
          z.object({
            title: z.string().describe("Title of this award"),
            issuer: z.string().describe("Issuer of this award").optional(),
            date: z.string().describe("Date of this award").optional(),
            description: z
              .string()
              .describe("Description of this award")
              .optional()
          })
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  certifications: z
    .object({
      entries: z
        .array(
          z.object({
            name: z.string().describe("Name of this certification"),
            issuer: z
              .string()
              .describe("Issuer of this certification")
              .optional(),
            date: z.string().describe("Date of this certification").optional()
          })
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  _metadata: z.object({
    language: z
      .string()
      .describe("Language of the resume, only 'en' or 'zh'")
      .prefault("en")
  })
})

export const parseResume = async (
  resumeText: string
): Promise<[ResumeData, Locale]> => {
  const { resumeData, language } = await parseResumeWithTokenUsage(resumeText)

  return [resumeData, language]
}

export const parseResumeWithTokenUsage = async (
  resumeText: string
): Promise<{
  resumeData: ResumeData
  language: Locale
  tokenUsage: TokenUsage
}> => {
  const normalizedResumeText = resumeText.trim()
  if (!normalizedResumeText) {
    throw new Error(EMPTY_RESUME_TEXT_ERROR)
  }

  const prompt = resumeParsePrompt.format({
    resumeText: normalizedResumeText
  })

  let validatedData: z.infer<typeof resumeSchema>
  let totalUsage: TokenUsage

  try {
    const structured = await generateText({
      model: model,
      output: Output.object({
        schema: resumeSchema
      }),
      prompt,
      temperature: 0,
      maxRetries: 3
    })
    validatedData = resumeSchema.parse(structured.output)
    totalUsage = parseTokenUsage(structured.totalUsage)
  } catch (error) {
    console.warn(
      "Structured resume parsing failed",
      error instanceof Error ? error.message : String(error)
    )

    throw error
  }

  // 转换为 ResumeData 类型
  const resumeData: ResumeData = {
    sectionOrder: [
      "education",
      "employment",
      "research",
      "projects",
      "publications",
      "awards",
      "certifications",
      "skills"
    ],
    // required
    personalInfo: validatedData.personalInfo,
    education: applyEntryId(validatedData.education),
    skills: applyEntryId(validatedData.skills),
    // optional
    employment: applyEntryId(validatedData.employment),
    research: applyEntryId(validatedData.research),
    projects: applyEntryId(validatedData.projects),
    publications: applyEntryId(validatedData.publications),
    awards: applyEntryId(validatedData.awards),
    certifications: applyEntryId(validatedData.certifications)
  }

  // TODO 当存在别的metadata时，优化这里的返回值
  return {
    resumeData,
    language: validatedData._metadata.language as Locale,
    tokenUsage: totalUsage
  }
}

const applyEntryId = (section: ResumeSection<any> | undefined) => {
  if (!section) return undefined
  section.entries = section.entries.map((e: any) => ({
    ...e,
    entryId: nanoid()
  }))
  return section
}
