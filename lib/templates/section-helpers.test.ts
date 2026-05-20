import { describe, expect, it } from "vitest"
import type { ResumeData } from "@/types/resume"
import {
  addSection,
  normalizeSectionOrder,
  removeSection
} from "@/lib/templates/section-helpers"
import { buildEmptyResumeData } from "@/lib/templates/section-factories"

describe("section-helpers", () => {
  it("keeps user order stable while deduping known sections", () => {
    expect(
      normalizeSectionOrder([
        "skills",
        "education",
        "skills",
        "projects",
        "unknown" as never
      ])
    ).toEqual(["skills", "education", "projects"])
  })

  it("appends a missing section to the end once", () => {
    const baseResume: ResumeData = {
      ...buildEmptyResumeData("en"),
      education: {
        entries: []
      },
      skills: {
        entries: []
      },
      projects: undefined,
      sectionOrder: ["education", "skills", "employment"]
    }

    const nextResume = addSection(baseResume, "projects", "en")
    expect(nextResume.projects?.entries).toEqual([])
    expect(nextResume.sectionOrder).toEqual([
      "education",
      "skills",
      "employment",
      "projects"
    ])

    const sameResume = addSection(nextResume, "projects", "en")
    expect(
      sameResume.sectionOrder.filter((id) => id === "projects")
    ).toHaveLength(1)
  })

  it("removes any section from data and order", () => {
    const baseResume: ResumeData = {
      ...buildEmptyResumeData("en"),
      projects: {
        entries: []
      },
      sectionOrder: ["projects"]
    }

    const nextResume = removeSection(baseResume, "projects")

    expect(nextResume.projects).toBeUndefined()
    expect(nextResume.sectionOrder).not.toContain("projects")
  })

  it("removes skills from data and order after the last entry is deleted", () => {
    const baseResume: ResumeData = {
      ...buildEmptyResumeData("en"),
      skills: {
        entries: [
          {
            entryId: "skill-1",
            group: "Languages",
            content: "TypeScript"
          }
        ]
      },
      sectionOrder: ["skills"]
    }

    const nextResume = removeSection(baseResume, "skills")

    expect(nextResume.skills).toBeUndefined()
    expect(nextResume.sectionOrder).not.toContain("skills")
  })
})
