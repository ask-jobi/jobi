import {
  ResumeEditorModifyInput,
  ResumeEditorModifyOutput,
  ResumeEditorReorderInput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import { ResumeData, ResumeSectionKey } from "@/types/resume"
import { getEntrySchema } from "@/lib/agent/tools"

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
  if (!section?.entries) return null

  const entry = section.entries.find((item) => item.entryId === id)
  return (entry as any)?.[field]
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

    if (!section?.entries) {
      throw new Error(`Section ${entity} not found or has no entries`)
    }

    const entryIndex = section.entries.findIndex((item) => item.entryId === id)
    if (entryIndex === -1) {
      throw new Error(`Entry with id ${id} not found in section ${entity}`)
    }

    const originalValue = { ...section.entries[entryIndex] }

    return {
      operation: "delete",
      entity,
      id,
      originalValue
    }
  }

  if (operation === "add") {
    const { entity } = input
    const entrySchema = getEntrySchema(entity)

    if (!entrySchema) {
      throw new Error(`Section schema parse failed: ${entity}`)
    }

    const newEntry = entrySchema.parse({})

    return {
      operation: "add",
      entity,
      newEntry
    }
  }

  throw new Error(`Unknown modify operation: ${operation}`)
}

export async function executeResumeEditorReorderTool(
  input: ResumeEditorReorderInput,
  resumeData: ResumeData
): Promise<ResumeEditorReorderOutput> {
  const { operation, entity, orderedEntryIds, orderedSectionIds } = input

  if (operation === "reorderEntries" && entity && orderedEntryIds) {
    const section = resumeData?.[entity]

    if (!section?.entries) {
      throw new Error(`Section ${entity} not found or has no entries`)
    }

    const originalValue = section.entries.map((entry) => entry.entryId)

    return {
      operation: "reorderEntries",
      entity,
      originalValue,
      orderedEntryIds
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
