/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { ForgotPasswordForm } from "../forgot-password-form"

// Helper function to set up location mock
const setupLocationMock = () => {
  Object.defineProperty(window, "location", {
    value: {
      origin: "http://localhost:3000",
      href: "http://localhost:3000/auth/login"
    },
    writable: true,
    configurable: true
  })
}

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>
}))

// Mock Supabase client - use a module-level object that can be updated
const supabaseMock = {
  auth: {
    resetPasswordForEmail: vi.fn()
  }
}
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => supabaseMock
}))

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null
    })
  })

  it("should render forgot password form", () => {
    setupLocationMock()
    render(<ForgotPasswordForm />)

    expect(screen.getByText("Reset Your Password")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Type in your email and we'll send you a link to reset your password"
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId("ui-input")).toBeInTheDocument()
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("Send reset email")).toBeInTheDocument()
  })

  it("should update email input value", () => {
    setupLocationMock()
    render(<ForgotPasswordForm />)

    const input = screen.getByTestId("ui-input")
    fireEvent.change(input, { target: { value: "test@example.com" } })

    expect(input).toHaveValue("test@example.com")
  })

  it("should call Supabase resetPasswordForEmail when form is submitted", () => {
    setupLocationMock()
    render(<ForgotPasswordForm />)

    const input = screen.getByTestId("ui-input")
    fireEvent.change(input, { target: { value: "test@example.com" } })

    const button = screen.getByText("Send reset email")
    fireEvent.click(button)

    expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      {
        redirectTo: "http://localhost:3000/auth/update-password"
      }
    )
  })

  it("should show success message after successful submission", async () => {
    setupLocationMock()

    render(<ForgotPasswordForm />)

    const input = screen.getByTestId("ui-input")
    fireEvent.change(input, { target: { value: "test@example.com" } })

    const button = screen.getByText("Send reset email")
    fireEvent.click(button)

    await vi.waitFor(
      () => {
        expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalled()
      },
      { timeout: 1000 }
    )

    await vi.waitFor(
      () => {
        expect(screen.queryByText("Sending...")).not.toBeInTheDocument()
      },
      { timeout: 1000 }
    )

    expect(screen.getByText("Check Your Email")).toBeInTheDocument()
    expect(
      screen.getByText("Password reset instructions sent")
    ).toBeInTheDocument()
  })

  it("should show error message when Supabase returns an error", async () => {
    setupLocationMock()
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: new Error("User not found")
    })

    render(<ForgotPasswordForm />)

    const input = screen.getByTestId("ui-input")
    fireEvent.change(input, { target: { value: "test@example.com" } })

    const button = screen.getByText("Send reset email")
    fireEvent.click(button)

    await vi.waitFor(
      () => {
        expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalled()
      },
      { timeout: 1000 }
    )

    await vi.waitFor(
      () => {
        expect(screen.queryByText("Sending...")).not.toBeInTheDocument()
      },
      { timeout: 1000 }
    )

    expect(screen.getByText("User not found")).toBeInTheDocument()
  })

  it("should show loading state while submitting", async () => {
    setupLocationMock()
    supabaseMock.auth.resetPasswordForEmail.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: {}, error: null }), 100)
        )
    )

    render(<ForgotPasswordForm />)

    const input = screen.getByTestId("ui-input")
    fireEvent.change(input, { target: { value: "test@example.com" } })

    const button = screen.getByText("Send reset email")
    fireEvent.click(button)

    const buttonElement = screen.getByRole("button")
    expect(buttonElement).toHaveTextContent("Sending...")
    expect(buttonElement).toBeDisabled()
  })

  it("should render login link", () => {
    setupLocationMock()
    render(<ForgotPasswordForm />)

    expect(screen.getByText("Already have an account?")).toBeInTheDocument()
    expect(screen.getByText("Login")).toBeInTheDocument()
    expect(screen.getByText("Login")).toHaveAttribute("href", "/auth/login")
  })
})
