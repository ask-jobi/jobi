/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

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

    expect(screen.getByTestId("dialog")).toBeInTheDocument()
  })

  it("should not render dialog content when isOpen is false", () => {
    render(<LoginRequiredModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument()
  })

  it("should display title when open", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByText("pricing.loginRequired.title")).toBeInTheDocument()
  })

  it("should display description with plan name", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(
      screen.getByText("pricing.loginRequired.description")
    ).toBeInTheDocument()
  })

  it("should display benefits list", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(
      screen.getByText("pricing.loginRequired.benefitsTitle")
    ).toBeInTheDocument()
  })

  it("should display login button", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(
      screen.getByRole("button", { name: "pricing.loginRequired.loginButton" })
    ).toBeInTheDocument()
  })

  it("should display sign up button", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(
      screen.getByRole("button", { name: "pricing.loginRequired.signUpButton" })
    ).toBeInTheDocument()
  })

  it("should display maybe later button", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(
      screen.getByRole("button", { name: "pricing.loginRequired.laterButton" })
    ).toBeInTheDocument()
  })

  it("should call onClose when login button is clicked", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    fireEvent.click(
      screen.getByRole("button", { name: "pricing.loginRequired.loginButton" })
    )

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("should call onClose when sign up button is clicked", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    fireEvent.click(
      screen.getByRole("button", { name: "pricing.loginRequired.signUpButton" })
    )

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("should call onClose when maybe later button is clicked", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    fireEvent.click(
      screen.getByRole("button", { name: "pricing.loginRequired.laterButton" })
    )

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("should have correct href for login link", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    const loginLink = screen
      .getByRole("button", { name: "pricing.loginRequired.loginButton" })
      .closest("a")
    expect(loginLink).toHaveAttribute("href", "/auth/login")
  })

  it("should have correct href for sign up link", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    const signUpLink = screen
      .getByRole("button", { name: "pricing.loginRequired.signUpButton" })
      .closest("a")
    expect(signUpLink).toHaveAttribute("href", "/auth/sign-up")
  })

  it("should render dialog content structure", () => {
    render(<LoginRequiredModal {...defaultProps} />)

    expect(screen.getByTestId("dialog")).toBeInTheDocument()
    expect(screen.getByText("pricing.loginRequired.title")).toBeInTheDocument()
  })
})
