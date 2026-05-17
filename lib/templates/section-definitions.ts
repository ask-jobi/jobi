import type { SortableSectionKey } from "@/types/resume"

export const DEFAULT_SECTION_ORDER: SortableSectionKey[] = [
  "education",
  "employment",
  "research",
  "projects",
  "publications",
  "awards",
  "certifications",
  "skills"
]

export const DEFAULT_STARTER_SECTION_IDS: SortableSectionKey[] = [
  "education",
  "skills"
]

export const OPTIONAL_SECTION_IDS: SortableSectionKey[] =
  DEFAULT_SECTION_ORDER.filter(
    (sectionId) => !DEFAULT_STARTER_SECTION_IDS.includes(sectionId)
  )

export const SECTION_INSERTION_ORDER = DEFAULT_SECTION_ORDER

export function isStarterSection(sectionId: SortableSectionKey) {
  return DEFAULT_STARTER_SECTION_IDS.includes(sectionId)
}

export function isOptionalSection(sectionId: SortableSectionKey) {
  return OPTIONAL_SECTION_IDS.includes(sectionId)
}
