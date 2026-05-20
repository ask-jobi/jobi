import type { Locale } from "@/lib/i18n/config"
import type { SortableSectionKey, ResumeData } from "@/types/resume"
import {
  DEFAULT_SECTION_ORDER,
  isStarterSection
} from "@/lib/templates/section-definitions"
import { createEmptySection } from "@/lib/templates/section-factories"

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
