/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ModernTemplate } from "@/components/resume-templates/modern-template"
import type { ResumeData } from "@/types/resume"

describe("ModernTemplate", () => {
  it("renders supported sections in sectionOrder order", () => {
    const data: ResumeData = {
      sectionOrder: ["skills", "employment", "education"],
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
            start: "2020-01",
            end: "2021-01",
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
            start: "2021-01",
            end: "2022-01",
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

    render(<ModernTemplate data={data} language="en" />)

    const skillsSection = document.getElementById("section-skills")
    const employmentSection = document.getElementById("section-employment")
    const educationSection = document.getElementById("section-education")

    expect(skillsSection).not.toBeNull()
    expect(employmentSection).not.toBeNull()
    expect(educationSection).not.toBeNull()
    expect(
      skillsSection?.compareDocumentPosition(employmentSection as Node)
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(
      employmentSection?.compareDocumentPosition(educationSection as Node)
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
