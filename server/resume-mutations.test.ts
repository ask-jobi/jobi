import { describe, expect, it } from "vitest"
import {
  moveSectionInResume,
  reorderSectionEntriesInResume
} from "@/lib/resume/mutations"
import type { ResumeData } from "@/types/resume"

describe("moveSectionInResume", () => {
  it("moves a visible section up within sectionOrder", () => {
    const resume: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
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
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: "One"
          }
        ]
      },
      employment: {
        entries: [
          {
            entryId: "job-1",
            company: "Acme",
            jobTitle: "Engineer",
            start: "2020-01",
            end: "2021-01",
            content: "Built stuff"
          }
        ]
      },
      skills: {
        entries: [
          {
            entryId: "skill-1",
            group: "Languages",
            content: "TypeScript"
          }
        ]
      }
    }

    expect(moveSectionInResume(resume, "skills", "up").sectionOrder).toEqual([
      "education",
      "skills",
      "employment"
    ])
  })

  it("only reorders among currently visible sections", () => {
    const resume: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
      personalInfo: {
        entryId: "pi-1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "123"
      },
      education: {
        entries: []
      },
      employment: {
        entries: [
          {
            entryId: "job-1",
            company: "Acme",
            jobTitle: "Engineer",
            start: "2020-01",
            end: "2021-01",
            content: "Built stuff"
          }
        ]
      },
      skills: {
        entries: [
          {
            entryId: "skill-1",
            group: "Languages",
            content: "TypeScript"
          }
        ]
      }
    }

    expect(moveSectionInResume(resume, "skills", "up").sectionOrder).toEqual([
      "education",
      "skills",
      "employment"
    ])
  })

  it("returns the original resume when the move is out of bounds", () => {
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
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: "One"
          }
        ]
      },
      employment: {
        entries: [
          {
            entryId: "job-1",
            company: "Acme",
            jobTitle: "Engineer",
            start: "2020-01",
            end: "2021-01",
            content: "Built stuff"
          }
        ]
      }
    }

    expect(moveSectionInResume(resume, "education", "up")).toBe(resume)
  })
})

describe("reorderSectionEntriesInResume", () => {
  it("reorders entries within one section without changing other sections", () => {
    const resume: ResumeData = {
      sectionOrder: ["education", "employment", "skills"],
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
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: "One"
          },
          {
            entryId: "edu-2",
            school: "School 2",
            degree: "Degree 2",
            start: "2021-01",
            end: "2022-01",
            content: "Two"
          },
          {
            entryId: "edu-3",
            school: "School 3",
            degree: "Degree 3",
            start: "2022-01",
            end: "2023-01",
            content: "Three"
          }
        ]
      },
      employment: {
        entries: [
          {
            entryId: "job-1",
            company: "Acme",
            jobTitle: "Engineer",
            start: "2020-01",
            end: "2021-01",
            content: "Built stuff"
          }
        ]
      },
      skills: {
        entries: [
          {
            entryId: "skill-1",
            group: "Languages",
            content: "TypeScript"
          }
        ]
      }
    }

    const nextResume = reorderSectionEntriesInResume(resume, "education", 0, 2)

    expect(nextResume.education?.entries.map((entry) => entry.entryId)).toEqual(
      ["edu-2", "edu-3", "edu-1"]
    )
    expect(nextResume.employment).toEqual(resume.employment)
    expect(nextResume.skills).toEqual(resume.skills)
    expect(nextResume.sectionOrder).toEqual(resume.sectionOrder)
  })

  it("returns the original resume for a no-op reorder", () => {
    const resume: ResumeData = {
      sectionOrder: ["education", "skills"],
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
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: "One"
          }
        ]
      },
      skills: {
        entries: []
      }
    }

    expect(reorderSectionEntriesInResume(resume, "education", 0, 0)).toBe(
      resume
    )
  })
})
