import { describe, expect, it } from "vitest"
import { buildEmptyResumeData } from "@/lib/templates/section-factories"
import { getSectionEntryActions } from "@/lib/templates/section-entry-actions"

describe("getSectionEntryActions", () => {
  it("offers add actions for all sections on a brand-new empty resume", () => {
    const actions = getSectionEntryActions(buildEmptyResumeData("en"))

    expect(actions).toEqual(
      expect.arrayContaining([
        { sectionId: "education", action: "add" },
        { sectionId: "employment", action: "add" },
        { sectionId: "skills", action: "add" }
      ])
    )
  })

  it("returns add for missing sections and open for empty existing sections", () => {
    const resume = buildEmptyResumeData("en")
    resume.projects = {
      entries: []
    }
    resume.sectionOrder = ["projects"]

    const actions = getSectionEntryActions(resume)

    expect(actions).toContainEqual({ sectionId: "projects", action: "open" })
    expect(actions).toContainEqual({ sectionId: "education", action: "add" })
    expect(actions).toContainEqual({ sectionId: "employment", action: "add" })
    expect(actions).toContainEqual({ sectionId: "skills", action: "add" })
  })
})
