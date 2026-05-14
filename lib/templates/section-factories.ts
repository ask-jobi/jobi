import { nanoid } from "nanoid"
import type { Locale } from "@/lib/i18n/config"
import type {
  AwardBlock,
  CertificationBlock,
  EducationBlock,
  EmploymentBlock,
  ProjectBlock,
  PublicationBlock,
  ResearchBlock,
  ResumeData,
  SkillBlock,
  SortableSectionId
} from "@/types/resume"
import {
  REQUIRED_SECTION_IDS
} from "@/lib/templates/section-definitions"
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

type EmptyBlockMap = {
  education: EducationBlock
  employment: EmploymentBlock
  skills: SkillBlock
  projects: ProjectBlock
  research: ResearchBlock
  publications: PublicationBlock
  awards: AwardBlock
  certifications: CertificationBlock
}

export function createEmptySectionBlock<ID extends SortableSectionId>(
  sectionId: ID
): EmptyBlockMap[ID] {
  switch (sectionId) {
    case "education":
      return {
        blockId: nanoid(),
        school: "",
        degree: "",
        start: "",
        end: "",
        content: ""
      } as EmptyBlockMap[ID]
    case "employment":
      return {
        blockId: nanoid(),
        company: "",
        jobTitle: "",
        start: "",
        end: "",
        content: ""
      } as EmptyBlockMap[ID]
    case "skills":
      return {
        blockId: nanoid(),
        group: "",
        content: ""
      } as EmptyBlockMap[ID]
    case "projects":
      return {
        blockId: nanoid(),
        title: "",
        role: "",
        content: "",
        date: {
          start: "",
          end: ""
        }
      } as EmptyBlockMap[ID]
    case "research":
      return {
        blockId: nanoid(),
        title: "",
        role: "",
        content: "",
        date: {
          start: "",
          end: ""
        }
      } as EmptyBlockMap[ID]
    case "publications":
      return {
        blockId: nanoid(),
        title: "",
        date: "",
        description: ""
      } as EmptyBlockMap[ID]
    case "awards":
      return {
        blockId: nanoid(),
        title: "",
        issuer: "",
        date: "",
        description: ""
      } as EmptyBlockMap[ID]
    case "certifications":
      return {
        blockId: nanoid(),
        name: "",
        issuer: "",
        date: ""
      } as EmptyBlockMap[ID]
    default: {
      const exhaustiveCheck: never = sectionId
      throw new Error(`Unsupported section id: ${String(exhaustiveCheck)}`)
    }
  }
}

export function buildEmptyResumeData(language: Locale): ResumeData {
  return {
    sectionOrder: REQUIRED_SECTION_IDS,
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
    skills: createEmptySection("skills", language)
  }
}
