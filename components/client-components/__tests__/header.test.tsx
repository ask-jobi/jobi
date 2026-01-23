/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("@/lib/i18n/services")
vi.mock("../language-switcher")

import { Header } from "../header"
import * as useAuth from "@/lib/hooks/use-auth"
import { User } from "@supabase/supabase-js"

describe("Header", () => {
  const useAuthMock = vi.spyOn(useAuth, "useAuth")
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: null, loading: false })
  })

  it("should render with all default props", () => {
    render(<Header />)

    expect(screen.getByRole("banner")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "pricingPage" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "login" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "signUp" })).toBeInTheDocument()
  })

  it("should show skeleton when loading", () => {
    useAuthMock.mockReturnValue({ user: null, loading: true })

    const { container } = render(<Header />)

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2)
  })

  it("should render dashboard link when user is logged in", () => {
    useAuthMock.mockReturnValue({ user: { id: "123" } as User, loading: false })

    render(<Header />)

    expect(screen.getByRole("link", { name: "dashboard" })).toBeInTheDocument()
  })

  it("should hide language switcher when showLanguageSwitcher is false", () => {
    render(<Header showLanguageSwitcher={false} />)

    expect(screen.queryByRole("button", { name: "login" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "EN" })).not.toBeInTheDocument()
  })

  it("should hide pricing link when showPricingLink is false", () => {
    render(<Header showPricingLink={false} />)

    expect(
      screen.queryByRole("link", { name: "pricingPage" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "login" })).toBeInTheDocument()
  })

  it("should hide auth buttons when showAuthButtons is false", () => {
    render(<Header showAuthButtons={false} />)

    expect(
      screen.queryByRole("button", { name: "login" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "signUp" })
    ).not.toBeInTheDocument()
  })

  it("should apply custom className", () => {
    render(<Header className="custom-class" />)

    expect(screen.getByRole("banner")).toHaveClass("custom-class")
  })
})
