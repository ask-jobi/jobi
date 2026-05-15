/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { FormProvider, useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { ResumeEditor } from "../resume-editor"
import {
  applicationAtom,
  editModalOpenAtom,
  editModalRollbackResumeAtom,
  selectedBlockIdAtom,
  selectedBlockIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"
import type { ResumeData } from "@/types/resume"

vi.mock("@/lib/hooks/use-resume-template", () => ({
  useResumeTemplate: () => ({
    Template: ({
      options
    }: {
      options?: { onBlockAdd?: (id: "education", index: number) => void }
    }) => (
      <button
        type="button"
        onClick={() => options?.onBlockAdd?.("education", 0)}
      >
        Trigger Add Block
      </button>
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
  function Wrapper() {
    const methods = useForm<ResumeData>({
      defaultValues: store.get(applicationAtom)?.resume.resume_json
    })

    return (
      <Provider store={store}>
        <FormProvider {...methods}>
          <ResumeEditor />
        </FormProvider>
      </Provider>
    )
  }

  return render(<Wrapper />)
}

describe("ResumeEditor add block", () => {
  it("syncs the draft block into resume state before opening the modal", async () => {
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
        sectionId: "education",
        title: "Education",
        blocks: [
          {
            blockId: "edu-1",
            school: "School 1",
            degree: "Degree 1",
            start: "2020-01",
            end: "2021-01",
            content: ""
          }
        ]
      },
      skills: {
        sectionId: "skills",
        title: "Skills",
        blocks: []
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

    fireEvent.click(screen.getByRole("button", { name: "Trigger Add Block" }))

    await waitFor(() => {
      expect(store.get(editModalOpenAtom)).toBe(true)
      expect(store.get(selectedSectionIdAtom)).toBe("education")
      expect(store.get(selectedBlockIndexAtom)).toBe(1)
      expect(store.get(selectedBlockIdAtom)).toBeTruthy()
      expect(store.get(editModalRollbackResumeAtom)).toEqual(originalResume)
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.blocks
      ).toHaveLength(2)
    })
  })
})
