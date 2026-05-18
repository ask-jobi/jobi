import type { Locale } from "@/lib/i18n/config"
import type { SortableSectionKey, ResumeData } from "@/types/resume"
import {
  DEFAULT_SECTION_ORDER,
  isStarterSection
} from "@/lib/templates/section-definitions"
import {
  createEmptySection,
  createEmptySectionEntry
} from "@/lib/templates/section-factories"

export function normalizeSectionOrder(
  sectionOrder: SortableSectionKey[]
): SortableSectionKey[] {
  const uniqueIds = Array.from(new Set(sectionOrder))
  return DEFAULT_SECTION_ORDER.filter((sectionId) =>
    uniqueIds.includes(sectionId)
  )
}

export function addSection(
  data: ResumeData,
  sectionId: SortableSectionKey,
  language: Locale
): ResumeData {
  if (data[sectionId]) {
    const nextOrder = data.sectionOrder.includes(sectionId)
      ? data.sectionOrder
      : normalizeSectionOrder([...data.sectionOrder, sectionId])
    return {
      ...data,
      sectionOrder: nextOrder
    }
  }

  return {
    ...data,
    [sectionId]: createEmptySection(sectionId, language),
    sectionOrder: normalizeSectionOrder([...data.sectionOrder, sectionId])
  }
}

export function ensureSectionHasEditableEntry(
  data: ResumeData,
  sectionId: SortableSectionKey,
  language: Locale
): { resume: ResumeData; entryIndex: number } {
  const nextResume = addSection(data, sectionId, language)
  const section = nextResume[sectionId]

  if (!section) {
    throw new Error(`Section ${sectionId} was not created`)
  }

  if (section.entries.length > 0) {
    return {
      resume: nextResume,
      entryIndex: 0
    }
  }

  const nextSection = {
    ...section,
    entries: [...section.entries, createEmptySectionEntry(sectionId)]
  }

  return {
    resume: {
      ...nextResume,
      [sectionId]: nextSection
    },
    entryIndex: 0
  }
}

export function insertEntryBelow(
  data: ResumeData,
  sectionId: SortableSectionKey,
  index: number
): { resume: ResumeData; entryIndex: number } {
  const section = data[sectionId]

  if (!section) {
    throw new Error(`Section ${sectionId} does not exist`)
  }

  const nextBlocks = [...section.entries]
  const entryIndex = Math.min(Math.max(index + 1, 0), nextBlocks.length)

  nextBlocks.splice(entryIndex, 0, createEmptySectionEntry(sectionId))

  return {
    resume: {
      ...data,
      [sectionId]: {
        ...section,
        entries: nextBlocks
      }
    },
    entryIndex
  }
}

export function removeSection(
  data: ResumeData,
  sectionId: SortableSectionKey
): ResumeData {
  if (isStarterSection(sectionId)) {
    return {
      ...data,
      [sectionId]: {
        ...data[sectionId]!,
        entries: []
      }
    }
  }

  const nextData = { ...data }
  delete nextData[sectionId]

  return {
    ...nextData,
    sectionOrder: data.sectionOrder.filter((id) => id !== sectionId)
  }
}
