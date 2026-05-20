/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useEntryEditWorkflow } from "@/lib/hooks/use-entry-edit-workflow"
import { applicationAtom } from "@/lib/store/resume"
import { chatThreadLifecycleAtom } from "@/lib/store/chat"
import type { ResumeData } from "@/types/resume"

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

function WorkflowHarness() {
  const {
    reorderAndPersistEntry,
    moveSectionAndPersist,
    isEntryReorderPending,
    isSectionReorderPending
  } = useEntryEditWorkflow()

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void reorderAndPersistEntry("education", 0, 2)
        }}
      >
        Reorder Education
      </button>
      <button
        type="button"
        onClick={() => {
          void reorderAndPersistEntry("education", 1, 1)
        }}
      >
        Reorder Education Noop
      </button>
      <button
        type="button"
        onClick={() => {
          void moveSectionAndPersist("skills", "up")
        }}
      >
        Move Skills Up
      </button>
      <button
        type="button"
        onClick={() => {
          void moveSectionAndPersist("education", "up")
        }}
      >
        Move Education Up Noop
      </button>
      <div id="section-education">Education section</div>
      <div id="section-employment">Employment section</div>
      <div id="section-skills">Skills section</div>
      <div data-testid="reorder-pending">{String(isEntryReorderPending)}</div>
      <div data-testid="section-reorder-pending">
        {String(isSectionReorderPending)}
      </div>
    </>
  )
}

function createResume(): ResumeData {
  return {
    sectionOrder: ["education", "employment", "skills"],
    personalInfo: {
      entryId: "pi-1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "123"
    },
    education: {
      entries: [
        {
          entryId: "edu-1",
          school: "School 1",
          degree: "Degree 1",
          start: "2020-01",
          end: "2021-01",
          content: "One"
        },
        {
          entryId: "edu-2",
          school: "School 2",
          degree: "Degree 2",
          start: "2021-01",
          end: "2022-01",
          content: "Two"
        },
        {
          entryId: "edu-3",
          school: "School 3",
          degree: "Degree 3",
          start: "2022-01",
          end: "2023-01",
          content: "Three"
        }
      ]
    },
    employment: {
      entries: [
        {
          entryId: "job-1",
          company: "Acme",
          jobTitle: "Engineer",
          start: "2023-01",
          end: "2024-01",
          content: "Built stuff"
        }
      ]
    },
    skills: {
      entries: [
        {
          entryId: "skill-1",
          group: "Languages",
          content: "TypeScript"
        }
      ]
    }
  }
}

function renderHarness(store = createStore(), resume = createResume()) {
  store.set(applicationAtom, {
    id: "app-1",
    resume: {
      id: "resume-1",
      language: "en",
      evaluation_report: null,
      evaluation_report_refresh_flag: false,
      resume_json: resume
    },
    job: {
      id: "job-1",
      name: "",
      company: "",
      description: ""
    }
  })

  const view = render(
    <Provider store={store}>
      <WorkflowHarness />
    </Provider>
  )

  return { store, resume, ...view }
}

describe("useEntryEditWorkflow reorderAndPersistEntry", () => {
  beforeEach(() => {
    saveApplicationResumeChangeMock.mockReset()
    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn()
    })
  })

  it("optimistically reorders entries, then rolls back when saving fails", async () => {
    let rejectSave!: (error?: unknown) => void
    saveApplicationResumeChangeMock.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSave = reject
        })
    )

    const { store, resume } = renderHarness()

    fireEvent.click(screen.getByRole("button", { name: "Reorder Education" }))

    await waitFor(() => {
      expect(
        store
          .get(applicationAtom)
          ?.resume.resume_json.education?.entries.map((entry) => entry.entryId)
      ).toEqual(["edu-2", "edu-3", "edu-1"])
    })

    expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith("resume-1", {
      ...resume,
      education: {
        entries: [
          resume.education?.entries[1],
          resume.education?.entries[2],
          resume.education?.entries[0]
        ]
      }
    })
    expect(screen.getByTestId("reorder-pending")).toHaveTextContent("true")

    await act(async () => {
      rejectSave(new Error("boom"))
    })

    await waitFor(() => {
      expect(
        store
          .get(applicationAtom)
          ?.resume.resume_json.education?.entries.map((entry) => entry.entryId)
      ).toEqual(["edu-1", "edu-2", "edu-3"])
    })
    expect(screen.getByTestId("reorder-pending")).toHaveTextContent("false")
  })

  it("skips saving when the drop keeps the entry in place", async () => {
    const { store, resume } = renderHarness()

    fireEvent.click(
      screen.getByRole("button", { name: "Reorder Education Noop" })
    )

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(resume)
      expect(screen.getByTestId("reorder-pending")).toHaveTextContent("false")
    })
  })

  it("does not start a manual reorder while an AI resume action is running", async () => {
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    const store = createStore()
    store.set(chatThreadLifecycleAtom, "running")
    const resume = createResume()

    renderHarness(store, resume)

    fireEvent.click(screen.getByRole("button", { name: "Reorder Education" }))

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(resume)
      expect(screen.getByTestId("reorder-pending")).toHaveTextContent("false")
    })
  })

  it("optimistically reorders sections, then rolls back when saving fails", async () => {
    let rejectSave!: (error?: unknown) => void
    saveApplicationResumeChangeMock.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSave = reject
        })
    )

    const { store, resume } = renderHarness()

    fireEvent.click(screen.getByRole("button", { name: "Move Skills Up" }))

    await waitFor(() => {
      expect(
        store.get(applicationAtom)?.resume.resume_json.sectionOrder
      ).toEqual(["education", "skills", "employment"])
    })

    expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith("resume-1", {
      ...resume,
      sectionOrder: ["education", "skills", "employment"]
    })
    expect(screen.getByTestId("section-reorder-pending")).toHaveTextContent(
      "true"
    )

    await act(async () => {
      rejectSave(new Error("boom"))
    })

    await waitFor(() => {
      expect(
        store.get(applicationAtom)?.resume.resume_json.sectionOrder
      ).toEqual(["education", "employment", "skills"])
    })
    expect(screen.getByTestId("section-reorder-pending")).toHaveTextContent(
      "false"
    )
  })

  it("scrolls the moved section back into view after a successful save", async () => {
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    const scrollIntoViewMock = vi.mocked(
      window.HTMLElement.prototype.scrollIntoView
    )

    renderHarness()

    fireEvent.click(screen.getByRole("button", { name: "Move Skills Up" }))

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "nearest"
      })
      expect(screen.getByTestId("section-reorder-pending")).toHaveTextContent(
        "false"
      )
    })
  })

  it("skips saving when the section cannot move further", async () => {
    const { store, resume } = renderHarness()

    fireEvent.click(
      screen.getByRole("button", { name: "Move Education Up Noop" })
    )

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(resume)
      expect(screen.getByTestId("section-reorder-pending")).toHaveTextContent(
        "false"
      )
    })
  })
})
