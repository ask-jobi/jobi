/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { FormProvider, UseFormReturn, useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { AwardsForm } from "../awards-form"
import { ResumeData } from "@/types/resume"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

function renderFocusedAwardsForm({
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
        sectionOrder: ["awards"],
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
        awards: {
          sectionId: "awards",
          title: "Awards",
          blocks: [
            {
              blockId: "award-1",
              title: "Original Award",
              issuer: "Original Issuer",
              date: "2024-01",
              description: "Original description"
            }
          ]
        }
      }
    })

    return (
      <FormProvider {...methods}>
        <AwardsForm
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

describe("AwardsForm", () => {
  it("renders save and cancel actions in focused mode without a remove button", () => {
    renderFocusedAwardsForm()

    expect(screen.getAllByRole("button")).toHaveLength(2)
    expect(
      screen.getByRole("button", { name: "button.save" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "button.cancel" })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Remove Award|Delete/i)).not.toBeInTheDocument()
  })

  it("commits focused edits only when save is clicked", async () => {
    const { methods, onSaveComplete } = renderFocusedAwardsForm()

    fireEvent.change(screen.getByDisplayValue("Original Award"), {
      target: { value: "Updated Award" }
    })
    fireEvent.change(screen.getByDisplayValue("Original description"), {
      target: { value: "Updated description" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.save" }))

    await waitFor(() => {
      expect(methods.getValues("awards.blocks.0.title")).toBe("Updated Award")
      expect(methods.getValues("awards.blocks.0.description")).toBe(
        "Updated description"
      )
      expect(onSaveComplete).toHaveBeenCalledOnce()
    })
  })

  it("discards focused edits when cancel is clicked", () => {
    const { methods, onCancel } = renderFocusedAwardsForm()

    fireEvent.change(screen.getByDisplayValue("Original Award"), {
      target: { value: "Discarded Award" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.cancel" }))

    expect(methods.getValues("awards.blocks.0.title")).toBe("Original Award")
    expect(methods.getValues("awards.blocks.0.description")).toBe(
      "Original description"
    )
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
