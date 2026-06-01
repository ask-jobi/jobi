/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ResumeEditorToolUI } from "./resume-editor-tool"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      processing: "Processing...",
      toolError: "Resume tool failed",
      "toolOutput.entity.education": "Education"
    }

    return messages[key] ?? key
  }
}))

describe("ResumeEditorToolUI", () => {
  it("renders AI SDK tool results with the resume output card", () => {
    render(
      <ResumeEditorToolUI
        isError={false}
        result={{
          operation: "rewrite",
          entity: "education",
          id: "edu-1",
          field: "school",
          originalValue: "Draft School",
          value: "Edited School"
        }}
      />
    )

    expect(screen.getByText("Education")).toBeInTheDocument()
    expect(screen.getByText("school")).toBeInTheDocument()
    expect(screen.getByText("Draft School")).toBeInTheDocument()
    expect(screen.getByText("Edited School")).toBeInTheDocument()
  })

  it("renders inline errors instead of hiding failed tool calls", () => {
    render(
      <ResumeEditorToolUI
        isError
        result={{ errorText: "Entry with id missing-entry not found" }}
      />
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Resume tool failed")
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Entry with id missing-entry not found"
    )
  })
})
