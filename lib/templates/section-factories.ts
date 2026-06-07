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
        date: {
          start: "",
          end: "",
          isCurrent: false
        },
        content: ""
      } as EmptyEntryMap[ID]
    case "employment":
      return {
        entryId: nanoid(),
        company: "",
        jobTitle: "",
        date: {
          start: "",
          end: "",
          isCurrent: false
        },
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
          end: "",
          isCurrent: false
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
          end: "",
          isCurrent: false
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
  void language

  return {
    sectionOrder: [],
    personalInfo: {
      entryId: nanoid(),
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      website: "",
      linkedin: ""
    }
  }
}
