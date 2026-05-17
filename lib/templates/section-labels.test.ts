import { describe, expect, it } from "vitest"
import {
  getAllSectionLabels,
  getSectionLabel
} from "@/lib/templates/section-labels"

describe("section-labels", () => {
  it("returns english labels", () => {
    expect(getSectionLabel("education", "en")).toBe("Education History")
    expect(getSectionLabel("skills", "en")).toBe("Skills")
  })

  it("returns chinese labels", () => {
    expect(getSectionLabel("education", "zh")).toBe("教育经历")
    expect(getSectionLabel("employment", "zh")).toBe("工作经历")
  })

  it("returns all labels for a language", () => {
    expect(getAllSectionLabels("en")).toMatchObject({
      education: "Education History",
      employment: "Employment History"
    })
  })
})
