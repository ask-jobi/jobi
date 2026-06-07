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
import type { Locale } from "@/lib/i18n/config"
import { getSectionLabel } from "@/lib/templates/section-labels"
import {
  formatDateRange,
  normalizeResumeDateRanges
} from "@/lib/resume/date-ranges"

const MAX_SKILL_TAGS = 6

export type ThumbnailEntrySummary = {
  heading: string
  meta?: string
  subheading?: string
  tags?: string[]
}

export type ThumbnailSectionSummary = {
  id: SortableSectionKey
  title: string
  entries: ThumbnailEntrySummary[]
}

function splitSkillTags(content: string) {
  return content
    .split(/[,，•\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_SKILL_TAGS)
}

function buildEducationSummary(entry: EducationEntry): ThumbnailEntrySummary {
  return {
    heading: entry.school,
    subheading: entry.degree,
    meta: formatDateRange(entry.date)
  }
}

function buildEmploymentSummary(entry: EmploymentEntry): ThumbnailEntrySummary {
  return {
    heading: entry.company,
    subheading: entry.jobTitle,
    meta: formatDateRange(entry.date)
  }
}

function buildSkillsSummary(entry: SkillEntry): ThumbnailEntrySummary {
  return {
    heading: entry.group,
    tags: splitSkillTags(entry.content)
  }
}

function buildProjectSummary(entry: ProjectEntry): ThumbnailEntrySummary {
  return {
    heading: entry.title,
    subheading: entry.role,
    meta: formatDateRange(entry.date)
  }
}

function buildResearchSummary(entry: ResearchEntry): ThumbnailEntrySummary {
  return {
    heading: entry.title,
    subheading: entry.role,
    meta: formatDateRange(entry.date)
  }
}

function buildPublicationSummary(
  entry: PublicationEntry
): ThumbnailEntrySummary {
  return {
    heading: entry.title,
    meta: entry.date?.trim() || undefined
  }
}

function buildAwardSummary(entry: AwardEntry): ThumbnailEntrySummary {
  return {
    heading: entry.title,
    subheading: entry.issuer,
    meta: entry.date?.trim() || undefined
  }
}

function buildCertificationSummary(
  entry: CertificationEntry
): ThumbnailEntrySummary {
  return {
    heading: entry.name,
    subheading: entry.issuer,
    meta: entry.date?.trim() || undefined
  }
}

function buildEntrySummary(
  sectionId: SortableSectionKey,
  entry:
    | EducationEntry
    | EmploymentEntry
    | SkillEntry
    | ProjectEntry
    | ResearchEntry
    | PublicationEntry
    | AwardEntry
    | CertificationEntry
): ThumbnailEntrySummary {
  switch (sectionId) {
    case "education":
      return buildEducationSummary(entry as EducationEntry)
    case "employment":
      return buildEmploymentSummary(entry as EmploymentEntry)
    case "skills":
      return buildSkillsSummary(entry as SkillEntry)
    case "projects":
      return buildProjectSummary(entry as ProjectEntry)
    case "research":
      return buildResearchSummary(entry as ResearchEntry)
    case "publications":
      return buildPublicationSummary(entry as PublicationEntry)
    case "awards":
      return buildAwardSummary(entry as AwardEntry)
    case "certifications":
      return buildCertificationSummary(entry as CertificationEntry)
  }
}

export function getResumeThumbnailSections(
  resumeData: ResumeData,
  language: Locale
): ThumbnailSectionSummary[] {
  const normalizedResumeData = normalizeResumeDateRanges(resumeData)

  return normalizedResumeData.sectionOrder.flatMap((sectionId) => {
    const section = normalizedResumeData[sectionId]

    if (!section || section.entries.length === 0) {
      return []
    }

    const entries = section.entries.map((entry) =>
      buildEntrySummary(sectionId, entry)
    )

    return [
      {
        id: sectionId,
        title: getSectionLabel(sectionId, language),
        entries
      }
    ]
  })
}
