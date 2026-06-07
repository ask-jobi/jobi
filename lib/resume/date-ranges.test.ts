import { describe, expect, it } from "vitest"
import {
  formatDateRange,
  normalizeDateRange,
  normalizeResumeDateRanges
} from "@/lib/resume/date-ranges"
import type { ResumeData } from "@/types/resume"

describe("resume date ranges", () => {
  it("normalizes current end values to isCurrent", () => {
    expect(
      normalizeDateRange({
        start: "2024-01",
        end: "Present",
        isCurrent: false
      })
    ).toEqual({
      start: "2024-01",
      end: "",
      isCurrent: true
    })
  })

  it("maps legacy education and employment start/end fields to date ranges", () => {
    const resume = {
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
            end: "2022-06",
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
            end: "present",
            content: "Built products."
          }
        ]
      }
    } as unknown as ResumeData

    const normalizedResume = normalizeResumeDateRanges(resume)

    expect(normalizedResume.education?.entries[0]).toMatchObject({
      date: { start: "2018-09", end: "2022-06", isCurrent: false }
    })
    expect(normalizedResume.employment?.entries[0]).toMatchObject({
      date: { start: "2022-07", end: "", isCurrent: true }
    })
    expect(normalizedResume.education?.entries[0]).not.toHaveProperty("start")
    expect(normalizedResume.employment?.entries[0]).not.toHaveProperty("end")
  })

  it("formats current date ranges as Present", () => {
    expect(
      formatDateRange({ start: "2024-01", end: "", isCurrent: true })
    ).toBe("2024-01 - Present")
  })
})
