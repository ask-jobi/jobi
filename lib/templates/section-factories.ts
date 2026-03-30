import { nanoid } from "nanoid"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeData, SortableSectionId } from "@/types/resume"
import { DEFAULT_SECTION_ORDER } from "@/lib/templates/section-definitions"
import { getSectionLabel } from "@/lib/templates/section-labels"

function createBaseSection<ID extends SortableSectionId>(
  sectionId: ID,
  language: Locale
): NonNullable<ResumeData[ID]> {
  return {
    sectionId: nanoid(),
    title: getSectionLabel(sectionId, language),
    blocks: []
  } as NonNullable<ResumeData[ID]>
}

export function createEmptySection<ID extends SortableSectionId>(
  sectionId: ID,
  language: Locale
): NonNullable<ResumeData[ID]> {
  return createBaseSection(sectionId, language)
}

export function buildEmptyResumeData(language: Locale): ResumeData {
  return {
    sectionOrder: DEFAULT_SECTION_ORDER,
    personalInfo: {
      blockId: nanoid(),
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      website: "",
      linkedin: ""
    },
    education: createEmptySection("education", language),
    employment: createEmptySection("employment", language),
    research: createEmptySection("research", language),
    projects: createEmptySection("projects", language),
    publications: createEmptySection("publications", language),
    awards: createEmptySection("awards", language),
    certifications: createEmptySection("certifications", language),
    skills: createEmptySection("skills", language)
  }
}
