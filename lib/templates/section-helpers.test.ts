import { describe, expect, it } from "vitest"
import type { ResumeData } from "@/types/resume"
import {
  addSection,
  ensureSectionHasEditableBlock,
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

  it("keeps required sections but clears blocks on remove", () => {
    const baseResume = buildEmptyResumeData("en")
    baseResume.skills.blocks.push({
      blockId: "skill-1",
      group: "Languages",
      content: "TypeScript"
    })

    const nextResume = removeSection(baseResume, "skills")

    expect(nextResume.skills).toBeDefined()
    expect(nextResume.skills.blocks).toHaveLength(0)
    expect(nextResume.sectionOrder).toContain("skills")
  })

  it("ensures block-based sections open with an editable block", () => {
    const baseResume = buildEmptyResumeData("en")

    const { resume, blockIndex } = ensureSectionHasEditableBlock(
      baseResume,
      "education",
      "en"
    )

    expect(blockIndex).toBe(0)
    expect(resume.education.blocks).toHaveLength(1)
    expect(resume.education.blocks[0]).toMatchObject({
      school: "",
      degree: "",
      start: "",
      end: "",
      content: ""
    })
  })

  it("adds missing optional sections with an editable block", () => {
    const baseResume = buildEmptyResumeData("en")

    const { resume, blockIndex } = ensureSectionHasEditableBlock(
      baseResume,
      "employment",
      "en"
    )

    expect(blockIndex).toBe(0)
    expect(resume.employment).toBeDefined()
    expect(resume.employment?.blocks).toHaveLength(1)
    expect(resume.sectionOrder).toContain("employment")
  })
})
