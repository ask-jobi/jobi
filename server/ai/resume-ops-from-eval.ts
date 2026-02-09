import "server-only"
import { generateText, Output } from "ai"
import { z } from "zod"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import type { ResumeData } from "@/types/resume"
import { resumeOpsFromEvalPrompt } from "@/server/ai/prompts/resume-ops-from-eval.prompt"

export type ResumeEditOpFromEval = {
  op: "addBlock" | "updateBlock" | "removeBlock"
  section:
    | "education"
    | "employment"
    | "skills"
    | "research"
    | "projects"
    | "publications"
    | "awards"
    | "certifications"
  blockIndex?: number
  payload?: Record<string, any>
}

export type GenerateOpsResult = {
  ops: ResumeEditOpFromEval[]
  errors: Array<{ opIndex: number; message: string }>
}

const createOutputSchema = () => {
  // Define payload schema with all possible block fields (all optional)
  // This covers: EducationBlock, EmploymentBlock, SkillBlock, ProjectBlock,
  // ResearchBlock, PublicationBlock, AwardBlock, CertificationBlock
  const payloadSchema = z.object({
    // Common field
    content: z.string().optional(),
    // Education fields
    school: z.string().optional(),
    degree: z.string().optional(),
    // Employment fields
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    // Date fields (used by multiple block types)
    start: z.string().optional(),
    end: z.string().optional(),
    date: z.string().optional(),
    isCurrent: z.boolean().optional(),
    // Skills field
    group: z.string().optional(),
    // Project/Research fields
    title: z.string().optional(),
    role: z.string().optional(),
    // Award/Certification fields
    issuer: z.string().optional(),
    description: z.string().optional(),
    name: z.string().optional()
  })

  const resumeEditOpSchema = z.object({
    op: z.enum(["addBlock", "updateBlock", "removeBlock"]),
    section: z.enum([
      "education",
      "employment",
      "skills",
      "research",
      "projects",
      "publications",
      "awards",
      "certifications"
    ]),
    blockIndex: z.number().int().optional(),
    payload: payloadSchema.optional()
  })

  return z.object({
    ops: z.array(resumeEditOpSchema)
  })
}
const mapTargetSection = (
  target: ResumeEvaluationOutput["actions"][number]["targetSection"]
) => {
  switch (target) {
    case "work_experience":
      return "employment"
    default:
      return target
  }
}

const buildSectionSummary = (resume: ResumeData, section: keyof ResumeData) => {
  const data = resume[section]
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as any).blocks)
  ) {
    return []
  }

  return (data as any).blocks.map((block: any, index: number) => ({
    index,
    title: block.title || block.company || block.school || block.group || "",
    content: block.content || ""
  }))
}

export async function generateResumeEditOpsFromEvaluation(
  evaluation: ResumeEvaluationOutput,
  resume: ResumeData,
  language: Locale = "en"
): Promise<GenerateOpsResult> {
  const actions = evaluation.actions.map((action, index) => ({
    index,
    instruction: action.instruction,
    targetSection: mapTargetSection(action.targetSection)
  }))

  const sectionsSummary = actions.reduce<Record<string, any[]>>(
    (acc, action) => {
      const section = action.targetSection as keyof ResumeData
      acc[section] = buildSectionSummary(resume, section)
      return acc
    },
    {}
  )

  const prompt = resumeOpsFromEvalPrompt.format({
    actions,
    sections: sectionsSummary,
    language
  })

  const outputSchema = createOutputSchema()

  const { output } = await generateText({
    model: "google/gemini-3-flash",
    output: Output.object({ schema: outputSchema }),
    prompt,
    temperature: 0.2,
    maxRetries: 2
  })

  const errors: GenerateOpsResult["errors"] = []

  const ops = output.ops.filter((op, opIndex) => {
    if (op.op !== "addBlock" && typeof op.blockIndex !== "number") {
      errors.push({ opIndex, message: "missing blockIndex" })
      return false
    }

    if (op.op !== "addBlock") {
      const section = resume[op.section as keyof ResumeData] as any
      const length = Array.isArray(section?.blocks) ? section.blocks.length : 0
      if (op.blockIndex!! < 0 || op.blockIndex!! >= length) {
        errors.push({ opIndex, message: "blockIndex out of range" })
        return false
      }
    }

    if ((op.op === "addBlock" || op.op === "updateBlock") && !op.payload) {
      errors.push({ opIndex, message: "missing payload" })
      return false
    }

    return true
  })

  return { ops, errors }
}
