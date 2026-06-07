import { describe, expect, it } from "vitest"
import {
  applyToolOutputToResume,
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
            content: "One"
          },
          {
            entryId: "edu-2",
            school: "School 2",
            degree: "Degree 2",
            date: { start: "2021-01", end: "2022-01", isCurrent: false },
            content: "Two"
          },
          {
            entryId: "edu-3",
            school: "School 3",
            degree: "Degree 3",
            date: { start: "2022-01", end: "2023-01", isCurrent: false },
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
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
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
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

describe("applyToolOutputToResume", () => {
  it("creates a missing section when an AI add targets a blank resume", () => {
    const resume: ResumeData = {
      sectionOrder: [],
      personalInfo: {
        entryId: "pi-1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "123"
      }
    }
    const project = {
      entryId: "project-1",
      title: "Compiler Notes",
      role: "Maintainer",
      content: "Built a tiny compiler.",
      date: { start: "2024-01", end: "2024-06", isCurrent: false }
    }

    const nextResume = applyToolOutputToResume(resume, {
      operation: "add",
      entity: "projects",
      newEntry: project
    })

    expect(nextResume.sectionOrder).toEqual(["projects"])
    expect(nextResume.projects?.entries).toEqual([project])
  })
})
