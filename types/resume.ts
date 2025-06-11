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
  educationHistory: EducationHistory
  employmentHistory: EmploymentHistory
  skills: Skill
}


export interface AISuggestion {
  // 定位：哪一块（教育、工作、技能）及其 index
  section: 'education' | 'employment' | 'skill';
  blockIndex: number;    // 在 blocks 数组中的下标
  suggestionType: string;    // 例如 "简洁表达/量化成果/突出技术栈/精炼语言/去除重复/英文表达/突出领导力/突出影响力/结构优化"
  reason: string;            // 为什么需要修改
  originalContent: string;
  optimizedContent: string;
  highlight?: string[];      // 可选：高亮提示关键点
}

export type AISuggestionQueue = AISuggestion[];
