/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { describe, expect, it, vi } from "vitest"
import { ResumeCanvasSectionEntry } from "../resume-canvas-section-entry"
import { applicationAtom } from "@/lib/store/resume"
import { chatThreadLifecycleAtom } from "@/lib/store/chat"
import type { ResumeData } from "@/types/resume"

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => {
    const t = ((key: string) => key) as ((key: string) => string) & {
      has: (key: string) => boolean
    }
    t.has = () => false
    return t
  }
}))

vi.mock("@/lib/hooks/use-entry-edit-workflow", () => ({
  useEntryEditWorkflow: () => ({
    startSectionEdit: vi.fn()
  })
}))

function renderSectionEntry(
  persistedResume: ResumeData,
  { aiRunning = false }: { aiRunning?: boolean } = {}
) {
  const store = createStore()

  store.set(applicationAtom, {
    id: "app-1",
    resume: {
      id: "resume-1",
      language: "en",
      evaluation_report: null,
      evaluation_report_refresh_flag: false,
      current_revision: 1,
      resume_json: persistedResume
    },
    job: {
      id: "job-1",
      name: "",
      company: "",
      description: ""
    }
  })

  if (aiRunning) {
    store.set(chatThreadLifecycleAtom, "running")
  }

  return render(
    <Provider store={store}>
      <ResumeCanvasSectionEntry />
    </Provider>
  )
}

describe("ResumeCanvasSectionEntry", () => {
  it("derives the empty state from a truly blank persisted resume", () => {
    const persistedResume: ResumeData = {
      sectionOrder: [],
      personalInfo: {
        entryId: "pi-1",
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      }
    }

    renderSectionEntry(persistedResume)

    expect(screen.getByTestId("resume-add-section-empty")).toBeInTheDocument()
  })

  it("disables the add-section trigger while an AI resume action is running", () => {
    const persistedResume: ResumeData = {
      sectionOrder: [],
      personalInfo: {
        entryId: "pi-1",
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      }
    }

    renderSectionEntry(persistedResume, { aiRunning: true })

    expect(screen.getByTestId("resume-add-section-empty")).toBeDisabled()
  })
})
