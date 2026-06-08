import type { DateRange, ResumeData } from "@/types/resume"

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

export function normalizeDateRange(value?: DateRange | null): DateRange {
  const start = value?.start ?? ""
  const rawEnd = value?.end ?? ""
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

export function normalizeResumeDateRanges(resume: ResumeData): ResumeData {
  const normalizedResume = { ...resume }

  const sections = [
    "education",
    "employment",
    "projects",
    "research"
  ] as const

  for (const section of sections) {
    const data = resume[section]
    if (data) {
      normalizedResume[section] = {
        ...data,
        entries: data.entries.map((entry) => ({
          ...entry,
          date: normalizeDateRange(entry.date)
        }))
      }
    }
  }

  return normalizedResume
}
