import { describe, expect, it } from "vitest"
import { buildEmptyResumeData } from "@/lib/templates/section-factories"
import { getResumeThumbnailSections } from "@/lib/resume-thumbnail"

describe("getResumeThumbnailSections", () => {
  it("returns every populated section in section order", () => {
    const resume = buildEmptyResumeData("en")

    resume.education.blocks.push({
      blockId: "edu-1",
      school: "ZJU",
      degree: "BS CS",
      start: "2018",
      end: "2022",
      content: "Computer Science"
    })
    resume.projects = {
      sectionId: "projects-section",
      title: "Projects",
      blocks: [
        {
          blockId: "project-1",
          title: "Jobi",
          role: "Founder",
          date: { start: "2024-01", end: "2025-01" },
          content: "Built an AI resume workflow."
        }
      ]
    }
    resume.skills.blocks.push({
      blockId: "skill-1",
      group: "Languages",
      content: "TypeScript, React, Node.js"
    })
    resume.sectionOrder = ["education", "projects", "skills"]

    expect(
      getResumeThumbnailSections(resume).map((section) => section.id)
    ).toEqual(["education", "projects", "skills"])
  })

  it("omits empty sections and excludes content summaries", () => {
    const resume = buildEmptyResumeData("en")

    resume.skills.blocks.push(
      {
        blockId: "skill-1",
        group: "Frontend",
        content: "TypeScript, React, Next.js, Tailwind CSS"
      },
      {
        blockId: "skill-2",
        group: "Backend",
        content: "Node.js, PostgreSQL"
      },
      {
        blockId: "skill-3",
        group: "Infra",
        content: "Docker, Vercel"
      }
    )

    const sections = getResumeThumbnailSections(resume)

    expect(sections).toHaveLength(1)
    expect(sections[0].id).toBe("skills")
    expect(sections[0].blocks).toHaveLength(3)
    expect(sections[0].blocks[0].tags).toEqual([
      "TypeScript",
      "React",
      "Next.js",
      "Tailwind CSS"
    ])
    expect(sections[0].blocks[0]).not.toHaveProperty("summary")
  })
})
