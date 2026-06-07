import type {
  DateRange,
  EducationEntry,
  EmploymentEntry,
  ProjectEntry,
  ResearchEntry,
  ResumeData
} from "@/types/resume"

const CURRENT_DATE_VALUES = new Set([
  "present",
  "current",
  "now",
  "ongoing",
  "至今",
  "现在",
  "当前",
  "目前"
])

type LegacyDateFields = {
  start?: string
  end?: string
}

type DateRangeEntry =
  | EducationEntry
  | EmploymentEntry
  | ProjectEntry
  | ResearchEntry

export function normalizeDateRange(
  value?: DateRange | null,
  legacy?: LegacyDateFields
): DateRange {
  const start = value?.start ?? legacy?.start ?? ""
  const rawEnd = value?.end ?? legacy?.end ?? ""
  const normalizedEnd = rawEnd.trim()
  const endMeansCurrent = CURRENT_DATE_VALUES.has(
    normalizedEnd.toLocaleLowerCase()
  )
  const isCurrent = endMeansCurrent || Boolean(value?.isCurrent)

  return {
    start,
    end: isCurrent ? "" : rawEnd,
    isCurrent
  }
}

export function formatDateRange(date?: DateRange): string | undefined {
  const normalizedDate = normalizeDateRange(date)
  const startValue = normalizedDate.start?.trim()
  const endValue = normalizedDate.isCurrent
    ? "Present"
    : normalizedDate.end?.trim()

  if (startValue && endValue) {
    return `${startValue} - ${endValue}`
  }

  return startValue || endValue || undefined
}

export function normalizeDateRangeEntry<T extends DateRangeEntry>(entry: T): T {
  const legacyEntry = entry as T & LegacyDateFields
  const normalizedEntry = {
    ...entry,
    date: normalizeDateRange(entry.date, legacyEntry)
  } as T & LegacyDateFields

  delete normalizedEntry.start
  delete normalizedEntry.end

  return normalizedEntry
}

export function normalizeResumeDateRanges(resume: ResumeData): ResumeData {
  const normalizedResume = { ...resume }

  if (resume.education) {
    normalizedResume.education = {
      ...resume.education,
      entries: resume.education.entries.map((entry) =>
        normalizeDateRangeEntry(entry)
      )
    }
  }

  if (resume.employment) {
    normalizedResume.employment = {
      ...resume.employment,
      entries: resume.employment.entries.map((entry) =>
        normalizeDateRangeEntry(entry)
      )
    }
  }

  if (resume.projects) {
    normalizedResume.projects = {
      ...resume.projects,
      entries: resume.projects.entries.map((entry) =>
        normalizeDateRangeEntry(entry)
      )
    }
  }

  if (resume.research) {
    normalizedResume.research = {
      ...resume.research,
      entries: resume.research.entries.map((entry) =>
        normalizeDateRangeEntry(entry)
      )
    }
  }

  return normalizedResume
}
