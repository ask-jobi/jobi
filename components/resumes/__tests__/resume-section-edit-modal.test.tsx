/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { ResumeSectionEditModal } from "../resume-section-edit-modal"
import { applicationAtom, editModalOpenAtom } from "@/lib/store/resume"
import {
  selectedEntryIdAtom,
  selectedEntryIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume-editor-state"
import type { ResumeData } from "@/types/resume"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

vi.mock("../resume-section-form", () => ({
  ResumeSectionForm: ({
    sectionId,
    entryIndex,
    onCancel,
    onSaveEntry
  }: {
    sectionId: string | null
    entryIndex?: number | null
    onCancel: () => void
    onSaveEntry: (values: unknown) => void | Promise<void>
  }) => (
    <div>
      <div>
        section-form-{sectionId}-{String(entryIndex)}
      </div>
      <button type="button" onClick={() => onCancel()}>
        Cancel Form
      </button>
      <button
        type="button"
        onClick={() =>
          onSaveEntry({
            entryId: "edu-1",
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: "Saved"
          })
        }
      >
        Save Form
      </button>
    </div>
  )
}))

function renderModal(store = createStore()) {
  return render(
    <Provider store={store}>
      <ResumeSectionEditModal />
    </Provider>
  )
}

describe("ResumeSectionEditModal", () => {
  it("renders the selected section form while open", () => {
    const store = createStore()
    saveApplicationResumeChangeMock.mockImplementation(
      async (_resumeId: string, nextResume: ResumeData) => ({
        resume: nextResume,
        currentRevision: 1
      })
    )
    store.set(applicationAtom, {
      id: "app-1",
      resume: {
        id: "resume-1",
        language: "en",
        evaluation_report: null,
        evaluation_report_refresh_flag: false,
        current_revision: 1,
        resume_json: {
          sectionOrder: ["employment", "skills"],
          personalInfo: {
            entryId: "pi-1",
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
          },
          employment: {
            entries: [
              {
                entryId: "emp-1",
                company: "A",
                jobTitle: "A",
                start: "2020-01",
                end: "2020-12",
                content: ""
              },
              {
                entryId: "emp-2",
                company: "B",
                jobTitle: "B",
                start: "2021-01",
                end: "2021-12",
                content: ""
              }
            ]
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
    store.set(editModalOpenAtom, true)
    store.set(selectedSectionIdAtom, "employment")
    store.set(selectedEntryIdAtom, "emp-2")

    renderModal(store)

    expect(screen.getByText("employment")).toBeInTheDocument()
    expect(screen.getByText("section-form-employment-1")).toBeInTheDocument()
  })

  it("clears the selected section when the modal closes", () => {
    const store = createStore()
    saveApplicationResumeChangeMock.mockImplementation(
      async (_resumeId: string, nextResume: ResumeData) => ({
        resume: nextResume,
        currentRevision: 1
      })
    )
    store.set(applicationAtom, {
      id: "app-1",
      resume: {
        id: "resume-1",
        language: "en",
        evaluation_report: null,
        evaluation_report_refresh_flag: false,
        current_revision: 1,
        resume_json: {
          sectionOrder: ["education", "skills"],
          personalInfo: {
            entryId: "pi-1",
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
    store.set(editModalOpenAtom, true)
    store.set(selectedSectionIdAtom, "skills")
    store.set(selectedEntryIdAtom, null)
    store.set(selectedEntryIndexAtom, 0)

    renderModal(store)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(store.get(editModalOpenAtom)).toBe(false)
    expect(store.get(selectedSectionIdAtom)).toBeNull()
    expect(store.get(selectedEntryIdAtom)).toBeNull()
  })

  it("does not mutate the persisted resume when a create-entry modal is cancelled", async () => {
    const store = createStore()
    saveApplicationResumeChangeMock.mockImplementation(
      async (_resumeId: string, nextResume: ResumeData) => ({
        resume: nextResume,
        currentRevision: 1
      })
    )
    const originalResume: ResumeData = {
      sectionOrder: ["education", "skills"],
      personalInfo: {
        entryId: "pi-1",
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

    store.set(applicationAtom, {
      id: "app-1",
      resume: {
        id: "resume-1",
        language: "en",
        evaluation_report: null,
        evaluation_report_refresh_flag: false,
        current_revision: 1,
        resume_json: originalResume
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })
    store.set(editModalOpenAtom, true)
    store.set(selectedSectionIdAtom, "education")
    store.set(selectedEntryIdAtom, null)
    store.set(selectedEntryIndexAtom, 0)

    renderModal(store)

    fireEvent.click(screen.getByRole("button", { name: "Cancel Form" }))

    await waitFor(() => {
      expect(
        store.get(applicationAtom)?.resume.resume_json.education?.entries
      ).toHaveLength(0)
      expect(store.get(editModalOpenAtom)).toBe(false)
      expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
    })
  })

  it("keeps the modal open and the persisted resume unchanged until save succeeds", async () => {
    const store = createStore()
    let resolveSave!: (value: {
      resume: ResumeData
      currentRevision: number
    }) => void
    saveApplicationResumeChangeMock.mockImplementation(
      () =>
        new Promise<{ resume: ResumeData; currentRevision: number }>(
          (resolve) => {
            resolveSave = resolve
          }
        )
    )

    const originalResume: ResumeData = {
      sectionOrder: ["education", "skills"],
      personalInfo: {
        entryId: "pi-1",
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      },
      education: {
        entries: [
          {
            entryId: "edu-1",
            school: "Old School",
            degree: "Old Degree",
            start: "2019-01",
            end: "2020-01",
            content: "Old"
          }
        ]
      },
      skills: {
        entries: []
      }
    }

    const savedResume: ResumeData = {
      ...originalResume,
      education: {
        ...originalResume.education,
        entries: [
          {
            entryId: "edu-1",
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: "Saved"
          }
        ]
      }
    }

    store.set(applicationAtom, {
      id: "app-1",
      resume: {
        id: "resume-1",
        language: "en",
        evaluation_report: null,
        evaluation_report_refresh_flag: false,
        current_revision: 1,
        resume_json: originalResume
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })
    store.set(editModalOpenAtom, true)
    store.set(selectedSectionIdAtom, "education")
    store.set(selectedEntryIdAtom, "edu-1")
    store.set(selectedEntryIndexAtom, 0)

    renderModal(store)

    fireEvent.click(screen.getByRole("button", { name: "Save Form" }))

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith(
        "resume-1",
        savedResume
      )
    })

    expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
      originalResume
    )
    expect(store.get(editModalOpenAtom)).toBe(true)

    resolveSave({ resume: savedResume, currentRevision: 2 })

    await waitFor(() => {
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
        savedResume
      )
      expect(store.get(editModalOpenAtom)).toBe(false)
    })
  })
})
