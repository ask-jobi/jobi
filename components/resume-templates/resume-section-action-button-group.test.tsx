import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"

describe("ResumeSectionActionButtonGroup", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        disconnect() {}
        observe() {}
        unobserve() {}
      }
    )
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("keeps the edit action visible briefly after pointer leave", () => {
    render(
      <ResumeSectionActionButtonGroup isInteractive onEdit={() => undefined}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const button = screen.getByRole("button", { name: "editSection" })
    const actions = button.parentElement
    const surface = screen.getByText("Section body").parentElement

    expect(actions).not.toBeNull()
    expect(surface).not.toBeNull()
    expect(actions).toHaveClass("opacity-0")

    fireEvent.mouseEnter(surface!)

    expect(actions).toHaveClass("opacity-100")

    fireEvent.mouseLeave(surface!)
    act(() => {
      vi.advanceTimersByTime(49)
    })

    expect(actions).toHaveClass("opacity-100")

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(actions).toHaveClass("opacity-0")
  })

  it("cancels the pending hide when the pointer re-enters quickly", () => {
    render(
      <ResumeSectionActionButtonGroup isInteractive onEdit={() => undefined}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const button = screen.getByRole("button", { name: "editSection" })
    const actions = button.parentElement
    const surface = screen.getByText("Section body").parentElement

    expect(actions).not.toBeNull()
    expect(surface).not.toBeNull()

    fireEvent.mouseEnter(surface!)
    fireEvent.mouseLeave(surface!)
    act(() => {
      vi.advanceTimersByTime(25)
    })
    fireEvent.mouseEnter(surface!)
    act(() => {
      vi.advanceTimersByTime(60)
    })

    expect(actions).toHaveClass("opacity-100")
  })

  it("shows a tooltip confirmation before deleting an entry", () => {
    const onDelete = vi.fn()

    render(
      <ResumeSectionActionButtonGroup
        isInteractive
        onDelete={onDelete}
        onEdit={() => undefined}
      >
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const surface = screen.getByText("Section body").parentElement

    expect(surface).not.toBeNull()

    fireEvent.mouseEnter(surface!)

    const deleteButton = screen.getByRole("button", { name: "deleteEntry" })

    fireEvent.click(deleteButton)

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole("tooltip")).toHaveTextContent("confirmDeleteEntry")

    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("renders an add action and triggers insertion", () => {
    const onAdd = vi.fn()

    render(
      <ResumeSectionActionButtonGroup isInteractive onAdd={onAdd}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const surface = screen.getByText("Section body").parentElement

    expect(surface).not.toBeNull()

    fireEvent.mouseEnter(surface!)
    fireEvent.click(screen.getByRole("button", { name: "addEntry" }))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
