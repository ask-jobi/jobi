export type JobApplication = {
  id: string;
    resume: {
        id: string;
    }
    job: {
        id: string;
    }
}

export interface SectionBlock<T = any> {
  title: string
  order: number
  blocks: T[]
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
}

export interface EducationBlock {
  content: string;
  school: string;
  degree: string;
  start: string;
  end: string;
}

export interface EmploymentBlock {
  content: string;
  company: string;
  jobTitle: string;
  start: string;
  end: string;
}

export interface SkillBlock {
  group: string;
  content: string;
}

export type EducationHistory = SectionBlock<EducationBlock>

export type EmploymentHistory = SectionBlock<EmploymentBlock>

export type Skill = SectionBlock<SkillBlock>

export interface ResumeData {
  personalInfo: PersonalInfo
  education: EducationHistory
  employment: EmploymentHistory
  skills: Skill
}

export type SortableSectionId = Exclude<keyof ResumeData, "personalInfo">

export interface AISuggestion {
  section: SortableSectionId;
  blockIndex: number;
  suggestionType: string;
  reason: string;
  originalContent: string;
  optimizedContent: string | null; // 为空时，代表需要移除这段简历
  highlight?: string[];
}

export type AISuggestionQueue = AISuggestion[];
