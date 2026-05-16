import {
  ResumeEditorModifyInput,
  ResumeEditorModifyOutput,
  ResumeEditorReorderInput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import { ResumeData, ResumeSectionKey } from "@/types/resume"
import { getBlockSchema } from "@/lib/agent/tools"

export const extractValueFromResume = (
  resume: ResumeData,
  entity: ResumeSectionKey,
  id: string,
  field: string
) => {
  if (entity === "personalInfo") {
    return (resume.personalInfo as any)?.[field]
  }

  const section = resume[entity]
  if (!section?.blocks) return null

  const block = section.blocks.find((b) => b.blockId === id)
  return (block as any)?.[field]
}

export async function executeResumeEditorModifyTool(
  input: ResumeEditorModifyInput,
  resumeData: ResumeData
): Promise<ResumeEditorModifyOutput> {
  const { operation } = input

  if (operation === "rewrite") {
    const { entity, id, field, value } = input
    const originalValue = extractValueFromResume(resumeData, entity, id, field)

    return {
      operation: "rewrite",
      entity,
      id,
      field,
      originalValue,
      value
    }
  }

  if (operation === "delete") {
    const { entity, id } = input
    const section = resumeData?.[entity]

    if (!section?.blocks) {
      throw new Error(`Section ${entity} not found or has no blocks`)
    }

    const blockIndex = section.blocks.findIndex((b) => b.blockId === id)
    if (blockIndex === -1) {
      throw new Error(`Block with id ${id} not found in section ${entity}`)
    }

    const originalValue = { ...section.blocks[blockIndex] }

    return {
      operation: "delete",
      entity,
      id,
      originalValue
    }
  }

  if (operation === "add") {
    const { entity } = input
    const blockSchema = getBlockSchema(entity)

    if (!blockSchema) {
      throw new Error(`Section schema parse failed: ${entity}`)
    }

    const newBlock = blockSchema.parse({})

    return {
      operation: "add",
      entity,
      newBlock
    }
  }

  throw new Error(`Unknown modify operation: ${operation}`)
}

export async function executeResumeEditorReorderTool(
  input: ResumeEditorReorderInput,
  resumeData: ResumeData
): Promise<ResumeEditorReorderOutput> {
  const { operation, entity, orderedBlockIds, orderedSectionIds } = input

  if (operation === "reorderBlocks" && entity && orderedBlockIds) {
    const section = resumeData?.[entity]

    if (!section?.blocks) {
      throw new Error(`Section ${entity} not found or has no blocks`)
    }

    const originalValue = section.blocks.map((b) => b.blockId)

    return {
      operation: "reorderBlocks",
      entity,
      originalValue,
      orderedBlockIds
    }
  }

  if (operation === "reorderSections" && orderedSectionIds) {
    const originalValue = [...(resumeData?.sectionOrder || [])]

    return {
      operation: "reorderSections",
      entity: null,
      originalValue,
      orderedSectionIds
    }
  }

  throw new Error(`Invalid reorder operation: ${operation}`)
}
