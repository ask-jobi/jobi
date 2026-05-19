import { nanoid } from "nanoid"
import type { Locale } from "@/lib/i18n/config"
import type {
  AwardEntry,
  CertificationEntry,
  EducationEntry,
  EmploymentEntry,
  ProjectEntry,
  PublicationEntry,
  ResearchEntry,
  ResumeData,
  SkillEntry,
  SortableSectionKey
} from "@/types/resume"
import { DEFAULT_STARTER_SECTION_IDS } from "@/lib/templates/section-definitions"

function createBaseSection<ID extends SortableSectionKey>(): NonNullable<
  ResumeData[ID]
> {
  return {
    entries: []
  } as NonNullable<ResumeData[ID]>
}

export function createEmptySection<ID extends SortableSectionKey>(
  sectionId: ID,
  language: Locale
): NonNullable<ResumeData[ID]> {
  void sectionId
  void language

  return createBaseSection()
}

type EmptyEntryMap = {
  education: EducationEntry
  employment: EmploymentEntry
  skills: SkillEntry
  projects: ProjectEntry
  research: ResearchEntry
  publications: PublicationEntry
  awards: AwardEntry
  certifications: CertificationEntry
}

export function createEmptySectionEntry<ID extends SortableSectionKey>(
  sectionId: ID
): EmptyEntryMap[ID] {
  switch (sectionId) {
    case "education":
      return {
        entryId: nanoid(),
        school: "",
        degree: "",
        start: "",
        end: "",
        content: ""
      } as EmptyEntryMap[ID]
    case "employment":
      return {
        entryId: nanoid(),
        company: "",
        jobTitle: "",
        start: "",
        end: "",
        content: ""
      } as EmptyEntryMap[ID]
    case "skills":
      return {
        entryId: nanoid(),
        group: "",
        content: ""
      } as EmptyEntryMap[ID]
    case "projects":
      return {
        entryId: nanoid(),
        title: "",
        role: "",
        content: "",
        date: {
          start: "",
          end: ""
        }
      } as EmptyEntryMap[ID]
    case "research":
      return {
        entryId: nanoid(),
        title: "",
        role: "",
        content: "",
        date: {
          start: "",
          end: ""
        }
      } as EmptyEntryMap[ID]
    case "publications":
      return {
        entryId: nanoid(),
        title: "",
        date: "",
        description: ""
      } as EmptyEntryMap[ID]
    case "awards":
      return {
        entryId: nanoid(),
        title: "",
        issuer: "",
        date: "",
        description: ""
      } as EmptyEntryMap[ID]
    case "certifications":
      return {
        entryId: nanoid(),
        name: "",
        issuer: "",
        date: ""
      } as EmptyEntryMap[ID]
    default: {
      const exhaustiveCheck: never = sectionId
      throw new Error(`Unsupported section id: ${String(exhaustiveCheck)}`)
    }
  }
}

export function buildEmptyResumeData(language: Locale): ResumeData {
  return {
    sectionOrder: DEFAULT_STARTER_SECTION_IDS,
    personalInfo: {
      entryId: nanoid(),
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
