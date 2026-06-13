import { defaultLocale, type Locale } from "@/lib/i18n/config"
import {
  addSection,
  normalizeSectionOrder,
  removeSection
} from "@/lib/templates/section-helpers"
import type {
  ResumeData,
  ResumeSection,
  ResumeSectionKey,
  SortableSectionKey
} from "@/types/resume"
import type {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"

export type AiResumeEditOutput =
  | ResumeEditorModifyOutput
  | ResumeEditorReorderOutput

type EntryBasedResumeSection = NonNullable<ResumeData[SortableSectionKey]>

type EntryWithId = { entryId: string } & Record<string, unknown>

type ResumeSectionEntry<ID extends SortableSectionKey> =
  NonNullable<ResumeData[ID]> extends ResumeSection<infer Entry> ? Entry : never

type ReversibleAddOutput = Extract<
  ResumeEditorModifyOutput,
  { operation: "add" }
> & {
  createdSection?: boolean
  sectionDidNotExistBefore?: boolean
}

type ReversibleDeleteOutput = Extract<
  ResumeEditorModifyOutput,
  { operation: "delete" }
> & {
  originalIndex?: number
  originalSectionOrder?: SortableSectionKey[]
}

export type AiResumeEditOptions = {
  resumeLanguage?: Locale
  detectSemanticConflict?: boolean
}

export class AiResumeEditError extends Error {
  constructor(
    message: string,
    public code:
      | "missing-rollback-metadata"
      | "invalid-reorder-metadata"
      | "semantic-conflict"
      | "unsupported-operation"
  ) {
    super(message)
    this.name = "AiResumeEditError"
  }
}

function hasEntries(
  section: ResumeData[ResumeSectionKey] | undefined
): section is EntryBasedResumeSection {
  return Boolean(section && "entries" in section)
}

function cloneResume(resume: ResumeData): ResumeData {
  return structuredClone(resume) as ResumeData
}

function writeExistingField(
  target: Record<string, unknown>,
  field: string,
  value: unknown
) {
  if (Object.prototype.hasOwnProperty.call(target, field)) {
    target[field] = value
  }
}

function readExistingField(
  target: Record<string, unknown>,
  field: string
): unknown {
  return Object.prototype.hasOwnProperty.call(target, field)
    ? target[field]
    : undefined
}

function assertCurrentValueMatches(
  currentValue: unknown,
  expectedValue: unknown,
  message: string
) {
  const isSameValue = deepEqual(currentValue, expectedValue)

  if (expectedValue !== undefined && !isSameValue) {
    throw new AiResumeEditError(message, "semantic-conflict")
  }
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true
  }

  if (
    !left ||
    !right ||
    typeof left !== "object" ||
    typeof right !== "object" ||
    Array.isArray(left) !== Array.isArray(right)
  ) {
    return false
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => deepEqual(item, right[index]))
    )
  }

  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const leftKeys = Object.keys(leftRecord).sort()
  const rightKeys = Object.keys(rightRecord).sort()

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && deepEqual(leftRecord[key], rightRecord[key])
    )
  )
}

function assertCurrentOrderMatches(
  currentIds: string[],
  expectedIds: string[] | undefined,
  message: string
) {
  if (!expectedIds) {
    return
  }

  const comparableCurrentIds = currentIds.filter((id) =>
    expectedIds.includes(id)
  )

  if (
    comparableCurrentIds.length !== expectedIds.length ||
    comparableCurrentIds.some((id, index) => id !== expectedIds[index])
  ) {
    throw new AiResumeEditError(message, "semantic-conflict")
  }
}

function insertSectionIntoOrder(
  currentOrder: SortableSectionKey[],
  restoredOrder: SortableSectionKey[] | undefined,
  sectionId: SortableSectionKey
): SortableSectionKey[] {
  if (!restoredOrder) {
    return normalizeSectionOrder([...currentOrder, sectionId])
  }

  const currentSectionIds = new Set(currentOrder)
  const nextOrder = restoredOrder.filter(
    (id) => id === sectionId || currentSectionIds.has(id)
  )

  for (const id of currentOrder) {
    if (!nextOrder.includes(id)) {
      nextOrder.push(id)
    }
  }

  if (!nextOrder.includes(sectionId)) {
    nextOrder.push(sectionId)
  }

  return normalizeSectionOrder(nextOrder)
}

