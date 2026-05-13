/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { ResumeSectionEditModal } from "../resume-section-edit-modal"
import {
  applicationAtom,
  editModalOpenAtom,
  selectedBlockIdAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("../resume-section-form", () => ({
  ResumeSectionForm: ({
    sectionId,
    blockIndex
  }: {
    sectionId: string | null
    blockIndex?: number | null
  }) => <div>section-form-{sectionId}-{String(blockIndex)}</div>
}))

describe("ResumeSectionEditModal", () => {
  it("renders the selected section form while open", () => {
    const store = createStore()
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

    render(
      <Provider store={store}>
        <ResumeSectionEditModal />
      </Provider>
    )

    expect(screen.getByText("employment")).toBeInTheDocument()
    expect(
      screen.getByText("section-form-employment-1")
    ).toBeInTheDocument()
  })

  it("clears the selected section when the modal closes", () => {
    const store = createStore()
    store.set(editModalOpenAtom, true)
    store.set(selectedSectionIdAtom, "skills")
    store.set(selectedBlockIdAtom, null)

    render(
      <Provider store={store}>
        <ResumeSectionEditModal />
      </Provider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(store.get(editModalOpenAtom)).toBe(false)
    expect(store.get(selectedSectionIdAtom)).toBeNull()
    expect(store.get(selectedBlockIdAtom)).toBeNull()
  })
})
