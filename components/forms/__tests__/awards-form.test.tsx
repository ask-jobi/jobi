/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AwardsForm } from "../awards-form"
import type { AwardEntry } from "@/types/resume"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

const originalEntry: AwardEntry = {
  entryId: "award-1",
  title: "Original Award",
  issuer: "Original Issuer",
  date: "2024-01",
  description: "Original description"
}

function renderFocusedAwardsForm({
  onCancel = vi.fn(),
  onSaveComplete = vi.fn(),
  onSaveEntry = vi.fn()
}: {
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry?: (values: AwardEntry) => void | Promise<void>
} = {}) {
  render(
    <AwardsForm
      entry={originalEntry}
      focusIndex={0}
      onCancel={onCancel}
      onSaveComplete={onSaveComplete}
      onSaveEntry={onSaveEntry}
    />
  )

  return {
    onCancel,
    onSaveComplete,
    onSaveEntry
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
    const { onSaveEntry, onSaveComplete } = renderFocusedAwardsForm()

    fireEvent.change(screen.getByDisplayValue("Original Award"), {
      target: { value: "Updated Award" }
    })
    fireEvent.change(screen.getByDisplayValue("Original description"), {
      target: { value: "Updated description" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.save" }))

    await waitFor(() => {
      expect(onSaveEntry).toHaveBeenCalledWith({
        ...originalEntry,
        title: "Updated Award",
        description: "Updated description"
      })
      expect(onSaveComplete).toHaveBeenCalledOnce()
    })
  })

  it("discards focused edits when cancel is clicked", () => {
    const { onCancel, onSaveEntry } = renderFocusedAwardsForm()

    fireEvent.change(screen.getByDisplayValue("Original Award"), {
      target: { value: "Discarded Award" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.cancel" }))

    expect(screen.getByDisplayValue("Original Award")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Original description")).toBeInTheDocument()
    expect(onSaveEntry).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
