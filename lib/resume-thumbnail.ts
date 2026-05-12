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

const MAX_SKILL_TAGS = 6

export type ThumbnailBlockSummary = {
  heading: string
  meta?: string
  subheading?: string
  tags?: string[]
}

export type ThumbnailSectionSummary = {
  id: SortableSectionId
  title: string
  blocks: ThumbnailBlockSummary[]
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

function buildEducationSummary(block: EducationBlock): ThumbnailBlockSummary {
  return {
    heading: block.school,
    subheading: block.degree,
    meta: formatDateRange(block.start, block.end)
  }
}

function buildEmploymentSummary(block: EmploymentBlock): ThumbnailBlockSummary {
  return {
    heading: block.company,
    subheading: block.jobTitle,
    meta: formatDateRange(block.start, block.end)
  }
}

function buildSkillsSummary(block: SkillBlock): ThumbnailBlockSummary {
  return {
    heading: block.group,
    tags: splitSkillTags(block.content)
  }
}

function buildProjectSummary(block: ProjectBlock): ThumbnailBlockSummary {
  return {
    heading: block.title,
    subheading: block.role,
    meta: formatDateRange(
      block.date?.start,
      block.date?.end,
      block.date?.isCurrent
    )
  }
}

function buildResearchSummary(block: ResearchBlock): ThumbnailBlockSummary {
  return {
    heading: block.title,
    subheading: block.role,
    meta: formatDateRange(
      block.date?.start,
      block.date?.end,
      block.date?.isCurrent
    )
  }
}

function buildPublicationSummary(
  block: PublicationBlock
): ThumbnailBlockSummary {
  return {
    heading: block.title,
    meta: block.date?.trim() || undefined
  }
}

function buildAwardSummary(block: AwardBlock): ThumbnailBlockSummary {
  return {
    heading: block.title,
    subheading: block.issuer,
    meta: block.date?.trim() || undefined
  }
}

function buildCertificationSummary(
  block: CertificationBlock
): ThumbnailBlockSummary {
  return {
    heading: block.name,
    subheading: block.issuer,
    meta: block.date?.trim() || undefined
  }
}

function buildBlockSummary(
  sectionId: SortableSectionId,
  block:
    | EducationBlock
    | EmploymentBlock
    | SkillBlock
    | ProjectBlock
    | ResearchBlock
    | PublicationBlock
    | AwardBlock
    | CertificationBlock
): ThumbnailBlockSummary {
  switch (sectionId) {
    case "education":
      return buildEducationSummary(block as EducationBlock)
    case "employment":
      return buildEmploymentSummary(block as EmploymentBlock)
    case "skills":
      return buildSkillsSummary(block as SkillBlock)
    case "projects":
      return buildProjectSummary(block as ProjectBlock)
    case "research":
      return buildResearchSummary(block as ResearchBlock)
    case "publications":
      return buildPublicationSummary(block as PublicationBlock)
    case "awards":
      return buildAwardSummary(block as AwardBlock)
    case "certifications":
      return buildCertificationSummary(block as CertificationBlock)
  }
}

export function getResumeThumbnailSections(
  resumeData: ResumeData
): ThumbnailSectionSummary[] {
  return resumeData.sectionOrder.flatMap((sectionId) => {
    const section = resumeData[sectionId]

    if (!section || section.blocks.length === 0) {
      return []
    }

    const blocks = section.blocks.map((block) =>
      buildBlockSummary(sectionId, block)
    )

    return [
      {
        id: sectionId,
        title: section.title,
        blocks
      }
    ]
  })
}
