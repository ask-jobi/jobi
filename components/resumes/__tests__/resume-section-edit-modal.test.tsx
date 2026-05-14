/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { FormProvider, useForm } from "react-hook-form"
import { ResumeSectionEditModal } from "../resume-section-edit-modal"
import {
  applicationAtom,
  editModalOpenAtom,
  editModalRollbackResumeAtom,
  selectedBlockIdAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"
import type { ResumeData } from "@/types/resume"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

const saveResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveResumeChange: (...args: unknown[]) => saveResumeChangeMock(...args)
}))

vi.mock("../resume-section-form", () => ({
  ResumeSectionForm: ({
    sectionId,
    blockIndex,
    onCancel,
    onSaveComplete
  }: {
    sectionId: string | null
    blockIndex?: number | null
    onCancel?: () => void
    onSaveComplete?: () => void
  }) => (
    <div>
      <div>
        section-form-{sectionId}-{String(blockIndex)}
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

function renderWithForm(store = createStore()) {
  function Wrapper() {
    const methods = useForm<ResumeData>({
      defaultValues:
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
            sectionId: "education",
            title: "Education",
            blocks: []
          },
          skills: {
            sectionId: "skills",
            title: "Skills",
            blocks: []
          }
        } satisfies ResumeData)
    })

    return (
      <Provider store={store}>
        <FormProvider {...methods}>
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
    saveResumeChangeMock.mockResolvedValue(undefined)
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
            sectionId: "education",
            title: "Education",
            blocks: []
          },
          skills: {
            sectionId: "skills",
            title: "Skills",
            blocks: []
          },
          employment: {
            sectionId: "employment",
            title: "Employment",
            blocks: [
              {
                blockId: "emp-1",
                company: "A",
                jobTitle: "A",
                start: "2020-01",
                end: "2020-12",
                content: ""
              },
              {
                blockId: "emp-2",
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
    store.set(selectedBlockIdAtom, "emp-2")

    renderWithForm(store)

    expect(screen.getByText("employment")).toBeInTheDocument()
    expect(screen.getByText("section-form-employment-1")).toBeInTheDocument()
  })

  it("clears the selected section when the modal closes", () => {
    const store = createStore()
    saveResumeChangeMock.mockResolvedValue(undefined)
    store.set(editModalOpenAtom, true)
    store.set(selectedSectionIdAtom, "skills")
    store.set(selectedBlockIdAtom, null)

    renderWithForm(store)

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(store.get(editModalOpenAtom)).toBe(false)
    expect(store.get(selectedSectionIdAtom)).toBeNull()
    expect(store.get(selectedBlockIdAtom)).toBeNull()
  })

  it("rolls back a newly added draft block when the form is cancelled", async () => {
    const store = createStore()
    saveResumeChangeMock.mockResolvedValue(undefined)
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
    const draftResume: ResumeData = {
      ...originalResume,
      education: {
        ...originalResume.education,
        blocks: [
          {
            blockId: "edu-1",
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
        resume_json: draftResume
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
    store.set(selectedBlockIdAtom, "edu-1")

    renderWithForm(store)

    fireEvent.click(screen.getByRole("button", { name: "Cancel Form" }))

    await waitFor(() => {
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.blocks
      ).toHaveLength(0)
      expect(store.get(editModalRollbackResumeAtom)).toBeNull()
      expect(store.get(editModalOpenAtom)).toBe(false)
    })
  })
})
