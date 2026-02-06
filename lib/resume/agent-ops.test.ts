import { applyResumeEditOps, type ResumeEditOp } from "@/lib/resume/agent-ops"
import type { ResumeData } from "@/types/resume"
import { describe, it, expect } from "vitest"

describe("applyResumeEditOps", () => {
  const baseResume: ResumeData = {
    sectionOrder: ["education", "employment", "skills"],
    personalInfo: {
      blockId: "p1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "123"
    },
    education: { sectionId: "e1", title: "Education", blocks: [] },
    employment: { sectionId: "emp1", title: "Employment", blocks: [] },
    skills: { sectionId: "s1", title: "Skills", blocks: [] }
  }

  it("updates an existing block", () => {
    const resume: ResumeData = {
      ...baseResume,
      education: {
        ...baseResume.education,
        blocks: [
          {
            blockId: "e-b1",
            school: "MIT",
            degree: "BS",
            start: "2010",
            end: "2014",
            content: "Math"
          }
        ]
      }
    }
    const ops: ResumeEditOp[] = [
      {
        op: "updateBlock",
        section: "education",
        blockIndex: 0,
        payload: { content: "CS" }
      }
    ]

    const result = applyResumeEditOps(resume, ops)

    expect(result.errors).toHaveLength(0)
    expect(result.updatedResumeData.education.blocks[0].content).toBe("CS")
  })

  it("adds a block to optional section and auto-initializes it", () => {
    const ops: ResumeEditOp[] = [
      {
        op: "addBlock",
        section: "projects",
        payload: { title: "ML", content: "Did things" }
      }
    ]

    const result = applyResumeEditOps(baseResume, ops)

    expect(result.errors).toHaveLength(0)
    expect(result.updatedResumeData.projects).toBeTruthy()
    expect(result.updatedResumeData.projects?.blocks).toHaveLength(1)
    expect(result.updatedResumeData.projects?.blocks[0].title).toBe("ML")
  })

  it("removes a block by index", () => {
    const resume: ResumeData = {
      ...baseResume,
      skills: {
        ...baseResume.skills,
        blocks: [{ blockId: "s-b1", group: "Lang", content: "TS" }]
      }
    }

    const ops: ResumeEditOp[] = [
      {
        op: "removeBlock",
        section: "skills",
        blockIndex: 0
      }
    ]

    const result = applyResumeEditOps(resume, ops)

    expect(result.errors).toHaveLength(0)
    expect(result.updatedResumeData.skills.blocks).toHaveLength(0)
  })

  it("skips invalid ops and returns errors", () => {
    const ops: ResumeEditOp[] = [
      {
        op: "updateBlock",
        section: "education",
        blockIndex: 99,
        payload: { content: "X" }
      }
    ]

    const result = applyResumeEditOps(baseResume, ops)

    expect(result.errors).toHaveLength(1)
    expect(result.updatedResumeData).toEqual(baseResume)
  })
})
