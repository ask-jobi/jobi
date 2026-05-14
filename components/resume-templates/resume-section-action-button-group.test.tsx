import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"

describe("ResumeSectionActionButtonGroup", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it("keeps the edit action visible briefly after pointer leave", () => {
    render(
      <ResumeSectionActionButtonGroup isInteractive onEdit={() => undefined}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const button = screen.getByRole("button", { name: "editSection" })
    const surface = button.parentElement

    expect(surface).not.toBeNull()
    expect(button).toHaveClass("opacity-0")

    fireEvent.mouseEnter(surface!)

    expect(button).toHaveClass("opacity-100")

    fireEvent.mouseLeave(surface!)
    act(() => {
      vi.advanceTimersByTime(49)
    })

    expect(button).toHaveClass("opacity-100")

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(button).toHaveClass("opacity-0")
  })

  it("cancels the pending hide when the pointer re-enters quickly", () => {
    render(
      <ResumeSectionActionButtonGroup isInteractive onEdit={() => undefined}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const button = screen.getByRole("button", { name: "editSection" })
    const surface = button.parentElement

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

    expect(button).toHaveClass("opacity-100")
  })
})
