import type { Locale } from "@/lib/i18n/config"
import type { ResumeData, SortableSectionId } from "@/types/resume"
import {
  DEFAULT_SECTION_ORDER,
  isRequiredSection
} from "@/lib/templates/section-definitions"
import { createEmptySection } from "@/lib/templates/section-factories"

export function normalizeSectionOrder(
  sectionOrder: SortableSectionId[]
): SortableSectionId[] {
  const uniqueIds = Array.from(new Set(sectionOrder))
  return DEFAULT_SECTION_ORDER.filter((sectionId) =>
    uniqueIds.includes(sectionId)
  )
}

export function addSection(
  data: ResumeData,
  sectionId: SortableSectionId,
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
  sectionId: SortableSectionId
): ResumeData {
  if (isRequiredSection(sectionId)) {
    return {
      ...data,
      [sectionId]: {
        ...data[sectionId]!,
        blocks: []
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