function orderEntriesByIds<ID extends SortableSectionKey>(
  entries: Array<ResumeSectionEntry<ID>>,
  orderedIds: string[] | undefined
): Array<ResumeSectionEntry<ID>> | null {
  if (!orderedIds) {
    return null
  }

  const entriesById = new Map(
    entries.map((entry) => [(entry as EntryWithId).entryId, entry])
  )
  const orderedEntries = orderedIds
    .map((id) => entriesById.get(id))
    .filter((entry): entry is ResumeSectionEntry<ID> => Boolean(entry))
  const remainingEntries = entries.filter(
    (entry) => !orderedIds.includes((entry as EntryWithId).entryId)
  )

  return [...orderedEntries, ...remainingEntries]
}

function reconcileSectionOrder(
  currentOrder: SortableSectionKey[],
  targetOrder: SortableSectionKey[] | undefined
): SortableSectionKey[] | null {
  if (!targetOrder) {
    return null
  }

  const orderedIds = targetOrder.filter((id) => currentOrder.includes(id))
  const remainingIds = currentOrder.filter((id) => !orderedIds.includes(id))

  return normalizeSectionOrder([...orderedIds, ...remainingIds])
}

function applyModifyOutput(
  resume: ResumeData,
  output: ResumeEditorModifyOutput,
  options: AiResumeEditOptions
): ResumeData {
  if (output.operation === "rewrite") {
    if (output.entity === "personalInfo") {
      const personalInfo = resume.personalInfo as unknown as EntryWithId

      if (personalInfo.entryId === output.id) {
        writeExistingField(personalInfo, output.field, output.value)
      }

      return resume
    }

    const section = resume[output.entity]
    if (!hasEntries(section)) {
      return resume
    }

    for (const entry of section.entries) {
      const mutableEntry = entry as unknown as EntryWithId

      if (mutableEntry.entryId === output.id) {
        writeExistingField(mutableEntry, output.field, output.value)
      }
    }

    return resume
  }

  if (output.operation === "delete") {
    const section = resume[output.entity]
    if (!hasEntries(section)) {
      return resume
    }

    section.entries = section.entries.filter(
      (entry) => entry.entryId !== output.id
    ) as typeof section.entries

    return section.entries.length === 0
      ? removeSection(resume, output.entity)
      : resume
  }

  if (output.operation === "add") {
    const language = options.resumeLanguage ?? defaultLocale
    const nextResume = addSection(resume, output.entity, language)
    const section = nextResume[output.entity]

    if (!hasEntries(section)) {
      return nextResume
    }

    ;(section.entries as unknown as EntryWithId[]).push(
      output.newEntry as EntryWithId
    )

    return nextResume
  }

  throw new AiResumeEditError(
    `Unsupported modify operation: ${(output as { operation: string }).operation}`,
    "unsupported-operation"
  )
}

function applyReorderOutput(
  resume: ResumeData,
  output: ResumeEditorReorderOutput
): ResumeData {
  if (output.operation === "reorderEntries") {
    const entity = output.entity
    if (!entity) {
      return resume
    }

    const section = resume[entity]
    if (!hasEntries(section)) {
      return resume
    }

    const orderedEntries = orderEntriesByIds(
      section.entries as Array<ResumeSectionEntry<typeof entity>>,
      output.orderedEntryIds
    )

    if (orderedEntries) {
      section.entries = orderedEntries as typeof section.entries
    }

    return resume
  }

  if (output.operation === "reorderSections") {
    const nextOrder = reconcileSectionOrder(
      resume.sectionOrder,
      output.orderedSectionIds
    )

    if (nextOrder) {
      resume.sectionOrder = nextOrder
    }

    return resume
  }

  throw new AiResumeEditError(
    `Unsupported reorder operation: ${(output as { operation: string }).operation}`,
    "unsupported-operation"
  )
}

