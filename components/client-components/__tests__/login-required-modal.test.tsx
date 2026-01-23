/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string, values?: Record<string, any>) => {
    const translations: Record<string, string> = {
      "pricing.loginRequired.title": "Login Required",
      "pricing.loginRequired.description": values?.planName
        ? `Please login or sign up to upgrade to ${values.planName}.`
        : "Please login or sign up to upgrade to this plan.",
      "pricing.loginRequired.benefitsTitle": "Benefits:",
      "pricing.loginRequired.benefits.0": "Save your resume progress",
      "pricing.loginRequired.benefits.1": "Access premium features",
      "pricing.loginRequired.benefits.2": "Sync across devices",
      "pricing.loginRequired.loginButton": "Login",
      "pricing.loginRequired.signUpButton": "Sign Up",
      "pricing.loginRequired.laterButton": "Maybe Later"
    }
    return translations[key] || key
  })
}))

const mockOnClose = vi.fn()
import { LoginRequiredModal } from "../login-required-modal"

describe("LoginRequiredModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    planName: "Pro Plan"
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render dialog when isOpen is true", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("should not render dialog content when isOpen is false", () => {
    render(<LoginRequiredModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("should display title when open", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByText("Login Required")).toBeInTheDocument()
  })

  it("should display description with plan name", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(
      screen.getByText(/Please login or sign up to upgrade to Pro Plan/i)
    ).toBeInTheDocument()
  })

  it("should display benefits list", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByText("Benefits:")).toBeInTheDocument()
  })

  it("should display login button", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument()
  })

  it("should display sign up button", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument()
  })

  it("should display maybe later button", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(
      screen.getByRole("button", { name: "Maybe Later" })
    ).toBeInTheDocument()
  })

  it("should call onClose when login button is clicked", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("should call onClose when sign up button is clicked", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("should call onClose when maybe later button is clicked", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("should have correct href for login link", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    const loginLink = screen.getByRole("button", { name: "Login" }).closest("a")
    expect(loginLink).toHaveAttribute("href", "/auth/login")
  })

  it("should have correct href for sign up link", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    const signUpLink = screen
      .getByRole("button", { name: "Sign Up" })
      .closest("a")
    expect(signUpLink).toHaveAttribute("href", "/auth/sign-up")
  })

  it("should render dialog content structure", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Login Required")).toBeInTheDocument()
  })
})
