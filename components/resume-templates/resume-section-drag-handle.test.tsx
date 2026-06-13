import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ResumeSectionDragHandle } from "@/components/resume-templates/resume-section-drag-handle"

describe("ResumeSectionDragHandle", () => {
  it("renders a plain six-dot handle without button chrome", () => {
    render(<ResumeSectionDragHandle />)

    const handle = screen.getByRole("button", { name: "reorderEntry" })

    expect(handle).not.toHaveClass("rounded-full")
    expect(handle).not.toHaveClass("border-border/70")
    expect(handle).not.toHaveClass("shadow-sm")
    expect(handle).toHaveClass("border-0", "bg-transparent", "p-0")
  })
})
