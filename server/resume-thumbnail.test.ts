import { describe, expect, it } from "vitest"
import { buildEmptyResumeData } from "@/lib/templates/section-factories"
import { getResumeThumbnailSections } from "@/lib/resume-thumbnail"

describe("getResumeThumbnailSections", () => {
  it("returns every populated section in section order", () => {
    const resume = buildEmptyResumeData("en")

    resume.education = {
      entries: [
        {
          entryId: "edu-1",
          school: "ZJU",
          degree: "BS CS",
          date: { start: "2018", end: "2022", isCurrent: false },
          content: "Computer Science"
        }
      ]
    }
    resume.projects = {
      entries: [
        {
          entryId: "project-1",
          title: "Jobi",
          role: "Founder",
          date: { start: "2024-01", end: "2025-01", isCurrent: false },
          content: "Built an AI resume workflow."
        }
      ]
    }
    resume.skills = {
      entries: [
        {
          entryId: "skill-1",
          group: "Languages",
          content: "TypeScript, React, Node.js"
        }
      ]
    }
    resume.sectionOrder = ["education", "projects", "skills"]

    expect(
      getResumeThumbnailSections(resume, "en").map((section) => section.id)
    ).toEqual(["education", "projects", "skills"])
  })

  it("omits empty sections and excludes content summaries", () => {
    const resume = buildEmptyResumeData("en")

    resume.skills = {
      entries: [
        {
          entryId: "skill-1",
          group: "Frontend",
          content: "TypeScript, React, Next.js, Tailwind CSS"
        },
        {
          entryId: "skill-2",
          group: "Backend",
          content: "Node.js, PostgreSQL"
        },
        {
          entryId: "skill-3",
          group: "Infra",
          content: "Docker, Vercel"
        }
      ]
    }
    resume.sectionOrder = ["skills"]

    const sections = getResumeThumbnailSections(resume, "en")

    expect(sections).toHaveLength(1)
    expect(sections[0].id).toBe("skills")
    expect(sections[0].entries).toHaveLength(3)
    expect(sections[0].entries[0].tags).toEqual([
      "TypeScript",
      "React",
      "Next.js",
      "Tailwind CSS"
    ])
    expect(sections[0].entries[0]).not.toHaveProperty("summary")
  })
})
