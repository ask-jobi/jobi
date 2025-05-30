export type JobApplication = {
  id: string;
    resume: {
        id: string;
        resume_json: ResumeData;
    }
    job: {
        id: string;
        name: string;
        company: string;
        description: string
    }
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
