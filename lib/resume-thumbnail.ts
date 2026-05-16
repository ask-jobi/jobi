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

function formatDateRange(start?: string, end?: string, isCurrent?: boolean) {
  const startValue = start?.trim()
  const endValue = isCurrent ? "Present" : end?.trim()

  if (startValue && endValue) {
    return `${startValue} - ${endValue}`
  }

  return startValue || endValue || undefined
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
    meta: formatDateRange(entry.start, entry.end)
  }
}

function buildEmploymentSummary(entry: EmploymentEntry): ThumbnailEntrySummary {
  return {
    heading: entry.company,
    subheading: entry.jobTitle,
    meta: formatDateRange(entry.start, entry.end)
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
    meta: formatDateRange(
      entry.date?.start,
      entry.date?.end,
      entry.date?.isCurrent
    )
  }
}

function buildResearchSummary(entry: ResearchEntry): ThumbnailEntrySummary {
  return {
    heading: entry.title,
    subheading: entry.role,
    meta: formatDateRange(
      entry.date?.start,
      entry.date?.end,
      entry.date?.isCurrent
    )
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
  resumeData: ResumeData
): ThumbnailSectionSummary[] {
  return resumeData.sectionOrder.flatMap((sectionId) => {
    const section = resumeData[sectionId]

    if (!section || section.entries.length === 0) {
      return []
    }

    const entries = section.entries.map((entry) =>
      buildEntrySummary(sectionId, entry)
    )

    return [
      {
        id: sectionId,
        title: section.title,
        entries
      }
    ]
  })
}
