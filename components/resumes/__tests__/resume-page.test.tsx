/**
 * @vitest-environment jsdom
 */
import { act, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import ResumePage from "../resume-page"
import { applicationAtom } from "@/lib/store/resume"
import { useApplicationResume } from "@/lib/store/resume"
import type { ResumeData } from "@/types/resume"

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

vi.mock("../resume-editor", () => ({
  default: function MockResumeEditor() {
    const { applicationResumeData } = useApplicationResume()

    return (
      <div>{applicationResumeData?.education?.entries[0]?.school ?? ""}</div>
    )
  }
}))

vi.mock("@/components/resumes/resume-right-panel", () => ({
  ResumeRightPanel: () => <div>Right Panel</div>
}))

vi.mock("@/components/resumes/resume-section-edit-modal", () => ({
  ResumeSectionEditModal: () => <div>Modal</div>
}))

describe("ResumePage", () => {
  it("re-renders from the persisted resume store without trying to save", async () => {
    const store = createStore()

    const resume: ResumeData = {
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
        resume_json: resume
      },
      job: {
        id: "job-1",
        name: "",
        company: "",
        description: ""
      }
    })

    render(
      <Provider store={store}>
        <ResumePage />
      </Provider>
    )

    expect(screen.getByText("School 1")).toBeInTheDocument()

    const updatedResume: ResumeData = {
      ...resume,
      education: {
        ...resume.education!,
        entries: [
          {
            ...resume.education!.entries[0],
            school: "Updated School"
          }
        ]
      }
    }

    await act(async () => {
      store.set(applicationAtom, {
        id: "app-1",
        resume: {
          id: "resume-1",
          language: "en",
          evaluation_report: null,
          evaluation_report_refresh_flag: false,
          resume_json: updatedResume
        },
        job: {
          id: "job-1",
          name: "",
          company: "",
          description: ""
        }
      })
    })

    await waitFor(() => {
      expect(screen.getByText("Updated School")).toBeInTheDocument()
      expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
    })
  })
})
