/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { ResumeEditor } from "../resume-editor"
import { applicationAtom, editModalOpenAtom } from "@/lib/store/resume"
import {
  selectedEntryIdAtom,
  selectedEntryIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume-editor-state"
import { chatThreadLifecycleAtom } from "@/lib/store/chat"
import type { ResumeData } from "@/types/resume"

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
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
  return render(
    <Provider store={store}>
      <ResumeEditor />
    </Provider>
  )
}

describe("ResumeEditor add entry", () => {
  it("opens the modal for a new entry without mutating the persisted resume", async () => {
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    const store = createStore()
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
            start: "2020-01",
            end: "2021-01",
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
      expect(store.get(selectedEntryIdAtom)).toBeNull()
      expect(
        store.get(applicationAtom)?.resume.resume_json.education?.entries
      ).toHaveLength(1)
    })
  })

  it("does not open the modal for manual editing while an AI edit is running", async () => {
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    const store = createStore()
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
            start: "2020-01",
            end: "2021-01",
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
        resume_json: originalResume
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })
    store.set(chatThreadLifecycleAtom, "running")

    renderEditor(store)

    fireEvent.click(screen.getByRole("button", { name: "Trigger Add Entry" }))

    await waitFor(() => {
      expect(store.get(editModalOpenAtom)).toBe(false)
      expect(store.get(selectedSectionIdAtom)).toBeNull()
      expect(store.get(selectedEntryIndexAtom)).toBeNull()
      expect(store.get(selectedEntryIdAtom)).toBeNull()
      expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
    })
  })

  it("keeps the persisted resume unchanged until entry deletion save succeeds", async () => {
    let resolveSave!: () => void
    saveApplicationResumeChangeMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )
    const store = createStore()
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
            start: "2020-01",
            end: "2021-01",
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

    const expectedResume: ResumeData = {
      ...originalResume,
      education: undefined,
      sectionOrder: ["skills"]
    }

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith(
        "resume-1",
        expectedResume
      )
    })

    expect(
      store.get(applicationAtom)?.resume.resume_json.education?.entries
    ).toHaveLength(1)

    resolveSave()

    await waitFor(() => {
      expect(
        store.get(applicationAtom)?.resume.resume_json.education
      ).toBeUndefined()
      expect(
        store.get(applicationAtom)?.resume.resume_json.sectionOrder
      ).toEqual(["skills"])
    })
  })
})
