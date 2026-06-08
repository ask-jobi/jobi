import {
  ResumeEditorModifyInput,
  ResumeEditorModifyOutput,
  ResumeEditorReorderInput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import { ResumeData, ResumeSectionKey } from "@/types/resume"
import { getEntrySchema } from "@/lib/agent/tools"
import { normalizeDateRange } from "@/lib/resume/date-ranges"

const DATE_RANGE_SECTION_KEYS = new Set([
  "education",
  "employment",
  "projects",
  "research"
])

const CURRENT_DATE_FIELDS = new Set(["date.isCurrent", "isCurrent"])

function isDateRangeRewrite(entity: ResumeSectionKey, field: string) {
  return (
    DATE_RANGE_SECTION_KEYS.has(entity) &&
    (field === "date" ||
      field === "date.start" ||
      field === "date.end" ||
      CURRENT_DATE_FIELDS.has(field))
  )
}

function normalizeDateRewrite({
  currentDate,
  field,
  value
}: {
  currentDate: unknown
  field: string
  value: string
}) {
  const baseDate =
    typeof currentDate === "object" && currentDate !== null
      ? normalizeDateRange(currentDate as any)
      : normalizeDateRange()

  if (field === "date" || field === "date.end") {
    return normalizeDateRange({ ...baseDate, end: value })
  }

  if (field === "date.start") {
    return normalizeDateRange({ ...baseDate, start: value })
  }

  return normalizeDateRange({
    ...baseDate,
    isCurrent: value.toLocaleLowerCase() === "true"
  })
}

function assertOrderedIdsMatch({
  currentIds,
  orderedIds,
  subject
}: {
  currentIds: string[]
  orderedIds: string[]
  subject: string
}) {
  const currentIdSet = new Set(currentIds)
  const orderedIdSet = new Set(orderedIds)
  const duplicateIds = orderedIds.filter(
    (id, index) => orderedIds.indexOf(id) !== index
  )
  const missingIds = currentIds.filter((id) => !orderedIdSet.has(id))
  const unknownIds = orderedIds.filter((id) => !currentIdSet.has(id))

  if (
    duplicateIds.length > 0 ||
    missingIds.length > 0 ||
    unknownIds.length > 0
  ) {
    throw new Error(
      `Invalid ${subject} order: missing ids [${missingIds.join(", ")}], ` +
        `unknown ids [${unknownIds.join(", ")}], duplicate ids [${[
          ...new Set(duplicateIds)
        ].join(", ")}]`
    )
  }
}

export const extractValueFromResume = (
  resume: ResumeData,
  entity: ResumeSectionKey,
  id: string,
  field: string
) => {
  if (entity === "personalInfo") {
    return (resume.personalInfo as unknown as Record<string, unknown>)?.[field]
  }

  const section = resume[entity]
  if (!section?.entries) return null

  const entry = section.entries.find((item) => item.entryId === id)
  return (entry as Record<string, unknown> | undefined)?.[field]
}

export async function executeResumeEditorModifyTool(
  input: ResumeEditorModifyInput,
  resumeData: ResumeData
): Promise<ResumeEditorModifyOutput> {
  const { operation } = input

  if (operation === "rewrite") {
    const { entity, id, field, value } = input

    if (entity === "personalInfo") {
      const personalInfo = resumeData.personalInfo

      if (!personalInfo || personalInfo.entryId !== id) {
        throw new Error(`Entry with id ${id} not found in section ${entity}`)
      }

      if (!Object.prototype.hasOwnProperty.call(personalInfo, field)) {
        throw new Error(`Field ${field} not found in entry ${id}`)
      }

      return {
        operation: "rewrite",
        entity,
        id,
        field,
        originalValue: (personalInfo as unknown as Record<string, unknown>)[
          field
        ],
        value
      }
    }

    const section = resumeData?.[entity]

    if (!section?.entries) {
      throw new Error(`Section ${entity} not found or has no entries`)
    }

    const entry = section.entries.find((item) => item.entryId === id)

    if (!entry) {
      throw new Error(`Entry with id ${id} not found in section ${entity}`)
    }

    if (isDateRangeRewrite(entity, field)) {
      const originalValue = (entry as unknown as Record<string, unknown>).date
      return {
        operation: "rewrite",
        entity,
        id,
        field: "date",
        originalValue: normalizeDateRange(originalValue as any),
        value: normalizeDateRewrite({
          currentDate: originalValue,
          field,
          value
        })
      }
    }

    if (!Object.prototype.hasOwnProperty.call(entry, field)) {
      throw new Error(`Field ${field} not found in entry ${id}`)
    }

    return {
      operation: "rewrite",
      entity,
      id,
      field,
      originalValue: (entry as unknown as Record<string, unknown>)[field],
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
      originalValue,
      originalIndex: entryIndex,
      originalSectionOrder: [...resumeData.sectionOrder]
    }
  }

  if (operation === "add") {
    const { entity } = input
    const entrySchema = getEntrySchema(entity)

    if (!entrySchema) {
      throw new Error(`Section schema parse failed: ${entity}`)
    }

    const newEntry = entrySchema.parse({})
    const sectionDidNotExistBefore =
      !resumeData[entity] || !resumeData.sectionOrder.includes(entity)

    return {
      operation: "add",
      entity,
      newEntry: newEntry as Extract<
        ResumeEditorModifyOutput,
        { operation: "add" }
      >["newEntry"],
      createdSection: sectionDidNotExistBefore,
      sectionDidNotExistBefore
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

    assertOrderedIdsMatch({
      currentIds: originalValue,
      orderedIds: orderedEntryIds,
      subject: `${entity} entries`
    })

    return {
      operation: "reorderEntries",
      entity,
      originalValue,
      orderedEntryIds
    }
  }

  if (operation === "reorderSections" && orderedSectionIds) {
    const originalValue = [...(resumeData?.sectionOrder || [])]

    assertOrderedIdsMatch({
      currentIds: originalValue,
      orderedIds: orderedSectionIds,
      subject: "sections"
    })

    return {
      operation: "reorderSections",
      entity: null,
      originalValue,
      orderedSectionIds
    }
  }

  throw new Error(`Invalid reorder operation: ${operation}`)
}
