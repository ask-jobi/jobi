/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { FormProvider, UseFormReturn, useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { EmploymentForm } from "../employment-form"
import { ResumeData } from "@/types/resume"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
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

function renderFocusedEmploymentForm({
  onCancel = vi.fn(),
  onSaveComplete = vi.fn()
}: {
  onCancel?: () => void
  onSaveComplete?: () => void
} = {}) {
  let methods: UseFormReturn<ResumeData> | null = null

  function Wrapper() {
    methods = useForm<ResumeData>({
      defaultValues: {
        sectionOrder: ["employment"],
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
          blocks: []
        },
        skills: {
          sectionId: "skills",
          title: "Skills",
          blocks: []
        },
        employment: {
          sectionId: "employment",
          title: "Employment",
          blocks: [
            {
              blockId: "emp-1",
              company: "Old Company",
              jobTitle: "Engineer",
              start: "2021-09",
              end: "2022-02",
              content: "Original content"
            }
          ]
        }
      }
    })

    return (
      <FormProvider {...methods}>
        <EmploymentForm
          focusIndex={0}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      </FormProvider>
    )
  }

  render(<Wrapper />)

  return {
    methods: methods as unknown as UseFormReturn<ResumeData>,
    onCancel,
    onSaveComplete
  }
}

describe("EmploymentForm", () => {
  it("renders an inline editor with save and cancel actions in focused mode", () => {
    renderFocusedEmploymentForm()

    expect(
      screen.queryByRole("button", { name: /Edit Content/i })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText("Content")).toBeInTheDocument()
    expect(screen.getAllByRole("button")).toHaveLength(2)
    expect(
      screen.getByRole("button", { name: "button.save" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "button.cancel" })
    ).toBeInTheDocument()
  })

  it("commits focused edits only when save is clicked", async () => {
    const { methods, onSaveComplete } = renderFocusedEmploymentForm()

    fireEvent.change(screen.getByDisplayValue("Old Company"), {
      target: { value: "New Company" }
    })
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "Updated content" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.save" }))

    await waitFor(() => {
      expect(methods.getValues("employment.blocks.0.company")).toBe(
        "New Company"
      )
      expect(methods.getValues("employment.blocks.0.content")).toBe(
        "Updated content"
      )
      expect(onSaveComplete).toHaveBeenCalledOnce()
    })
  })

  it("discards focused edits when cancel is clicked", () => {
    const { methods, onCancel } = renderFocusedEmploymentForm()

    fireEvent.change(screen.getByDisplayValue("Old Company"), {
      target: { value: "Discarded Company" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.cancel" }))

    expect(methods.getValues("employment.blocks.0.company")).toBe("Old Company")
    expect(methods.getValues("employment.blocks.0.content")).toBe(
      "Original content"
    )
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
