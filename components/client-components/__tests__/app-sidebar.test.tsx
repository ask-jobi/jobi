/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

import AppSidebar from "../app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

const TestAppSidebar = (
  <SidebarProvider>
    <AppSidebar />
  </SidebarProvider>
)

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render sidebar with correct structure", () => {
    render(TestAppSidebar)

    expect(screen.getByTestId("ui-sidebar")).toBeInTheDocument()
    expect(screen.getByTestId("ui-sidebar-header")).toBeInTheDocument()
    expect(screen.getByTestId("ui-sidebar-content")).toBeInTheDocument()
    expect(screen.getByTestId("ui-sidebar-footer")).toBeInTheDocument()
  })

  it("should render dashboard and settings menu items only", () => {
    render(TestAppSidebar)

    expect(screen.getByRole("link", { name: "dashboard" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "jobs" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "settings" })).toBeInTheDocument()
  })

  it("should have correct href for menu items", () => {
    render(TestAppSidebar)

    expect(screen.getByRole("link", { name: "dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    )
    expect(screen.getByRole("link", { name: "settings" })).toHaveAttribute(
      "href",
      "/settings"
    )
  })

  it("should render logo in sidebar header", () => {
    render(TestAppSidebar)

    expect(screen.getByTestId("ui-sidebar-header")).toContainElement(
      screen.getByAltText("Jobi Logo")
    )
  })
})
