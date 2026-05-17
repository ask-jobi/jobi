import { describe, expect, it } from "vitest"
import { buildEmptyResumeData } from "@/lib/templates/section-factories"
import { getSectionEntryActions } from "@/lib/templates/section-entry-actions"

describe("getSectionEntryActions", () => {
  it("keeps empty required sections available after the resume is no longer empty", () => {
    const resume = buildEmptyResumeData("en")
    resume.employment = {
      title: "Employment History",
      entries: [
        {
          entryId: "employment-1",
          company: "Jobi",
          jobTitle: "Engineer",
          start: "2024-01",
          end: "2025-01",
          content: "Built features"
        }
      ]
    }
    resume.sectionOrder = ["education", "employment", "skills"]

    const actions = getSectionEntryActions(resume)

    expect(actions).toEqual(
      expect.arrayContaining([
        { sectionId: "education", action: "open" },
        { sectionId: "skills", action: "open" }
      ])
    )
  })

  it("returns add for missing optional sections and open for empty existing sections", () => {
    const resume = buildEmptyResumeData("en")
    resume.projects = {
      title: "Projects",
      entries: []
    }
    resume.sectionOrder = ["education", "projects", "skills"]

    const actions = getSectionEntryActions(resume)

    expect(actions).toContainEqual({ sectionId: "projects", action: "open" })
    expect(actions).toContainEqual({ sectionId: "employment", action: "add" })
    expect(actions).toContainEqual({ sectionId: "research", action: "add" })
  })
})
