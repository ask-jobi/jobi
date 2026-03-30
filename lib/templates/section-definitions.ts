import type { SortableSectionId } from "@/types/resume"

export const DEFAULT_SECTION_ORDER: SortableSectionId[] = [
  "education",
  "employment",
  "research",
  "projects",
  "publications",
  "awards",
  "certifications",
  "skills"
]

export const REQUIRED_SECTION_IDS: SortableSectionId[] = ["education", "skills"]

export const OPTIONAL_SECTION_IDS: SortableSectionId[] =
  DEFAULT_SECTION_ORDER.filter(
    (sectionId) => !REQUIRED_SECTION_IDS.includes(sectionId)
  )

export const SECTION_INSERTION_ORDER = DEFAULT_SECTION_ORDER

export function isRequiredSection(sectionId: SortableSectionId) {
  return REQUIRED_SECTION_IDS.includes(sectionId)
}

export function isOptionalSection(sectionId: SortableSectionId) {
  return OPTIONAL_SECTION_IDS.includes(sectionId)
}
