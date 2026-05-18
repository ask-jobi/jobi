/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createStore } from "jotai"
import { applicationAtom } from "@/lib/store/resume"
import {
  focusSectionAtom,
  selectedEntryIdAtom,
  selectedEntryIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume-editor-state"

describe("focusSectionAtom", () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it("updates selection for a block target without touching DOM scrolling", () => {
    const store = createStore()
    const scrollTarget = document.createElement("div")
    scrollTarget.id = "form-education-1"
    scrollTarget.scrollIntoView = vi.fn()
    document.body.appendChild(scrollTarget)

    store.set(applicationAtom, {
      id: "app-1",
      resume: {
        id: "resume-1",
        language: "en",
        evaluation_report: null,
        evaluation_report_refresh_flag: false,
        resume_json: {
          sectionOrder: ["education", "skills"],
          personalInfo: {
            blockId: "pi-1",
            firstName: "",
            lastName: "",
            email: "",
            phone: ""
          },
          education: {
            entries: [
              {
                entryId: "edu-1",
                school: "School 1",
                degree: "Degree 1",
                start: "2020-01",
                end: "2021-01",
                content: ""
              },
              {
                entryId: "edu-2",
                school: "School 2",
                degree: "Degree 2",
                start: "2021-01",
                end: "2022-01",
                content: ""
              }
            ]
          },
          skills: {
            entries: []
          }
        }
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })

    store.set(focusSectionAtom, "education", 1)

    expect(store.get(selectedSectionIdAtom)).toBe("education")
    expect(store.get(selectedEntryIndexAtom)).toBe(1)
    expect(store.get(selectedEntryIdAtom)).toBe("edu-2")
    expect(scrollTarget.scrollIntoView).not.toHaveBeenCalled()
  })

  it("updates section selection when no block index is provided", () => {
    const store = createStore()
    store.set(applicationAtom, {
      id: "app-1",
      resume: {
        id: "resume-1",
        language: "en",
        evaluation_report: null,
        evaluation_report_refresh_flag: false,
        resume_json: {
          sectionOrder: ["education", "skills"],
          personalInfo: {
            blockId: "pi-1",
            firstName: "",
            lastName: "",
            email: "",
            phone: ""
          },
          education: {
            entries: []
          },
          skills: {
            entries: []
          }
        }
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })

    store.set(focusSectionAtom, "personalInfo")

    expect(store.get(selectedSectionIdAtom)).toBe("personalInfo")
    expect(store.get(selectedEntryIdAtom)).toBeNull()
    expect(store.get(selectedEntryIndexAtom)).toBeNull()
  })
})
