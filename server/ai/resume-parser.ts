import "server-only"
import { z } from "zod"
import { generateText, NoObjectGeneratedError, Output } from "ai"
import { ResumeData } from "@/types/resume"
import { resumeParsePrompt } from "./prompts/resume-parse.prompt"
import { Locale } from "@/lib/i18n/config"
import { model } from "@/lib/agent/model"
import { nanoid } from "nanoid"
import { parseTokenUsage, type TokenUsage } from "@/lib/agent/token-usage"
import { parseJsonFromModelText } from "./parse-json-from-model-text"

const EMPTY_RESUME_TEXT_ERROR =
  "Could not extract text from the uploaded PDF. Please upload a text-based PDF resume."

function shouldFallbackToTextParsing(error: unknown): boolean {
  return (
    NoObjectGeneratedError.isInstance(error) ||
    (error instanceof Error &&
      error.message.toLowerCase().includes("could not parse"))
  )
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
        z.object({
          entryId: z.string().default(() => nanoid()),
          content: z
            .string()
            .describe(
              "Description of the education experience, return markdown formatted"
            ),
          school: z.string().describe("Name of the school"),
          degree: z.string().describe("Degree obtained"),
          start: z
            .string()
            .describe("Start date in YYYY-MM format")
            .prefault(""),
          end: z
            .string()
            .describe(
              "End date in YYYY-MM format, if contains current/present/now, format as 'present'"
            )
            .prefault("")
        })
      )
      .default(() => [])
  }),
  skills: z.object({
    entries: z
      .array(
        z.object({
          entryId: z.string().default(() => nanoid()),
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
          z.object({
            entryId: z.string().default(() => nanoid()),
            content: z
              .string()
              .describe(
                "Description of the work experience, return markdown formatted"
              ),
            company: z.string().describe("Name of the company"),
            jobTitle: z.string().describe("Job title"),
            start: z
              .string()
              .describe("Start date in YYYY-MM format")
              .prefault(""),
            end: z
              .string()
              .describe(
                "End date in YYYY-MM format, if contains current/present/now this kind of ongoing word, format as 'present'"
              )
              .prefault("")
          })
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  research: z
    .object({
      entries: z
        .array(
          z.object({
            entryId: z.string().default(() => nanoid()),
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
            date: z.object({
              start: z
                .string()
                .describe("Start date in YYYY-MM format")
                .prefault(""),
              end: z
                .string()
                .describe(
                  "End date in YYYY-MM format, if contains current/present/now this kind of ongoing word, format as 'present'"
                )
                .prefault(""),
              isCurrent: z
                .boolean()
                .describe("Whether the research experience is ongoing")
                .prefault(false)
            })
          })
        )
        .default(() => [])
    })
    .optional()
    .transform((s) => (s && s.entries.length > 0 ? s : undefined)),
  projects: z
    .object({
      entries: z
        .array(
          z.object({
            entryId: z.string().default(() => nanoid()),
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
            date: z
              .object({
                start: z
                  .string()
                  .describe("Start date in YYYY-MM format")
                  .prefault(""),
                end: z
                  .string()
                  .describe(
                    "End date in YYYY-MM format, if contains current/present/now this kind of ongoing word, format as 'present'"
                  )
                  .prefault(""),
                isCurrent: z
                  .boolean()
                  .describe("Whether the project experience is ongoing")
                  .prefault(false)
              })
              .optional()
          })
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
            entryId: z.string().default(() => nanoid()),
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
            entryId: z.string().default(() => nanoid()),
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
            entryId: z.string().default(() => nanoid()),
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
    resumeText: normalizedResumeText,
    jsonSchema: JSON.stringify(resumeSchema.shape, null, 2)
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
    if (!shouldFallbackToTextParsing(error)) {
      throw error
    }

    console.warn(
      "Structured resume parsing failed, falling back to text parsing:",
      error
    )

    const fallback = await generateText({
      model: model,
      output: Output.text(),
      prompt,
      temperature: 0,
      maxRetries: 2
    })

    if (!fallback.output?.trim()) {
      throw new Error(
        "Resume parsing failed: the model returned an empty response. Please try again."
      )
    }

    validatedData = resumeSchema.parse(parseJsonFromModelText(fallback.output))
    totalUsage = parseTokenUsage(fallback.totalUsage)
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
    education: validatedData.education,
    skills: validatedData.skills,
    // optional
    employment: validatedData.employment,
    research: validatedData.research,
    projects: validatedData.projects,
    publications: validatedData.publications,
    awards: validatedData.awards,
    certifications: validatedData.certifications
  }

  // TODO 当存在别的metadata时，优化这里的返回值
  return {
    resumeData,
    language: validatedData._metadata.language as Locale,
    tokenUsage: totalUsage
  }
}
