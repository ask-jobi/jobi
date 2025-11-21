import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {EducationBlock, EmploymentBlock, ResumeData, SkillBlock} from "@/types/resume";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const resumeFormat = (resumeData: ResumeData) => {
  return `
Personal Information:
Name: ${resumeData.personalInfo?.firstName || ''} ${resumeData.personalInfo?.lastName || ''}
Email: ${resumeData.personalInfo?.email || ''}
Phone: ${resumeData.personalInfo?.phone || ''}
Website: ${resumeData.personalInfo?.website || 'Not provided'}
LinkedIn: ${resumeData.personalInfo?.linkedin || 'Not provided'}

Education Experience:
${resumeData.education?.blocks?.map((edu: EducationBlock, index: number) =>
    `Education Block ${index + 1}:\n${edu.school} - ${edu.degree}\n${edu.content} [${edu.start} ~ ${edu.end}]`
  ).join('\n\n') || 'None'}

Employment Experience:
${resumeData.employment?.blocks?.map((emp: EmploymentBlock, index: number) =>
    `Employment Block ${index + 1}:\n${emp.company} - ${emp.jobTitle}\n${emp.content}`
  ).join('\n\n') || 'None'}

Skills:
${resumeData.skills?.blocks?.map((skill: SkillBlock, index: number) =>
    `Skills Block ${index + 1}:\n${skill.group}: ${skill.content}`
  ).join('\n\n') || 'None'}
  `
}
