import { Locale } from "@/lib/i18n/config"
import type { ResumeEvaluationOutput } from "@/types/evaluation"

export type ResumeJobDescription = {
  id: string
  name: string
  company: string
  description: string
}

export type JobApplication = {
  id: string
  resume: {
    id: string
    resume_json: ResumeData
    language: Locale
    evaluation_report: ResumeEvaluationOutput | null
    evaluation_report_refresh_flag: boolean
  }
  job: ResumeJobDescription
}

export interface SectionBlock<T = any> {
  title: string
  order: number
  blocks: T[]
}

export interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  website?: string
  linkedin?: string
}

export interface EducationBlock {
  content: string
  school: string
  degree: string
  start: string
  end: string
}
// TODO: 改为用 DateRange 类型
export interface EmploymentBlock {
  content: string
  company: string
  jobTitle: string
  start: string
  end: string
}

export interface SkillBlock {
  group: string
  content: string
}

export interface DateRange {
  start?: string
  end?: string
  isCurrent?: boolean
}

export interface ProjectBlock {
  title: string
  content: string
  role?: string
  date?: DateRange
}

export interface ResearchBlock {
  title: string
  content: string
  role?: string
  date: DateRange
}

export interface PublicationBlock {
  title: string
  date: string
  description?: string
}

export interface AwardBlock {
  title: string
  issuer?: string
  date?: string
  description?: string
}

export interface CertificationBlock {
  name: string
  issuer?: string
  date?: string
}

export type EducationHistory = SectionBlock<EducationBlock>

export type EmploymentHistory = SectionBlock<EmploymentBlock>

export type Skill = SectionBlock<SkillBlock>

export type ResearchExperience = SectionBlock<ResearchBlock>

export type Project = SectionBlock<ProjectBlock>

export type Publication = SectionBlock<PublicationBlock>

export type Award = SectionBlock<AwardBlock>

export type Certification = SectionBlock<CertificationBlock>

export interface ResumeData {
  // required
  personalInfo: PersonalInfo
  education: EducationHistory
  skills: Skill
  // optional
  employment?: EmploymentHistory
  research?: ResearchExperience
  projects?: Project
  publications?: Publication
  awards?: Award
  certifications?: Certification
}

export type SortableSectionId = Exclude<keyof ResumeData, "personalInfo">

export interface AISuggestion {
  section: SortableSectionId
  blockIndex: number
  suggestionType: string
  reason: string
  originalContent: string
  optimizedContent: string | null // 为空时，代表需要移除这段简历
  highlight?: string[]
}

export type AISuggestionQueue = AISuggestion[]

export type ResumeMetadata = {
  language: Locale
}
