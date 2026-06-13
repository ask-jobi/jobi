/**
 * @vitest-environment jsdom
 */
import type { ComponentType } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ResumeEditorToolUI } from "./resume-editor-tool"

const TestResumeEditorToolUI = ResumeEditorToolUI as ComponentType<{
  isError: boolean
  result: unknown
}>

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
      <TestResumeEditorToolUI
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

  it("renders date rewrite values without crashing", () => {
    render(
      <TestResumeEditorToolUI
        isError={false}
        result={{
          operation: "rewrite",
          entity: "education",
          id: "edu-1",
          field: "end",
          originalValue: "2024",
          value: ""
        }}
      />
    )

    expect(screen.getByText("Education")).toBeInTheDocument()
    expect(screen.getByText("end")).toBeInTheDocument()
    expect(screen.getByText("2024")).toBeInTheDocument()
  })

  it("renders inline errors instead of hiding failed tool calls", () => {
    render(
      <TestResumeEditorToolUI
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
