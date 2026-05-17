import { describe, expect, it } from "vitest"
import type { ResumeData } from "@/types/resume"
import {
  addSection,
  ensureSectionHasEditableEntry,
  insertDraftEntryBelow,
  normalizeSectionOrder,
  removeSection
} from "@/lib/templates/section-helpers"
import { buildEmptyResumeData } from "@/lib/templates/section-factories"

describe("section-helpers", () => {
  it("normalizes section order against known sections", () => {
    expect(
      normalizeSectionOrder(["skills", "education", "skills", "projects"])
    ).toEqual(["education", "projects", "skills"])
  })

  it("adds an optional section once", () => {
    const baseResume: ResumeData = {
      ...buildEmptyResumeData("en"),
      projects: undefined,
      sectionOrder: ["education", "employment", "skills"]
    }

    const nextResume = addSection(baseResume, "projects", "en")
    expect(nextResume.projects?.title).toBe("Projects")
    expect(nextResume.sectionOrder).toContain("projects")

    const sameResume = addSection(nextResume, "projects", "en")
    expect(
      sameResume.sectionOrder.filter((id) => id === "projects")
    ).toHaveLength(1)
  })

  it("removes optional sections from data and order", () => {
    const baseResume = buildEmptyResumeData("en")
    const nextResume = removeSection(baseResume, "projects")

    expect(nextResume.projects).toBeUndefined()
    expect(nextResume.sectionOrder).not.toContain("projects")
  })

  it("keeps required sections but clears entries on remove", () => {
    const baseResume = buildEmptyResumeData("en")
    baseResume.skills.entries.push({
      entryId: "skill-1",
      group: "Languages",
      content: "TypeScript"
    })

    const nextResume = removeSection(baseResume, "skills")

    expect(nextResume.skills).toBeDefined()
    expect(nextResume.skills.entries).toHaveLength(0)
    expect(nextResume.sectionOrder).toContain("skills")
  })

  it("ensures entry-based sections open with an editable entry", () => {
    const baseResume = buildEmptyResumeData("en")

    const { resume, entryIndex } = ensureSectionHasEditableEntry(
      baseResume,
      "education",
      "en"
    )

    expect(entryIndex).toBe(0)
    expect(resume.education.entries).toHaveLength(1)
    expect(resume.education.entries[0]).toMatchObject({
      school: "",
      degree: "",
      start: "",
      end: "",
      content: ""
    })
  })

  it("adds missing optional sections with an editable entry", () => {
    const baseResume = buildEmptyResumeData("en")

    const { resume, entryIndex } = ensureSectionHasEditableEntry(
      baseResume,
      "employment",
      "en"
    )

    expect(entryIndex).toBe(0)
    expect(resume.employment).toBeDefined()
    expect(resume.employment?.entries).toHaveLength(1)
    expect(resume.sectionOrder).toContain("employment")
  })

  it("inserts a new draft entry directly below the selected entry", () => {
    const baseResume = buildEmptyResumeData("en")
    baseResume.education.entries = [
      {
        entryId: "edu-1",
        school: "School 1",
        degree: "Degree 1",
        start: "2020-01",
        end: "2021-01",
        content: "A"
      },
      {
        entryId: "edu-2",
        school: "School 2",
        degree: "Degree 2",
        start: "2021-01",
        end: "2022-01",
        content: "B"
      }
    ]

    const { resume, entryIndex } = insertDraftEntryBelow(
      baseResume,
      "education",
      0
    )

    expect(entryIndex).toBe(1)
    expect(resume.education.entries).toHaveLength(3)
    expect(resume.education.entries[0].entryId).toBe("edu-1")
    expect(resume.education.entries[1]).toMatchObject({
      school: "",
      degree: "",
      start: "",
      end: "",
      content: ""
    })
    expect(resume.education.entries[2].entryId).toBe("edu-2")
  })
})
