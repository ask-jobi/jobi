/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
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

const saveResumeChangeMock = vi.fn()

vi.mock("@/server/resume", () => ({
  saveResumeChange: (...args: unknown[]) => saveResumeChangeMock(...args)
}))

vi.mock("@/lib/hooks/use-resume-template", () => ({
  useResumeTemplate: () => ({
    Template: ({
      options
    }: {
      options?: {
        onBlockAdd?: (id: "education", index: number) => void
        onBlockDelete?: (id: "education", index: number) => void
      }
    }) => (
      <>
        <button
          type="button"
          onClick={() => options?.onBlockAdd?.("education", 0)}
        >
          Trigger Add Block
        </button>
        <button
          type="button"
          onClick={() => options?.onBlockDelete?.("education", 0)}
        >
          Trigger Delete Block
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
  function DraftObserver() {
    const { watch } = useFormContext<ResumeData>()
    const educationBlocks = watch("education.blocks")

    return (
      <div data-testid="draft-education-block-count">
        {educationBlocks?.length ?? 0}
      </div>
    )
  }

  function Wrapper() {
    const methods = useForm<ResumeData>({
      defaultValues: store.get(applicationAtom)?.resume.resume_json
    })

    return (
      <Provider store={store}>
        <FormProvider {...methods}>
          <DraftObserver />
          <ResumeEditor />
        </FormProvider>
      </Provider>
    )
  }

  return render(<Wrapper />)
}

describe("ResumeEditor add block", () => {
  it("adds the block to the draft before opening the modal without mutating persisted resume", async () => {
    saveResumeChangeMock.mockResolvedValue(undefined)
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
      expect(screen.getByTestId("draft-education-block-count")).toHaveTextContent(
        "2"
      )
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.blocks
      ).toHaveLength(1)
    })
  })

  it("persists block deletion immediately after updating the draft", async () => {
    saveResumeChangeMock.mockResolvedValue(undefined)
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

    fireEvent.click(screen.getByRole("button", { name: "Trigger Delete Block" }))

    await waitFor(() => {
      expect(screen.getByTestId("draft-education-block-count")).toHaveTextContent(
        "0"
      )
      expect(
        store.get(applicationAtom)?.resume.resume_json.education.blocks
      ).toHaveLength(0)
      expect(saveResumeChangeMock).toHaveBeenCalledWith("resume-1", {
        ...originalResume,
        education: {
          ...originalResume.education,
          blocks: []
        }
      })
    })
  })
})
