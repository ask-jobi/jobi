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
  const { reorderAndPersistEntry, isEntryReorderPending } =
    useEntryEditWorkflow()

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
      <div data-testid="reorder-pending">{String(isEntryReorderPending)}</div>
    </>
  )
}

function createResume(): ResumeData {
  return {
    sectionOrder: ["education", "skills"],
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
    skills: {
      entries: []
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
          ?.resume.resume_json.education.entries.map((entry) => entry.entryId)
      ).toEqual(["edu-2", "edu-3", "edu-1"])
    })

    expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith("resume-1", {
      ...resume,
      education: {
        entries: [
          resume.education.entries[1],
          resume.education.entries[2],
          resume.education.entries[0]
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
          ?.resume.resume_json.education.entries.map((entry) => entry.entryId)
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
})
