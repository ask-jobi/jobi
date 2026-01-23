/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      logout: "Logout"
    }
    return translations[key] || key
  })
}))

const mockPush = vi.fn()
const mockSignOut = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut
    }
  })
}))

vi.mock("@/components/ui/sidebar", () => ({
  SidebarMenuButton: ({
    children,
    onClick,
    className
  }: {
    children: ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <button
      data-testid="sidebar-menu-button"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children }: { children: ReactNode }) => (
    <li data-testid="sidebar-menu-item">{children}</li>
  )
}))

vi.mock("lucide-react", () => ({
  LogOut: () => <svg data-testid="icon-logout" />
}))

import { LogoutButton } from "../logout-button"

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignOut.mockResolvedValue(undefined)
  })

  it("should render logout button", () => {
    render(<LogoutButton />)

    expect(screen.getByTestId("sidebar-menu-button")).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-menu-item")).toBeInTheDocument()
  })

  it("should display logout icon", () => {
    render(<LogoutButton />)

    expect(screen.getByTestId("icon-logout")).toBeInTheDocument()
  })

  it("should display logout text", () => {
    render(<LogoutButton />)

    expect(screen.getByTestId("sidebar-menu-button")).toHaveTextContent(
      "Logout"
    )
  })

  it("should have correct CSS classes", () => {
    render(<LogoutButton />)

    const button = screen.getByTestId("sidebar-menu-button")
    expect(button).toHaveClass("text-red-600")
    expect(button).toHaveClass("hover:text-red-700")
    expect(button).toHaveClass("hover:bg-red-50")
  })

  it("should call signOut on click", () => {
    render(<LogoutButton />)

    fireEvent.click(screen.getByTestId("sidebar-menu-button"))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it("should redirect to home after sign out", async () => {
    render(<LogoutButton />)

    fireEvent.click(screen.getByTestId("sidebar-menu-button"))

    expect(mockSignOut).toHaveBeenCalled()
    await Promise.resolve()
    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("should be wrapped in SidebarMenuItem", () => {
    render(<LogoutButton />)

    expect(screen.getByTestId("sidebar-menu-item")).toContainElement(
      screen.getByTestId("sidebar-menu-button")
    )
  })
})
