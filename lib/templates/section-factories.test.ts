import { describe, expect, it } from "vitest"
import {
  buildEmptyResumeData,
  createEmptySection
} from "@/lib/templates/section-factories"

describe("section-factories", () => {
  it("creates english sections with english titles", () => {
    const section = createEmptySection("education", "en")
    expect(section.title).toBe("Education History")
    expect(section.blocks).toEqual([])
  })

  it("creates chinese sections with chinese titles", () => {
    const section = createEmptySection("skills", "zh")
    expect(section.title).toBe("技能")
  })

  it("builds empty resume data with language-specific section titles", () => {
    const resume = buildEmptyResumeData("zh")
    expect(resume.education.title).toBe("教育经历")
    expect(resume.employment).toBeUndefined()
    expect(resume.sectionOrder).toEqual(["education", "skills"])
    expect(resume.personalInfo.website).toBe("")
    expect(resume.personalInfo.linkedin).toBe("")
  })
})
