import type { Locale } from "@/lib/i18n/config"
import type { SortableSectionKey, ResumeData } from "@/types/resume"
import { DEFAULT_SECTION_ORDER } from "@/lib/templates/section-definitions"
import { createEmptySection } from "@/lib/templates/section-factories"

export function normalizeSectionOrder(
  sectionOrder: SortableSectionKey[]
): SortableSectionKey[] {
  const knownSections = new Set(DEFAULT_SECTION_ORDER)
  const dedupedOrder: SortableSectionKey[] = []

  for (const sectionId of sectionOrder) {
    if (!knownSections.has(sectionId) || dedupedOrder.includes(sectionId)) {
      continue
    }

    dedupedOrder.push(sectionId)
  }

  return dedupedOrder
}

export function addSection(
  data: ResumeData,
  sectionId: SortableSectionKey,
  language: Locale
): ResumeData {
  if (data[sectionId]) {
    return data.sectionOrder.includes(sectionId)
      ? data
      : {
          ...data,
          sectionOrder: normalizeSectionOrder([...data.sectionOrder, sectionId])
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
  const nextData = { ...data }
  delete nextData[sectionId]

  return {
    ...nextData,
    sectionOrder: data.sectionOrder.filter((id) => id !== sectionId)
  }
}
