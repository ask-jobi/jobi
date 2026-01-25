/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("../compact-plan-display", () => ({
  CompactPlanDisplay: () => (
    <div data-testid="compact-plan-display">Plan Display</div>
  )
}))

vi.mock("../logout-button", () => ({
  LogoutButton: () => <button data-testid="logout-button">Logout</button>
}))

import AppSidebar from "../app-sidebar"

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render sidebar with correct structure", () => {
    render(<AppSidebar />)

    expect(screen.getByTestId("sidebar")).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-footer")).toBeInTheDocument()
  })

  it("should render dashboard and jobs menu items", () => {
    render(<AppSidebar />)

    expect(screen.getByRole("link", { name: "dashboard" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "jobs" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "settings" })).toBeInTheDocument()
  })

  it("should render logout button", () => {
    render(<AppSidebar />)

    expect(screen.getByTestId("logout-button")).toBeInTheDocument()
  })

  it("should render compact plan display", () => {
    render(<AppSidebar />)

    expect(screen.getByTestId("compact-plan-display")).toBeInTheDocument()
  })

  it("should have correct href for menu items", () => {
    render(<AppSidebar />)

    expect(screen.getByRole("link", { name: "dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    )
    expect(screen.getByRole("link", { name: "jobs" })).toHaveAttribute(
      "href",
      "/jobs"
    )
    expect(screen.getByRole("link", { name: "settings" })).toHaveAttribute(
      "href",
      "/settings"
    )
  })

  it("should render logo in sidebar header", () => {
    render(<AppSidebar />)

    expect(screen.getByTestId("sidebar-header")).toContainElement(
      screen.getByAltText("Jobi Logo")
    )
  })
})
