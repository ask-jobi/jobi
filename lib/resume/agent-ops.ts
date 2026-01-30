import type { ResumeData, SectionBlock } from "@/types/resume"

export type ResumeEditOp =
  | {
      op: "addBlock"
      section: keyof ResumeData
      blockIndex?: number
      payload: Record<string, any>
    }
  | {
      op: "updateBlock"
      section: keyof ResumeData
      blockIndex: number
      payload: Record<string, any>
    }
  | {
      op: "removeBlock"
      section: keyof ResumeData
      blockIndex: number
    }

export type ResumeEditError = {
  opIndex: number
  code: "SECTION_MISSING" | "INDEX_OUT_OF_RANGE" | "INVALID_PAYLOAD"
  message: string
}

export type ApplyOpsResult = {
  updatedResumeData: ResumeData
  appliedOps: ResumeEditOp[]
  errors: ResumeEditError[]
}

const DEFAULT_SECTION_TITLES: Partial<Record<keyof ResumeData, string>> = {
  education: "Education",
  employment: "Employment",
  skills: "Skills",
  research: "Research",
  projects: "Projects",
  publications: "Publications",
  awards: "Awards",
  certifications: "Certifications"
}

const isSectionBlock = (value: any): value is SectionBlock =>
  value && typeof value === "object" && Array.isArray(value.blocks)

const ensureSection = (
  data: ResumeData,
  section: keyof ResumeData
): ResumeData => {
  const current = data[section]
  if (isSectionBlock(current)) return data

  const maxOrder = Object.values(data)
    .filter(isSectionBlock)
    .reduce((acc, block) => Math.max(acc, block.order ?? 0), 0)

  return {
    ...data,
    [section]: {
      title: DEFAULT_SECTION_TITLES[section] ?? String(section),
      order: maxOrder + 1,
      blocks: []
    }
  } as ResumeData
}

export function applyResumeEditOps(
  resumeData: ResumeData,
  ops: ResumeEditOp[]
): ApplyOpsResult {
  let updated = resumeData
  const appliedOps: ResumeEditOp[] = []
  const errors: ResumeEditError[] = []

  ops.forEach((op, opIndex) => {
    if (op.op === "addBlock") {
      updated = ensureSection(updated, op.section)
      const section = updated[op.section] as SectionBlock
      if (!op.payload || typeof op.payload !== "object") {
        errors.push({
          opIndex,
          code: "INVALID_PAYLOAD",
          message: "addBlock requires payload"
        })
        return
      }
      const blocks = [...section.blocks]
      if (typeof op.blockIndex === "number") {
        blocks.splice(op.blockIndex, 0, op.payload)
      } else {
        blocks.push(op.payload)
      }
      updated = {
        ...updated,
        [op.section]: { ...section, blocks }
      } as ResumeData
      appliedOps.push(op)
      return
    }

    const section = updated[op.section] as SectionBlock | undefined
    if (!section || !Array.isArray(section.blocks)) {
      errors.push({
        opIndex,
        code: "SECTION_MISSING",
        message: `section ${String(op.section)} missing`
      })
      return
    }

    if (op.blockIndex < 0 || op.blockIndex >= section.blocks.length) {
      errors.push({
        opIndex,
        code: "INDEX_OUT_OF_RANGE",
        message: `blockIndex ${op.blockIndex} out of range`
      })
      return
    }

    if (op.op === "updateBlock") {
      if (!op.payload || typeof op.payload !== "object") {
        errors.push({
          opIndex,
          code: "INVALID_PAYLOAD",
          message: "updateBlock requires payload"
        })
        return
      }
      const blocks = [...section.blocks]
      blocks[op.blockIndex] = { ...blocks[op.blockIndex], ...op.payload }
      updated = {
        ...updated,
        [op.section]: { ...section, blocks }
      } as ResumeData
      appliedOps.push(op)
      return
    }

    if (op.op === "removeBlock") {
      const blocks = section.blocks.filter((_, i) => i !== op.blockIndex)
      updated = {
        ...updated,
        [op.section]: { ...section, blocks }
      } as ResumeData
      appliedOps.push(op)
    }
  })

  return { updatedResumeData: updated, appliedOps, errors }
}
