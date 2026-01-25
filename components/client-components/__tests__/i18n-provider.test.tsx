/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import I18NProvider from "../i18n-provider"

describe("I18NProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render children correctly", () => {
    render(
      <I18NProvider locale="en">
        <div data-testid="child-content">Test Child</div>
      </I18NProvider>
    )

    expect(screen.getByTestId("child-content")).toBeInTheDocument()
  })

  it("should render children for zh-CN locale", () => {
    render(
      <I18NProvider locale="zh-CN">
        <div data-testid="child-content">测试内容</div>
      </I18NProvider>
    )

    expect(screen.getByTestId("child-content")).toBeInTheDocument()
  })

  it("should handle nested children", () => {
    render(
      <I18NProvider locale="en">
        <div>
          <span data-testid="nested-child">Nested Content</span>
          <p data-testid="another-child">Another content</p>
        </div>
      </I18NProvider>
    )

    expect(screen.getByTestId("nested-child")).toBeInTheDocument()
    expect(screen.getByTestId("another-child")).toBeInTheDocument()
  })

  it("should handle empty children", () => {
    render(
      <I18NProvider locale="en">
        <div />
      </I18NProvider>
    )

    expect(document.body.querySelector("div")).toBeInTheDocument()
  })

  it("should handle multiple children", () => {
    render(
      <I18NProvider locale="en">
        <span>First</span>
        <span>Second</span>
        <span>Third</span>
      </I18NProvider>
    )

    expect(screen.getByText("First")).toBeInTheDocument()
    expect(screen.getByText("Second")).toBeInTheDocument()
    expect(screen.getByText("Third")).toBeInTheDocument()
  })
})
