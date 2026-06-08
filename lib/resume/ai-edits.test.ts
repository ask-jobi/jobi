import { describe, expect, it } from "vitest"
import {
  AiResumeEditError,
  type AiResumeEditOutput,
  applyAiResumeEdit,
  replayAiResumeEdits,
  revertAiResumeEdit,
  revertAiResumeEdits
} from "@/lib/resume/ai-edits"
import type { ResumeData } from "@/types/resume"

function createResume(): ResumeData {
  return {
    sectionOrder: ["education", "projects", "skills"],
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
          school: "Original School",
          degree: "BS",
          date: { start: "2020", end: "2024", isCurrent: false },
          content: "Computer Science"
        },
        {
          entryId: "edu-2",
          school: "Second School",
          degree: "MS",
          date: { start: "2024", end: "2026", isCurrent: false },
          content: "AI"
        }
      ]
    },
    projects: {
      entries: [
        {
          entryId: "project-1",
          title: "Compiler",
          role: "Maintainer",
          content: "Built a compiler.",
          date: { start: "2023-01", end: "2023-06", isCurrent: false }
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
}

function createResumeWithThreeEducationEntries(): ResumeData {
  const resume = createResume()
  const firstEntry = resume.education!.entries[0]!

  return {
    ...resume,
    education: {
      entries: [
        firstEntry,
        {
          ...firstEntry,
          entryId: "edu-2",
          school: "Middle School",
          degree: "MS"
        },
        {
          ...firstEntry,
          entryId: "edu-3",
          school: "Last School",
          degree: "PhD"
        }
      ]
    }
  }
}

describe("applyAiResumeEdit", () => {
  it("applies personalInfo and entry rewrites", () => {
    const afterPersonalInfo = applyAiResumeEdit(createResume(), {
      operation: "rewrite",
      entity: "personalInfo",
      id: "pi-1",
      field: "firstName",
      value: "Augusta",
      originalValue: "Ada"
    })
    const afterEntry = applyAiResumeEdit(afterPersonalInfo, {
      operation: "rewrite",
      entity: "education",
      id: "edu-1",
      field: "school",
      value: "Updated School",
      originalValue: "Original School"
    })

    expect(afterEntry.personalInfo.firstName).toBe("Augusta")
    expect(afterEntry.education?.entries[0]?.school).toBe("Updated School")
  })

  it("creates a missing section when adding an entry", () => {
    const resume: ResumeData = {
      sectionOrder: [],
      personalInfo: createResume().personalInfo
    }
    const project = createResume().projects!.entries[0]!

    const nextResume = applyAiResumeEdit(resume, {
      operation: "add",
      entity: "projects",
      newEntry: project
    })

    expect(nextResume.sectionOrder).toEqual(["projects"])
    expect(nextResume.projects?.entries).toEqual([project])
  })

  it("applies entry and section reorders", () => {
    const afterEntryReorder = applyAiResumeEdit(createResume(), {
      operation: "reorderEntries",
      entity: "education",
      orderedEntryIds: ["edu-2", "edu-1"],
      originalValue: ["edu-1", "edu-2"]
    })
    const afterSectionReorder = applyAiResumeEdit(afterEntryReorder, {
      operation: "reorderSections",
      entity: null,
      orderedSectionIds: ["skills", "projects", "education"],
      originalValue: ["education", "projects", "skills"]
    })

    expect(
      afterSectionReorder.education?.entries.map((entry) => entry.entryId)
    ).toEqual(["edu-2", "edu-1"])
    expect(afterSectionReorder.sectionOrder).toEqual([
      "skills",
      "projects",
      "education"
    ])
  })
})

describe("revertAiResumeEdit", () => {
  it("reverts personalInfo and entry rewrites", () => {
    const currentResume = {
      ...createResume(),
      personalInfo: {
        ...createResume().personalInfo,
        firstName: "Augusta"
      },
      education: {
        entries: [
          {
            ...createResume().education!.entries[0]!,
            school: "Updated School"
          }
        ]
      }
    }

    const afterEntryRevert = revertAiResumeEdit(currentResume, {
      operation: "rewrite",
      entity: "education",
      id: "edu-1",
      field: "school",
      value: "Updated School",
      originalValue: "Original School"
    })
    const afterPersonalInfoRevert = revertAiResumeEdit(afterEntryRevert, {
      operation: "rewrite",
      entity: "personalInfo",
      id: "pi-1",
      field: "firstName",
      value: "Augusta",
      originalValue: "Ada"
    })

    expect(afterPersonalInfoRevert.personalInfo.firstName).toBe("Ada")
    expect(afterPersonalInfoRevert.education?.entries[0]?.school).toBe(
      "Original School"
    )
  })

  it("removes a newly added entry and the section it created", () => {
    const project = createResume().projects!.entries[0]!
    const currentResume: ResumeData = {
      sectionOrder: ["projects"],
      personalInfo: createResume().personalInfo,
      projects: {
        entries: [project]
      }
    }

    const revertedResume = revertAiResumeEdit(currentResume, {
      operation: "add",
      entity: "projects",
      newEntry: project,
      createdSection: true
    } as any)

    expect(revertedResume.sectionOrder).toEqual([])
    expect(revertedResume.projects).toBeUndefined()
  })

  it("restores a deleted entry at its original index", () => {
    const resume = createResume()
    const deletedEntry = resume.education!.entries[1]!
    const currentResume: ResumeData = {
      ...resume,
      education: {
        entries: [resume.education!.entries[0]!]
      }
    }

    const revertedResume = revertAiResumeEdit(currentResume, {
      operation: "delete",
      entity: "education",
      id: "edu-2",
      originalValue: deletedEntry,
      originalIndex: 1
    } as any)

    expect(
      revertedResume.education?.entries.map((entry) => entry.entryId)
    ).toEqual(["edu-1", "edu-2"])
  })

  it("restores a deleted section using saved section order", () => {
    const deletedEntry = createResume().projects!.entries[0]!
    const currentResume: ResumeData = {
      ...createResume(),
      sectionOrder: ["education", "skills"],
      projects: undefined
    }

    const revertedResume = revertAiResumeEdit(currentResume, {
      operation: "delete",
      entity: "projects",
      id: "project-1",
      originalValue: deletedEntry,
      originalIndex: 0,
      originalSectionOrder: ["education", "projects", "skills"]
    } as any)

    expect(revertedResume.sectionOrder).toEqual([
      "education",
      "projects",
      "skills"
    ])
    expect(revertedResume.projects?.entries).toEqual([deletedEntry])
  })

  it("throws an error when delete output lacks originalIndex", () => {
    expect(() =>
      revertAiResumeEdit(
        createResume(),
        {
          operation: "delete",
          entity: "education",
          id: "edu-1",
          originalValue: createResume().education!.entries[0]!
        }
      )
    ).toThrow(AiResumeEditError)
  })

  it("throws a semantic conflict when current value no longer matches the edit output", () => {
    expect(() =>
      revertAiResumeEdit(
        createResume(),
        {
          operation: "rewrite",
          entity: "education",
          id: "edu-1",
          field: "school",
          originalValue: "Original School",
          value: "AI School"
        },
        { detectSemanticConflict: true }
      )
    ).toThrow(AiResumeEditError)
  })

  it("does not treat reordered object keys as a semantic conflict", () => {
    const currentResume = createResume()
    currentResume.projects!.entries[0]!.date = {
      start: "2026-01",
      end: "",
      isCurrent: true
    }

    const revertedResume = revertAiResumeEdit(
      currentResume,
      {
        operation: "rewrite",
        entity: "projects",
        id: "project-1",
        field: "date",
        value: {
          end: "",
          start: "2026-01",
          isCurrent: true
        },
        originalValue: {
          end: "",
          start: "2026-01",
          isCurrent: false
        }
      } as any,
      { detectSemanticConflict: true }
    )

    expect(revertedResume.projects?.entries[0]?.date).toEqual({
      end: "",
      start: "2026-01",
      isCurrent: false
    })
  })

  it("reverts entry and section reorders", () => {
    const currentResume: ResumeData = {
      ...createResume(),
      sectionOrder: ["skills", "projects", "education"],
      education: {
        entries: [
          createResume().education!.entries[1]!,
          createResume().education!.entries[0]!
        ]
      }
    }

    const afterEntryRevert = revertAiResumeEdit(currentResume, {
      operation: "reorderEntries",
      entity: "education",
      orderedEntryIds: ["edu-2", "edu-1"],
      originalValue: ["edu-1", "edu-2"]
    })
    const afterSectionRevert = revertAiResumeEdit(afterEntryRevert, {
      operation: "reorderSections",
      entity: null,
      orderedSectionIds: ["skills", "projects", "education"],
      originalValue: ["education", "projects", "skills"]
    })

    expect(
      afterSectionRevert.education?.entries.map((entry) => entry.entryId)
    ).toEqual(["edu-1", "edu-2"])
    expect(afterSectionRevert.sectionOrder).toEqual([
      "education",
      "projects",
      "skills"
    ])
  })
})

describe("replayAiResumeEdits and revertAiResumeEdits", () => {
  it("replays edits forward and reverts them in reverse order", () => {
    const outputs = [
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Original School",
        value: "Second School"
      },
      {
        operation: "rewrite",
        entity: "education",
        id: "edu-1",
        field: "school",
        originalValue: "Second School",
        value: "Third School"
      }
    ] as const

    const replayedResume = replayAiResumeEdits(createResume(), [...outputs])
    const revertedResume = revertAiResumeEdits(replayedResume, [...outputs])

    expect(replayedResume.education?.entries[0]?.school).toBe("Third School")
    expect(revertedResume.education?.entries[0]?.school).toBe("Original School")
  })

  it.each([
    [
      "personalInfo rewrite",
      createResume(),
      [
        {
          operation: "rewrite",
          entity: "personalInfo",
          id: "pi-1",
          field: "firstName",
          originalValue: "Ada",
          value: "Augusta"
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "entry rewrite",
      createResume(),
      [
        {
          operation: "rewrite",
          entity: "education",
          id: "edu-1",
          field: "school",
          originalValue: "Original School",
          value: "Updated School"
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "delete first entry",
      createResumeWithThreeEducationEntries(),
      [
        {
          operation: "delete",
          entity: "education",
          id: "edu-1",
          originalValue:
            createResumeWithThreeEducationEntries().education!.entries[0]!,
          originalIndex: 0
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "delete middle entry",
      createResumeWithThreeEducationEntries(),
      [
        {
          operation: "delete",
          entity: "education",
          id: "edu-2",
          originalValue:
            createResumeWithThreeEducationEntries().education!.entries[1]!,
          originalIndex: 1
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "delete last entry",
      createResumeWithThreeEducationEntries(),
      [
        {
          operation: "delete",
          entity: "education",
          id: "edu-3",
          originalValue:
            createResumeWithThreeEducationEntries().education!.entries[2]!,
          originalIndex: 2
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "delete last section entry",
      createResume(),
      [
        {
          operation: "delete",
          entity: "projects",
          id: "project-1",
          originalValue: createResume().projects!.entries[0]!,
          originalIndex: 0,
          originalSectionOrder: ["education", "projects", "skills"]
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "add to existing section",
      createResume(),
      [
        {
          operation: "add",
          entity: "skills",
          newEntry: {
            entryId: "skill-2",
            group: "Tools",
            content: "Supabase"
          },
          createdSection: false,
          sectionDidNotExistBefore: false
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "add to missing section",
      {
        sectionOrder: ["education", "skills"],
        personalInfo: createResume().personalInfo,
        education: createResume().education,
        skills: createResume().skills
      } satisfies ResumeData,
      [
        {
          operation: "add",
          entity: "projects",
          newEntry: createResume().projects!.entries[0]!,
          createdSection: true,
          sectionDidNotExistBefore: true
        }
      ] satisfies AiResumeEditOutput[]
    ],
    [
      "entry and section reorder",
      createResume(),
      [
        {
          operation: "reorderEntries",
          entity: "education",
          orderedEntryIds: ["edu-2", "edu-1"],
          originalValue: ["edu-1", "edu-2"]
        },
        {
          operation: "reorderSections",
          entity: null,
          orderedSectionIds: ["skills", "projects", "education"],
          originalValue: ["education", "projects", "skills"]
        }
      ] satisfies AiResumeEditOutput[]
    ]
  ])("round-trips %s", (_caseName, baseResume, outputs) => {
    const replayedResume = replayAiResumeEdits(baseResume, outputs)
    const revertedResume = revertAiResumeEdits(replayedResume, outputs)

    expect(revertedResume).toEqual(baseResume)
  })
})
