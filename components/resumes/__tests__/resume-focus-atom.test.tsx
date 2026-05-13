/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createStore } from "jotai"
import {
  applicationAtom,
  focusSectionAtom,
  selectedBlockIdAtom,
  selectedBlockIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"

describe("focusSectionAtom", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
    vi.useFakeTimers()
  })

  it("should keep the left resume canvas still while scrolling the form", () => {
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
            sectionId: "education",
            title: "Education",
            blocks: [
              {
                blockId: "edu-1",
                school: "School 1",
                degree: "Degree 1",
                start: "2020-01",
                end: "2021-01",
                content: ""
              },
              {
                blockId: "edu-2",
                school: "School 2",
                degree: "Degree 2",
                start: "2021-01",
                end: "2022-01",
                content: ""
              }
            ]
          },
          skills: {
            sectionId: "skills",
            title: "Skills",
            blocks: []
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
    const sectionElement = document.createElement("div")
    const formElement = document.createElement("div")
    const sectionScrollIntoView = vi.fn()
    const formScrollIntoView = vi.fn()

    sectionElement.id = "section-education-1"
    formElement.id = "form-education-1"
    sectionElement.scrollIntoView = sectionScrollIntoView
    formElement.scrollIntoView = formScrollIntoView

    document.body.append(sectionElement, formElement)

    store.set(focusSectionAtom, "education", 1)
    vi.runAllTimers()

    expect(store.get(selectedSectionIdAtom)).toBe("education")
    expect(store.get(selectedBlockIndexAtom)).toBe(1)
    expect(store.get(selectedBlockIdAtom)).toBe("edu-2")
    expect(sectionScrollIntoView).not.toHaveBeenCalled()
    expect(formScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start"
    })
  })

  it("should scroll to the section form root when no block index is provided", () => {
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
            sectionId: "education",
            title: "Education",
            blocks: []
          },
          skills: {
            sectionId: "skills",
            title: "Skills",
            blocks: []
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
    const formElement = document.createElement("div")
    const formScrollIntoView = vi.fn()

    formElement.id = "form-personalInfo"
    formElement.scrollIntoView = formScrollIntoView

    document.body.append(formElement)

    store.set(focusSectionAtom, "personalInfo")
    vi.runAllTimers()

    expect(store.get(selectedSectionIdAtom)).toBe("personalInfo")
    expect(store.get(selectedBlockIdAtom)).toBeNull()
    expect(store.get(selectedBlockIndexAtom)).toBeNull()
    expect(formScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start"
    })
  })
})