function revertModifyOutput(
  resume: ResumeData,
  output: ResumeEditorModifyOutput,
  options: AiResumeEditOptions
): ResumeData {
  if (output.operation === "rewrite") {
    if (output.entity === "personalInfo") {
      const personalInfo = resume.personalInfo as unknown as EntryWithId

      if (personalInfo.entryId === output.id) {
        if (options.detectSemanticConflict) {
          assertCurrentValueMatches(
            readExistingField(personalInfo, output.field),
            output.value,
            `Cannot safely revert personalInfo.${output.field}: current value no longer matches the AI edit output.`
          )
        }

        writeExistingField(personalInfo, output.field, output.originalValue)
      }

      return resume
    }

    const section = resume[output.entity]
    if (!hasEntries(section)) {
      return resume
    }

    const entry = section.entries.find((item) => item.entryId === output.id)
    if (entry) {
      if (options.detectSemanticConflict) {
        assertCurrentValueMatches(
          readExistingField(
            entry as unknown as Record<string, unknown>,
            output.field
          ),
          output.value,
          `Cannot safely revert ${output.entity}.${output.field}: current value no longer matches the AI edit output.`
        )
      }

      writeExistingField(
        entry as unknown as Record<string, unknown>,
        output.field,
        output.originalValue
      )
    }

    return resume
  }

  if (output.operation === "add") {
    const addOutput = output as ReversibleAddOutput
    const section = resume[addOutput.entity]
    if (!hasEntries(section)) {
      if (options.detectSemanticConflict) {
        throw new AiResumeEditError(
          `Cannot safely revert added ${addOutput.entity} entry ${addOutput.newEntry.entryId}: section is missing.`,
          "semantic-conflict"
        )
      }

      return resume
    }

    if (
      options.detectSemanticConflict &&
      !section.entries.some(
        (entry) => entry.entryId === addOutput.newEntry.entryId
      )
    ) {
      throw new AiResumeEditError(
        `Cannot safely revert added ${addOutput.entity} entry ${addOutput.newEntry.entryId}: entry is missing.`,
        "semantic-conflict"
      )
    }

    section.entries = section.entries.filter(
      (entry) => entry.entryId !== addOutput.newEntry.entryId
    ) as typeof section.entries

    const shouldRemoveEmptySection =
      addOutput.createdSection ??
      addOutput.sectionDidNotExistBefore ??
      section.entries.length === 0

    return shouldRemoveEmptySection && section.entries.length === 0
      ? removeSection(resume, addOutput.entity)
      : resume
  }

  if (output.operation === "delete") {
    const deleteOutput = output as ReversibleDeleteOutput

    if (deleteOutput.originalIndex === undefined) {
      throw new AiResumeEditError(
        `Cannot precisely restore ${deleteOutput.entity} entry ${deleteOutput.id}: originalIndex is missing.`,
        "missing-rollback-metadata"
      )
    }

    const language = options.resumeLanguage ?? defaultLocale
    const nextResume = addSection(resume, deleteOutput.entity, language)
    const section = nextResume[deleteOutput.entity]

    if (!hasEntries(section)) {
      return nextResume
    }

    if (
      !nextResume.sectionOrder.includes(deleteOutput.entity) ||
      deleteOutput.originalSectionOrder
    ) {
      nextResume.sectionOrder = insertSectionIntoOrder(
        nextResume.sectionOrder,
        deleteOutput.originalSectionOrder,
        deleteOutput.entity
      )
    }

    const mutableEntries = section.entries as unknown as EntryWithId[]
    const existingIndex = mutableEntries.findIndex(
      (entry) => entry.entryId === deleteOutput.id
    )

    if (options.detectSemanticConflict && existingIndex !== -1) {
      throw new AiResumeEditError(
        `Cannot safely revert deleted ${deleteOutput.entity} entry ${deleteOutput.id}: entry already exists.`,
        "semantic-conflict"
      )
    }

    if (existingIndex !== -1) {
      mutableEntries.splice(existingIndex, 1)
    }

    const insertIndex =
      typeof deleteOutput.originalIndex === "number"
        ? Math.min(
            Math.max(deleteOutput.originalIndex, 0),
            mutableEntries.length
          )
        : mutableEntries.length

    mutableEntries.splice(
      insertIndex,
      0,
      deleteOutput.originalValue as EntryWithId
    )

    return nextResume
  }

  throw new AiResumeEditError(
    `Unsupported modify operation: ${(output as { operation: string }).operation}`,
    "unsupported-operation"
  )
}

