import { google } from "@ai-sdk/google"
import { generateText, Output } from "ai"
import z from "zod"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import type { ResumeData } from "@/types/resume"
import { resumeOpsFromEvalPrompt } from "@/server/ai/prompts/resume-ops-from-eval.prompt"

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
  payload: z.record(z.any()).optional()
})

const outputSchema = z.object({
  ops: z.array(resumeEditOpSchema)
})

export type ResumeEditOpFromEval = z.infer<typeof resumeEditOpSchema>

export type GenerateOpsResult = {
  ops: ResumeEditOpFromEval[]
  errors: Array<{ opIndex: number; message: string }>
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
  if (!data || typeof data !== "object" || !Array.isArray((data as any).blocks)) {
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

  const { output } = await generateText({
    model: google("gemini-2.0-flash-lite"),
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
