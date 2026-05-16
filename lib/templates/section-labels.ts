import type { Locale } from "@/lib/i18n/config"
import type { SortableSectionKey } from "@/types/resume"

const SECTION_LABELS: Record<Locale, Record<SortableSectionKey, string>> = {
  en: {
    education: "Education History",
    employment: "Employment History",
    research: "Research Experience",
    projects: "Projects",
    publications: "Publications",
    awards: "Awards",
    certifications: "Certifications",
    skills: "Skills"
  },
  zh: {
    education: "教育经历",
    employment: "工作经历",
    research: "科研经历",
    projects: "项目经历",
    publications: "论文发表",
    awards: "奖项荣誉",
    certifications: "证书认证",
    skills: "技能"
  }
}

export function getSectionLabel(
  sectionId: SortableSectionKey,
  language: Locale
): string {
  return SECTION_LABELS[language][sectionId]
}

export function getAllSectionLabels(language: Locale) {
  return SECTION_LABELS[language]
}
