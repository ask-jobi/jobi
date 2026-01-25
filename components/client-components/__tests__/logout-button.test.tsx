/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { it, expect, vi, describe, beforeEach } from "vitest"

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

    expect(screen.getByTestId("logout-icon")).toBeInTheDocument()
  })

  it("should display logout text", () => {
    render(<LogoutButton />)

    expect(screen.getByText("logout")).toBeInTheDocument()
  })

  it("should have correct CSS classes", () => {
    render(<LogoutButton />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("text-red-600")
    expect(button).toHaveClass("hover:text-red-700")
    expect(button).toHaveClass("hover:bg-red-50")
  })

  it("should call signOut on click", () => {
    render(<LogoutButton />)

    fireEvent.click(screen.getByRole("button"))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it("should redirect to home after sign out", async () => {
    render(<LogoutButton />)

    fireEvent.click(screen.getByRole("button"))

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
