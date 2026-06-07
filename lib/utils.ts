import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  EducationEntry,
  EmploymentEntry,
  ResumeData,
  SkillEntry
} from "@/types/resume"
import { formatDateRange } from "@/lib/resume/date-ranges"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const resumeFormat = (resumeData: ResumeData) => {
  return `
Personal Information:
Name: ${resumeData.personalInfo?.firstName || ""} ${resumeData.personalInfo?.lastName || ""}
Email: ${resumeData.personalInfo?.email || ""}
Phone: ${resumeData.personalInfo?.phone || ""}
Website: ${resumeData.personalInfo?.website || "Not provided"}
LinkedIn: ${resumeData.personalInfo?.linkedin || "Not provided"}

Education Experience:
${
  resumeData.education?.entries
    ?.map(
      (edu: EducationEntry, index: number) =>
        `Education Entry ${index + 1}:\n${edu.school} - ${edu.degree}\n${edu.content} [${formatDateRange(edu.date) ?? ""}]`
    )
    .join("\n\n") || "None"
}

Employment Experience:
${
  resumeData.employment?.entries
    ?.map(
      (emp: EmploymentEntry, index: number) =>
        `Employment Entry ${index + 1}:\n${emp.company} - ${emp.jobTitle}\n${emp.content} [${formatDateRange(emp.date) ?? ""}]`
    )
    .join("\n\n") || "None"
}

Skills:
${
  resumeData.skills?.entries
    ?.map(
      (skill: SkillEntry, index: number) =>
        `Skills Entry ${index + 1}:\n${skill.group}: ${skill.content}`
    )
    .join("\n\n") || "None"
}
  `
}
