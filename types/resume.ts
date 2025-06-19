export type JobApplication = {
  id: string;
    resume: {
        id: string;
    }
    job: {
        id: string;
    }
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

export interface EducationHistory {
  title: string,
  order: number,
  blocks: EducationBlock[]
}

export interface EmploymentHistory {
  title: string,
  order: number,
  blocks: EmploymentBlock[]
}

export interface Skill {
  title: string,
  order: number;
  blocks: SkillBlock[],
}

export interface SkillBlock {
  group: string;
  content: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo
  education: EducationHistory
  employment: EmploymentHistory
  skills: Skill
}


export interface AISuggestion {
  section: 'education' | 'employment' | 'skills';
  blockIndex: number;
  suggestionType: string;
  reason: string;
  originalContent: string;
  optimizedContent: string | null; // 为空时，代表需要移除这段简历
  highlight?: string[];
}

export type AISuggestionQueue = AISuggestion[];
