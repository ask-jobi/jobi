import { describe, expect, it } from "vitest"
import {
  buildEmptyResumeData,
  createEmptySection
} from "@/lib/templates/section-factories"

describe("section-factories", () => {
  it("creates empty sections", () => {
    const section = createEmptySection("education", "en")
    expect(section.entries).toEqual([])
  })

  it("creates empty chinese sections", () => {
    const section = createEmptySection("skills", "zh")
    expect(section.entries).toEqual([])
  })

  it("builds empty resume data", () => {
    const resume = buildEmptyResumeData("zh")
    expect(resume.education.entries).toEqual([])
    expect(resume.employment).toBeUndefined()
    expect(resume.sectionOrder).toEqual(["education", "skills"])
    expect(resume.personalInfo.website).toBe("")
    expect(resume.personalInfo.linkedin).toBe("")
  })
})
