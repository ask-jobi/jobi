/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      dashboard: "Dashboard",
      jobs: "Jobs",
      settings: "Settings"
    }
    return translations[key] || key
  })
}))

vi.mock("../compact-plan-display", () => ({
  CompactPlanDisplay: () => (
    <div data-testid="compact-plan-display">Plan Display</div>
  )
}))

vi.mock("../logout-button", () => ({
  LogoutButton: () => <button data-testid="logout-button">Logout</button>
}))

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: ReactNode }) => (
    <aside data-testid="sidebar">{children}</aside>
  ),
  SidebarContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarFooter: ({ children }: { children: ReactNode }) => (
    <footer data-testid="sidebar-footer">{children}</footer>
  ),
  SidebarGroup: ({ children }: { children: ReactNode }) => (
    <div data-testid="sidebar-group">{children}</div>
  ),
  SidebarGroupContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="sidebar-group-content">{children}</div>
  ),
  SidebarHeader: ({ children }: { children: ReactNode }) => (
    <header data-testid="sidebar-header">{children}</header>
  ),
  SidebarMenu: ({ children }: { children: ReactNode }) => (
    <ul data-testid="sidebar-menu">{children}</ul>
  ),
  SidebarMenuButton: ({ children }: { children: ReactNode }) => (
    <div data-testid="sidebar-menu-button">{children}</div>
  ),
  SidebarMenuItem: ({ children }: { children: ReactNode }) => (
    <li data-testid="sidebar-menu-item">{children}</li>
  )
}))

import AppSidebar from "../app-sidebar"
import { ReactNode } from "react"

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

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Jobs" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument()
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

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    )
    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute(
      "href",
      "/jobs"
    )
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
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
