import { describe, expect, it } from "vitest"
import type { ResumeData } from "@/types/resume"
import {
  addSection,
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
    expect(nextResume.projects?.entries).toEqual([])
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
})
