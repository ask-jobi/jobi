/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ResumeEditor } from "../resume-editor"
import { applicationAtom } from "@/lib/store/resume"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"
import type { ResumeData } from "@/types/resume"

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

vi.mock("@/lib/hooks/use-resume-template", () => ({
  useResumeTemplate: () => ({
    Template: ({
      data,
      options
    }: {
      data: ResumeData | null
      options?: {
        isInteractive?: boolean
        onEntryDelete?: (id: "projects" | "education", index: number) => void
      }
    }) => {
      if (!data) {
        return null
      }

      return (
        <>
          {data.education && (
            <section data-testid="section-education">
              {data.education.entries.map((entry, index) => (
                <ResumeSectionActionButtonGroup
                  key={entry.entryId}
                  isInteractive={options?.isInteractive}
                  onDelete={() => options?.onEntryDelete?.("education", index)}
                >
                  <div>education-{entry.entryId}</div>
                </ResumeSectionActionButtonGroup>
              ))}
            </section>
          )}
          {data.projects && (
            <section data-testid="section-projects">
              {data.projects.entries.map((entry, index) => (
                <ResumeSectionActionButtonGroup
                  key={entry.entryId}
                  isInteractive={options?.isInteractive}
                  onDelete={() => options?.onEntryDelete?.("projects", index)}
                >
                  <div>projects-{entry.entryId}</div>
                </ResumeSectionActionButtonGroup>
              ))}
            </section>
          )}
        </>
      )
    }
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

describe("ResumeEditor delete entry", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        disconnect() {}
        observe() {}
        unobserve() {}
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("removes an optional section only after delete confirmation and a successful save", async () => {
    let resolveSave!: () => void
    saveApplicationResumeChangeMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    const store = createStore()
    const originalResume: ResumeData = {
      sectionOrder: ["education", "projects", "skills"],
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
      projects: {
        entries: [
          {
            entryId: "project-1",
            title: "Project 1",
            role: "Lead",
            date: {
              start: "2020-01",
              end: "2021-01"
            },
            content: "Built stuff"
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

    const sectionSurface = screen.getByText("projects-project-1").parentElement
    expect(sectionSurface).not.toBeNull()

    fireEvent.mouseEnter(sectionSurface!)
    const deleteButton = screen.getByRole("button", { name: "deleteEntry" })

    fireEvent.click(deleteButton)

    expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
    expect(screen.getByRole("tooltip")).toHaveTextContent("confirmDeleteEntry")
    expect(screen.getByTestId("section-projects")).toBeInTheDocument()

    fireEvent.click(deleteButton)

    const expectedResume: ResumeData = {
      ...originalResume,
      sectionOrder: ["education", "skills"],
      projects: undefined
    }

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith(
        "resume-1",
        expectedResume
      )
    })

    expect(screen.getByTestId("section-projects")).toBeInTheDocument()
    expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
      originalResume
    )

    await act(async () => {
      resolveSave()
    })

    await waitFor(() => {
      expect(screen.queryByTestId("section-projects")).not.toBeInTheDocument()
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
        expectedResume
      )
    })
  })

  it("removes the section after deleting its last entry", async () => {
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
            content: "A"
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

    const sectionSurface = screen.getByText("education-edu-1").parentElement
    expect(sectionSurface).not.toBeNull()

    fireEvent.mouseEnter(sectionSurface!)
    const deleteButton = screen.getByRole("button", { name: "deleteEntry" })

    fireEvent.click(deleteButton)
    fireEvent.click(deleteButton)

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

    expect(screen.getByTestId("section-education")).toBeInTheDocument()
    expect(screen.getByText("education-edu-1")).toBeInTheDocument()

    await act(async () => {
      resolveSave()
    })

    await waitFor(() => {
      expect(screen.queryByTestId("section-education")).not.toBeInTheDocument()
      expect(screen.queryByText("education-edu-1")).not.toBeInTheDocument()
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
        expectedResume
      )
    })
  })
})
