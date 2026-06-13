/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LoginForm } from "./login-form"

const mockPush = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignInWithOAuth = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useSearchParams: () => mockSearchParams
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth
    }
  })
}))

const setLocationOrigin = (origin: string) => {
  Object.defineProperty(window, "location", {
    value: {
      origin
    },
    writable: true,
    configurable: true
  })
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockSignInWithOAuth.mockResolvedValue({ error: null })
    setLocationOrigin("http://localhost:3000")
  })

  it("starts Google OAuth with the current origin and callback URL", async () => {
    setLocationOrigin("https://jobi-validation.workers.dev")
    mockSearchParams = new URLSearchParams("callbackUrl=/pricing")

    render(<LoginForm />)
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    )

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo:
            "https://jobi-validation.workers.dev/auth/callback?next=%2Fpricing"
        }
      })
    })
  })

  it("falls back to dashboard when callback URL is not relative", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=https://bad.example")

    render(<LoginForm />)
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    )

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback?next=%2Fdashboard"
        }
      })
    })
  })

  it("redirects email login to a safe callback URL", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=/pricing")

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" }
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/pricing")
    })
  })

  it("redirects email login to dashboard for unsafe callback URLs", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=//bad.example")

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" }
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard")
    })
  })
})
