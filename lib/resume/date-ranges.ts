import type { ResumeData } from "@/types/resume"

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

export function normalizeDateEnd(value?: string | null): string {
  const rawEnd = (value ?? "").trim()
  return CURRENT_DATE_VALUES.has(rawEnd.toLocaleLowerCase()) ? "" : rawEnd
}

export function formatDateRange(
  start?: string,
  end?: string
): string | undefined {
  const startValue = start?.trim()
  const normalizedEnd = normalizeDateEnd(end)
  const isPresent = !normalizedEnd && !!startValue
  const endDisplay = isPresent ? "Present" : normalizedEnd

  if (startValue && endDisplay) {
    return `${startValue} - ${endDisplay}`
  }

  return startValue || endDisplay || undefined
}

export function normalizeResumeDateRanges(resume: ResumeData): ResumeData {
  const normalizedResume = { ...resume }

  const sections = ["education", "employment", "projects", "research"] as const

  for (const section of sections) {
    const data = resume[section]
    if (data) {
      ;(normalizedResume as Record<string, unknown>)[section] = {
        ...data,
        entries: data.entries.map((entry) => ({
          ...entry,
          end: normalizeDateEnd((entry as { end?: string }).end)
        }))
      }
    }
  }

  return normalizedResume
}
