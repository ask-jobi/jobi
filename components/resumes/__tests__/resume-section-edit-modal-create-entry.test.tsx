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
import { normalizeResumeDateRanges } from "@/lib/resume/date-ranges"

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
            entryId: "edu-2",
            school: "School 2",
            degree: "Degree 2",
            date: { start: "2021-01", end: "2022-01", isCurrent: false },
            content: "Created"
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

describe("ResumeSectionEditModal create entry", () => {
  it("inserts the saved entry into the persisted resume only after save succeeds", async () => {
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
            school: "School 1",
            degree: "Degree 1",
            date: { start: "2020-01", end: "2021-01", isCurrent: false },
            content: ""
          }
        ]
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
    store.set(selectedEntryIndexAtom, 1)

    renderModal(store)

    fireEvent.click(screen.getByRole("button", { name: "Save Form" }))

    const expectedResume: ResumeData = {
      ...originalResume,
      education: {
        ...originalResume.education!,
        entries: [
          originalResume.education!.entries[0],
          {
            entryId: "edu-2",
            school: "School 2",
            degree: "Degree 2",
            date: { start: "2021-01", end: "2022-01", isCurrent: false },
            content: "Created"
          }
        ]
      }
    }
    const normalizedExpectedResume = normalizeResumeDateRanges(expectedResume)

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith(
        "resume-1",
        normalizedExpectedResume,
        { baseRevision: 1 }
      )
    })

    expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
      originalResume
    )
    expect(store.get(editModalOpenAtom)).toBe(true)

    resolveSave({ resume: normalizedExpectedResume, currentRevision: 2 })

    await waitFor(() => {
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
        normalizedExpectedResume
      )
      expect(store.get(editModalOpenAtom)).toBe(false)
    })
  })
})
