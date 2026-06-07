import { Locale } from "@/lib/i18n/config"
import type { ResumeEvaluationOutput } from "@/types/evaluation"

export type ResumeJobDescription = {
  id: string
  name: string
  company: string
  description: string
}

export type AuthoritativeResumeState = {
  resume: ResumeData
  currentRevision: number
}

export type JobApplication = {
  id: string
  resume: {
    id: string
    resume_json: ResumeData
    current_revision: number
    language: Locale
    evaluation_report: ResumeEvaluationOutput | null
    evaluation_report_refresh_flag: boolean
  }
  job: ResumeJobDescription
}

export interface ResumeSection<T = any> {
  entries: Array<T>
}

export interface PersonalInfo {
  entryId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  website?: string
  linkedin?: string
}

export interface EducationEntry {
  entryId: string
  content: string
  school: string
  degree: string
  date: DateRange
}

export interface EmploymentEntry {
  entryId: string
  content: string
  company: string
  jobTitle: string
  date: DateRange
}

export interface SkillEntry {
  entryId: string
  group: string
  content: string
}

export interface DateRange {
  start: string
  end: string
  isCurrent: boolean
}

export interface ProjectEntry {
  entryId: string
  title: string
  content: string
  role?: string
  date: DateRange
}

export interface ResearchEntry {
  entryId: string
  title: string
  content: string
  role?: string
  date: DateRange
}

export interface PublicationEntry {
  entryId: string
  title: string
  date: string
  description?: string
}

export interface AwardEntry {
  entryId: string
  title: string
  issuer?: string
  date?: string
  description?: string
}

export interface CertificationEntry {
  entryId: string
  name: string
  issuer?: string
  date?: string
}

export type EducationSection = ResumeSection<EducationEntry>

export type EmploymentSection = ResumeSection<EmploymentEntry>

export type SkillsSection = ResumeSection<SkillEntry>

export type ResearchSection = ResumeSection<ResearchEntry>

export type ProjectsSection = ResumeSection<ProjectEntry>

export type PublicationsSection = ResumeSection<PublicationEntry>

export type AwardsSection = ResumeSection<AwardEntry>

export type CertificationsSection = ResumeSection<CertificationEntry>

export interface ResumeData {
  sectionOrder: SortableSectionKey[]
  personalInfo: PersonalInfo
  education?: EducationSection
  skills?: SkillsSection
  employment?: EmploymentSection
  research?: ResearchSection
  projects?: ProjectsSection
  publications?: PublicationsSection
  awards?: AwardsSection
  certifications?: CertificationsSection
}

export type ResumeSectionKey = Exclude<keyof ResumeData, "sectionOrder">
export type SortableSectionKey = Exclude<ResumeSectionKey, "personalInfo">

export interface AISuggestion {
  section: SortableSectionKey
  entryIndex: number
  suggestionType: string
  reason: string
  originalContent: string
  optimizedContent: string | null // 为空时，代表需要移除这段简历
  highlight?: string[]
}

export type AISuggestionQueue = AISuggestion[]

export type ResumeMetadata = {
  resumeLanguage: Locale
}
