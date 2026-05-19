/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { ResumeEditor } from "../resume-editor"
import { ResumeSectionEditModal } from "../resume-section-edit-modal"
import { applicationAtom } from "@/lib/store/resume"
import type { ResumeData } from "@/types/resume"

const saveApplicationResumeChangeMock = vi.fn()

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => {
    const t = ((key: string) => key) as ((key: string) => string) & {
      has: (key: string) => boolean
    }
    t.has = () => true
    return t
  }
}))

vi.mock("nanoid", () => ({
  nanoid: () => "new-employment-entry"
}))

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

vi.mock("@/lib/hooks/use-resume-template", () => ({
  useResumeTemplate: () => ({
    Template: ({ data }: { data: ResumeData | null }) => (
      <div data-testid="employment-entry-count">
        {data?.employment?.entries.length ?? 0}
      </div>
    )
  })
}))

vi.mock("@/lib/hooks/use-section-click", () => ({
  useSectionClickHandler: () => vi.fn()
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

describe("Resume add section flow", () => {
  it("creates a missing optional section only after save succeeds", async () => {
    const store = createStore()
    let resolveSave!: () => void
    saveApplicationResumeChangeMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    const originalResume: ResumeData = {
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

    render(
      <Provider store={store}>
        <ResumeEditor />
        <ResumeSectionEditModal />
      </Provider>
    )

    expect(screen.getByTestId("employment-entry-count")).toHaveTextContent("0")

    fireEvent.click(screen.getByTestId("resume-add-section-inline"))
    fireEvent.click(screen.getByRole("button", { name: "Employment History" }))

    const companyInput = screen
      .getByText("Company")
      .parentElement?.querySelector("input")

    expect(companyInput).not.toBeNull()

    fireEvent.change(companyInput as HTMLInputElement, {
      target: { value: "New Company" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.save" }))

    const expectedResume: ResumeData = {
      ...originalResume,
      sectionOrder: ["education", "employment", "skills"],
      employment: {
        entries: [
          {
            entryId: "new-employment-entry",
            company: "New Company",
            jobTitle: "",
            start: "",
            end: "",
            content: ""
          }
        ]
      }
    }

    await waitFor(() => {
      expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith(
        "resume-1",
        expectedResume
      )
    })

    expect(screen.getByTestId("employment-entry-count")).toHaveTextContent("0")
    expect(
      store.get(applicationAtom)?.resume.resume_json.employment
    ).toBeUndefined()

    resolveSave()

    await waitFor(() => {
      expect(screen.getByTestId("employment-entry-count")).toHaveTextContent(
        "1"
      )
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
        expectedResume
      )
    })
  })
})
