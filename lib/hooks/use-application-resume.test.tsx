/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore, useAtomValue } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { applicationAtom, useApplicationResume } from "@/lib/store/resume"
import type { JobApplication, ResumeData } from "@/types/resume"

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

function createResume(school: string): ResumeData {
  return {
    sectionOrder: ["education", "skills"],
    personalInfo: {
      entryId: "pi-1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "123"
    },
    education: {
      entries: [
        {
          entryId: "edu-1",
          school,
          degree: "BSc",
          content: "CS",
          start: "2024",
          end: "2024"
        }
      ]
    },
    skills: { entries: [] }
  }
}

function createApplication(
  resume: ResumeData,
  currentRevision: number
): JobApplication {
  return {
    id: "app-1",
    resume: {
      id: "resume-1",
      language: "en",
      resume_json: resume,
      current_revision: currentRevision,
      evaluation_report: null,
      evaluation_report_refresh_flag: false
    },
    job: {
      id: "job-1",
      name: "Engineer",
      company: "Acme",
      description: "Build things"
    }
  }
}

function ResumeSaveHarness({
  submittedResume
}: {
  submittedResume: ResumeData
}) {
  const { saveApplicationResume } = useApplicationResume()
  const application = useAtomValue(applicationAtom)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void saveApplicationResume(submittedResume)
        }}
      >
        Save Resume
      </button>
      <div data-testid="school">
        {application?.resume.resume_json.education?.entries[0]?.school}
      </div>
      <div data-testid="revision">{application?.resume.current_revision}</div>
    </>
  )
}

describe("useApplicationResume", () => {
  it("replaces local state with the authoritative resume and revision returned by save", async () => {
    const initialResume = createResume("Original School")
    const submittedResume = createResume("Locally Submitted School")
    const authoritativeResume = createResume("Authoritative School")

    saveApplicationResumeChangeMock.mockResolvedValue({
      resume: authoritativeResume,
      currentRevision: 7
    })

    const store = createStore()
    store.set(applicationAtom, createApplication(initialResume, 3))

    render(
      <Provider store={store}>
        <ResumeSaveHarness submittedResume={submittedResume} />
      </Provider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Save Resume" }))

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith(
        "resume-1",
        submittedResume
      )
      expect(screen.getByTestId("school")).toHaveTextContent(
        "Authoritative School"
      )
      expect(screen.getByTestId("revision")).toHaveTextContent("7")
    })
  })
})