function revertReorderOutput(
  resume: ResumeData,
  output: ResumeEditorReorderOutput,
  options: AiResumeEditOptions
): ResumeData {
  if (output.operation === "reorderEntries") {
    const entity = output.entity
    if (!entity) {
      return resume
    }

    const section = resume[entity]
    if (!hasEntries(section)) {
      return resume
    }

    const originalIds = output.originalValue as string[] | undefined
    if (!originalIds) {
      throw new AiResumeEditError(
        `Cannot restore ${entity} entry order: originalValue is missing.`,
        "invalid-reorder-metadata"
      )
    }

    if (options.detectSemanticConflict) {
      assertCurrentOrderMatches(
        section.entries.map((entry) => entry.entryId),
        output.orderedEntryIds,
        `Cannot safely revert ${entity} entry order: current order no longer matches the AI edit output.`
      )
    }

    const orderedEntries = orderEntriesByIds(
      section.entries as Array<ResumeSectionEntry<typeof entity>>,
      originalIds
    )

    if (orderedEntries) {
      section.entries = orderedEntries as typeof section.entries
    }

    return resume
  }

  if (output.operation === "reorderSections") {
    const originalOrder = output.originalValue as
      | SortableSectionKey[]
      | undefined
    if (!originalOrder) {
      throw new AiResumeEditError(
        "Cannot restore section order: originalValue is missing.",
        "invalid-reorder-metadata"
      )
    }

    if (options.detectSemanticConflict) {
      assertCurrentOrderMatches(
        resume.sectionOrder,
        output.orderedSectionIds,
        "Cannot safely revert section order: current order no longer matches the AI edit output."
      )
    }

    const nextOrder = reconcileSectionOrder(resume.sectionOrder, originalOrder)

    if (nextOrder) {
      resume.sectionOrder = nextOrder
    }

    return resume
  }

  throw new AiResumeEditError(
    `Unsupported reorder operation: ${(output as { operation: string }).operation}`,
    "unsupported-operation"
  )
}

export function applyAiResumeEdit(
  baseResume: ResumeData,
  output: AiResumeEditOutput,
  options: AiResumeEditOptions = {}
): ResumeData {
  const resume = cloneResume(baseResume)

  return output.operation === "rewrite" ||
    output.operation === "delete" ||
    output.operation === "add"
    ? applyModifyOutput(resume, output, options)
    : applyReorderOutput(resume, output)
}

export function revertAiResumeEdit(
  currentResume: ResumeData,
  output: AiResumeEditOutput,
  options: AiResumeEditOptions = {}
): ResumeData {
  const resume = cloneResume(currentResume)

  return output.operation === "rewrite" ||
    output.operation === "delete" ||
    output.operation === "add"
    ? revertModifyOutput(resume, output, options)
    : revertReorderOutput(resume, output, options)
}

export function replayAiResumeEdits(
  baseResume: ResumeData,
  outputs: AiResumeEditOutput[],
  options: AiResumeEditOptions = {}
): ResumeData {
  return outputs.reduce(
    (resume, output) => applyAiResumeEdit(resume, output, options),
    baseResume
  )
}

export function revertAiResumeEdits(
  currentResume: ResumeData,
  outputs: AiResumeEditOutput[],
  options: AiResumeEditOptions = {}
): ResumeData {
  return outputs.reduceRight(
    (resume, output) => revertAiResumeEdit(resume, output, options),
    currentResume
  )
}
