/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EmploymentForm } from "../employment-form"
import type { EmploymentEntry } from "@/types/resume"

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

const originalEntry: EmploymentEntry = {
  entryId: "emp-1",
  company: "Old Company",
  jobTitle: "Engineer",
  start: "2021-09",
  end: "2022-02",
  content: "Original content"
}

function renderFocusedEmploymentForm({
  onCancel = vi.fn(),
  onSaveComplete = vi.fn(),
  onSaveEntry = vi.fn()
}: {
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry?: (values: EmploymentEntry) => void | Promise<void>
} = {}) {
  render(
    <EmploymentForm
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
    const { onSaveEntry, onSaveComplete } = renderFocusedEmploymentForm()

    fireEvent.change(screen.getByDisplayValue("Old Company"), {
      target: { value: "New Company" }
    })
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "Updated content" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.save" }))

    await waitFor(() => {
      expect(onSaveEntry).toHaveBeenCalledWith({
        ...originalEntry,
        company: "New Company",
        content: "Updated content"
      })
      expect(onSaveComplete).toHaveBeenCalledOnce()
    })
  })

  it("discards focused edits when cancel is clicked", () => {
    const { onCancel, onSaveEntry } = renderFocusedEmploymentForm()

    fireEvent.change(screen.getByDisplayValue("Old Company"), {
      target: { value: "Discarded Company" }
    })
    fireEvent.click(screen.getByRole("button", { name: "button.cancel" }))

    expect(screen.getByDisplayValue("Old Company")).toBeInTheDocument()
    expect(screen.getByLabelText("Content")).toHaveValue("Original content")
    expect(onSaveEntry).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
