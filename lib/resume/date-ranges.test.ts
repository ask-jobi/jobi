import { describe, expect, it } from "vitest"
import {
  formatDateRange,
  normalizeDateEnd,
  normalizeResumeDateRanges
} from "@/lib/resume/date-ranges"
import type { ResumeData } from "@/types/resume"

describe("resume date ranges", () => {
  it("normalizes current end values to empty string", () => {
    expect(normalizeDateEnd("Present")).toBe("")
    expect(normalizeDateEnd("present")).toBe("")
    expect(normalizeDateEnd("Current")).toBe("")
    expect(normalizeDateEnd("Now")).toBe("")
    expect(normalizeDateEnd("至今")).toBe("")
    expect(normalizeDateEnd("2024-06")).toBe("2024-06")
  })

  it("formats date ranges", () => {
    expect(formatDateRange("2024-01", "")).toBe("2024-01 - Present")
    expect(formatDateRange("2024-01", "2024-06")).toBe("2024-01 - 2024-06")
    expect(formatDateRange("2024-01")).toBe("2024-01 - Present")
    expect(formatDateRange()).toBeUndefined()
  })

  it("normalizes end fields across all date-bearing sections", () => {
    const resume: ResumeData = {
      sectionOrder: ["education", "employment"],
      personalInfo: {
        entryId: "pi-1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "123"
      },
      education: {
        entries: [
          {
            entryId: "edu-1",
            school: "ZJU",
            degree: "BS",
            start: "2018-09",
            end: "present",
            content: "CS"
          }
        ]
      },
      employment: {
        entries: [
          {
            entryId: "job-1",
            company: "Acme",
            jobTitle: "Engineer",
            start: "2022-07",
            end: "Present",
            content: "Built products."
          }
        ]
      }
    }

    const normalizedResume = normalizeResumeDateRanges(resume)

    expect(normalizedResume.education?.entries[0]?.end).toBe("")
    expect(normalizedResume.employment?.entries[0]?.end).toBe("")
  })
})
