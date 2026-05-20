/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { ResumeEditor } from "../resume-editor"
import { applicationAtom } from "@/lib/store/resume"
import type { ResumeData } from "@/types/resume"

vi.mock("@/lib/hooks/use-resume-template", () => ({
  useResumeTemplate: () => ({
    Template: ({ data }: { data: ResumeData | null }) => (
      <div data-testid="education-entry-count">
        {data?.education?.entries.length ?? 0}
      </div>
    )
  })
}))

vi.mock("@/lib/hooks/use-section-click", () => ({
  useSectionClickHandler: () => vi.fn()
}))

vi.mock("@/lib/hooks/use-entry-edit-workflow", () => ({
  useEntryEditWorkflow: () => ({
    startNewEntryEdit: vi.fn(),
    deleteAndPersistEntry: vi.fn()
  })
}))

vi.mock("@/components/resumes/resume-canvas-section-entry", () => ({
  ResumeCanvasSectionEntry: () => null,
  isResumeCanvasEmpty: () => false
}))

function renderEditor(persistedResume: ResumeData) {
  const store = createStore()

  store.set(applicationAtom, {
    id: "app-1",
    resume: {
      id: "resume-1",
      language: "en",
      evaluation_report: null,
      evaluation_report_refresh_flag: false,
      resume_json: persistedResume
    },
    job: {
      id: "job-1",
      name: "",
      company: "",
      description: ""
    }
  })

  return render(
    <Provider store={store}>
      <ResumeEditor />
    </Provider>
  )
}

describe("ResumeEditor", () => {
  it("renders the persisted resume without requiring a form provider", () => {
    const persistedResume: ResumeData = {
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

    renderEditor(persistedResume)

    expect(screen.getByTestId("education-entry-count")).toHaveTextContent("1")
  })
})
