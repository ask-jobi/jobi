/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { ResumeEditor } from "../resume-editor"
import {
  applicationAtom,
  editModalOpenAtom,
  editModalRollbackResumeAtom,
  selectedEntryIdAtom,
  selectedEntryIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"
import type { ResumeData } from "@/types/resume"

const saveResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveResumeChange: (...args: unknown[]) => saveResumeChangeMock(...args)
}))

vi.mock("@/lib/hooks/use-resume-template", () => ({
  useResumeTemplate: () => ({
    Template: ({
      options
    }: {
      options?: {
        onEntryAdd?: (id: "education", index: number) => void
        onEntryDelete?: (id: "education", index: number) => void
      }
    }) => (
      <>
        <button
          type="button"
          onClick={() => options?.onEntryAdd?.("education", 0)}
        >
          Trigger Add Entry
        </button>
        <button
          type="button"
          onClick={() => options?.onEntryDelete?.("education", 0)}
        >
          Trigger Delete Entry
        </button>
      </>
    )
  })
}))

vi.mock("@/lib/hooks/use-section-click", () => ({
  useSectionClickHandler: () => vi.fn()
}))

vi.mock("@/components/resumes/resume-canvas-section-entry", () => ({
  ResumeCanvasSectionEntry: () => null,
  isResumeCanvasEmpty: () => false
}))

function renderEditor(store = createStore()) {
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
      defaultValues: store.get(applicationAtom)?.resume.resume_json
    })

    return (
      <Provider store={store}>
        <FormProvider {...methods}>
          <DraftObserver />
          <ResumeEditor />
        </FormProvider>
      </Provider>
    )
  }

  return render(<Wrapper />)
}

describe("ResumeEditor add entry", () => {
  it("adds the entry to the draft before opening the modal without mutating persisted resume", async () => {
    saveResumeChangeMock.mockResolvedValue(undefined)
    const store = createStore()
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
        entries: [
          {
            entryId: "edu-1",
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: ""
          }
        ]
      },
      skills: {
        title: "Skills",
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
        resume_json: originalResume
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })

    renderEditor(store)

    fireEvent.click(screen.getByRole("button", { name: "Trigger Add Entry" }))

    await waitFor(() => {
      expect(store.get(editModalOpenAtom)).toBe(true)
      expect(store.get(selectedSectionIdAtom)).toBe("education")
      expect(store.get(selectedEntryIndexAtom)).toBe(1)
      expect(store.get(selectedEntryIdAtom)).toBeTruthy()
      expect(store.get(editModalRollbackResumeAtom)).toEqual(originalResume)
      expect(
        screen.getByTestId("draft-education-block-count")
      ).toHaveTextContent("2")
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.entries
      ).toHaveLength(1)
    })
  })

  it("persists entry deletion immediately after updating the draft", async () => {
    saveResumeChangeMock.mockResolvedValue(undefined)
    const store = createStore()
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
        entries: [
          {
            entryId: "edu-1",
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: ""
          }
        ]
      },
      skills: {
        title: "Skills",
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
        resume_json: originalResume
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })

    renderEditor(store)

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger Delete Entry" })
    )

    await waitFor(() => {
      expect(
        screen.getByTestId("draft-education-block-count")
      ).toHaveTextContent("0")
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.entries
      ).toHaveLength(0)
      expect(saveResumeChangeMock).toHaveBeenCalledWith("resume-1", {
        ...originalResume,
        education: {
          ...originalResume.education,
          entries: []
        }
      })
    })
  })
})
