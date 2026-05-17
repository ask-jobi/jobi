/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { ResumeSectionEditModal } from "../resume-section-edit-modal"
import {
  applicationAtom,
  editModalOpenAtom,
  editModalRollbackResumeAtom,
  selectedEntryIdAtom,
  selectedEntryIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"
import type { ResumeData } from "@/types/resume"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) => saveApplicationResumeChangeMock(...args)
}))

vi.mock("../resume-section-form", () => ({
  ResumeSectionForm: ({
    sectionId,
    entryIndex,
    onCancel,
    onSaveComplete
  }: {
    sectionId: string | null
    entryIndex?: number | null
    onCancel?: () => void
    onSaveComplete?: () => void
  }) => (
    <div>
      <div>
        section-form-{sectionId}-{String(entryIndex)}
      </div>
      <button type="button" onClick={() => onCancel?.()}>
        Cancel Form
      </button>
      <button type="button" onClick={() => onSaveComplete?.()}>
        Save Form
      </button>
    </div>
  )
}))

function renderWithForm(store = createStore(), defaultValues?: ResumeData) {
  function DraftObserver() {
    const { watch } = useFormContext<ResumeData>()
    const educationBlocks = watch("education.entries")

    return (
      <div data-testid="draft-education-block-count">
        {educationBlocks?.length ?? 0}
      </div>
    )
  }

  function Wrapper() {
    const methods = useForm<ResumeData>({
      defaultValues:
        defaultValues ??
        store.get(applicationAtom)?.resume.resume_json ??
        ({
          sectionOrder: ["education", "skills"],
          personalInfo: {
            blockId: "pi-1",
            firstName: "",
            lastName: "",
            email: "",
            phone: ""
          },
          education: {
            title: "Education",
            entries: []
          },
          skills: {
            title: "Skills",
            entries: []
          }
        } satisfies ResumeData)
    })

    return (
      <Provider store={store}>
        <FormProvider {...methods}>
          <DraftObserver />
          <ResumeSectionEditModal />
        </FormProvider>
      </Provider>
    )
  }

  return render(<Wrapper />)
}

describe("ResumeSectionEditModal", () => {
  it("renders the selected section form while open", () => {
    const store = createStore()
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    store.set(applicationAtom, {
      id: "app-1",
      resume: {
        id: "resume-1",
        language: "en",
        evaluation_report: null,
        evaluation_report_refresh_flag: false,
        resume_json: {
          sectionOrder: ["employment", "skills"],
          personalInfo: {
            blockId: "pi-1",
            firstName: "",
            lastName: "",
            email: "",
            phone: ""
          },
          education: {
            title: "Education",
            entries: []
          },
          skills: {
            title: "Skills",
            entries: []
          },
          employment: {
            title: "Employment",
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

    renderWithForm(store)

    expect(screen.getByText("employment")).toBeInTheDocument()
    expect(screen.getByText("section-form-employment-1")).toBeInTheDocument()
  })

  it("clears the selected section when the modal closes", () => {
    const store = createStore()
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    store.set(editModalOpenAtom, true)
    store.set(selectedSectionIdAtom, "skills")
    store.set(selectedEntryIdAtom, null)

    renderWithForm(store)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(store.get(editModalOpenAtom)).toBe(false)
    expect(store.get(selectedSectionIdAtom)).toBeNull()
    expect(store.get(selectedEntryIdAtom)).toBeNull()
  })

  it("rolls back a newly added draft block when the form is cancelled without saving", async () => {
    const store = createStore()
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    const originalResume: ResumeData = {
      sectionOrder: ["education", "skills"],
      personalInfo: {
        blockId: "pi-1",
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      },
      education: {
        title: "Education",
        entries: []
      },
      skills: {
        title: "Skills",
        entries: []
      }
    }
    const draftResume: ResumeData = {
      ...originalResume,
      education: {
        ...originalResume.education,
        entries: [
          {
            entryId: "edu-1",
            school: "",
            degree: "",
            start: "",
            end: "",
            content: ""
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
    store.set(editModalRollbackResumeAtom, originalResume)
    store.set(selectedSectionIdAtom, "education")
    store.set(selectedEntryIdAtom, "edu-1")
    store.set(selectedEntryIndexAtom, 0)

    renderWithForm(store, draftResume)

    fireEvent.click(screen.getByRole("button", { name: "Cancel Form" }))

    await waitFor(() => {
      expect(
        screen.getByTestId("draft-education-block-count")
      ).toHaveTextContent("0")
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.entries
      ).toHaveLength(0)
      expect(store.get(editModalRollbackResumeAtom)).toBeNull()
      expect(store.get(editModalOpenAtom)).toBe(false)
      expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
    })
  })

  it("commits the draft when the form is saved", async () => {
    const store = createStore()
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    const originalResume: ResumeData = {
      sectionOrder: ["education", "skills"],
      personalInfo: {
        blockId: "pi-1",
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      },
      education: {
        title: "Education",
        entries: []
      },
      skills: {
        title: "Skills",
        entries: []
      }
    }
    const draftResume: ResumeData = {
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

    renderWithForm(store, draftResume)

    fireEvent.click(screen.getByRole("button", { name: "Save Form" }))

    await waitFor(() => {
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.entries
      ).toHaveLength(1)
      expect(store.get(editModalOpenAtom)).toBe(false)
      expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith("resume-1", draftResume)
    })
  })
})
