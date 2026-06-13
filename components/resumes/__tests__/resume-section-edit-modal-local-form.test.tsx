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

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

vi.mock("@/components/editor/editor", () => ({
  Editor: ({
    markdown,
    onChange
  }: {
    markdown: string
    onChange?: (markdown: string) => void
  }) => (
    <textarea
      aria-label="Content"
      value={markdown}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}))

vi.mock("@/components/ui/monthrangepicker-form-field", () => ({
  MonthRangePickerFormField: ({ label }: { label?: string }) => (
    <div>{label}</div>
  )
}))

describe("ResumeSectionEditModal local form mode", () => {
  it("saves a real section form without requiring a page-level FormProvider", async () => {
    saveApplicationResumeChangeMock.mockImplementation(
      async (_resumeId: string, nextResume: ResumeData) => ({
        resume: nextResume,
        currentRevision: 1
      })
    )
    const store = createStore()

    const originalResume: ResumeData = {
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
      employment: {
        entries: [
          {
            entryId: "emp-1",
            company: "Old Company",
            jobTitle: "Engineer",
            start: "2021-09",
            end: "2022-02",
            content: "Original content"
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
    store.set(selectedSectionIdAtom, "employment")
    store.set(selectedEntryIdAtom, "emp-1")
    store.set(selectedEntryIndexAtom, 0)

    render(
      <Provider store={store}>
        <ResumeSectionEditModal />
      </Provider>
    )

    fireEvent.change(screen.getByDisplayValue("Old Company"), {
      target: { value: "New Company" }
    })
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "Updated content" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.save" }))

    const expectedResume: ResumeData = {
      ...originalResume,
      employment: {
        ...originalResume.employment!,
        entries: [
          {
            ...originalResume.employment!.entries[0],
            company: "New Company",
            content: "Updated content"
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
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
        normalizedExpectedResume
      )
      expect(store.get(editModalOpenAtom)).toBe(false)
    })
  })
})
