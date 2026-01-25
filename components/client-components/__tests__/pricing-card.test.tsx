/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { PricingCard } from "../pricing-card"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock PaymentError component
vi.mock("../payment-error", () => ({
  PaymentError: ({ error }: { error?: string }) =>
    error ? <div data-testid="payment-error">{error}</div> : null
}))

// Mock LoginRequiredModal component
vi.mock("../login-required-modal", () => ({
  LoginRequiredModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="login-modal">Login Required Modal</div> : null
}))

// Mock useAuth hook
const mockUseAuth = {
  user: null,
  loading: false
}
vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth
}))

describe("PricingCard", () => {
  const defaultProps = {
    title: "Pro Plan",
    price: "$9.99",
    description: "Everything you need",
    features: ["Feature 1", "Feature 2"],
    plan: "PRO",
    buttonText: "Get Started"
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.user = null
    mockUseAuth.loading = false
  })

  it("should render pricing card with correct content", () => {
    mockUseAuth.user = { id: "user123" } as any
    render(<PricingCard {...defaultProps} />)

    expect(screen.getByText("Pro Plan")).toBeInTheDocument()
    expect(screen.getByText("$9.99")).toBeInTheDocument()
    expect(screen.getByText("Everything you need")).toBeInTheDocument()
    expect(screen.getByText("Feature 1")).toBeInTheDocument()
    expect(screen.getByText("Feature 2")).toBeInTheDocument()
    // Use a more flexible matcher for button text
    const buttons = screen.getAllByText(/Get Started/i)
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("should show popular badge when isPopular is true", () => {
    render(<PricingCard {...defaultProps} isPopular={true} />)

    expect(screen.getByText("pricing.mostPopular")).toBeInTheDocument()
    expect(screen.getByTestId("crown-icon")).toBeInTheDocument()
  })

  it("should not show popular badge when isPopular is false", () => {
    render(<PricingCard {...defaultProps} isPopular={false} />)

    expect(screen.queryByText("pricing.mostPopular")).not.toBeInTheDocument()
    expect(screen.queryByTestId("crown-icon")).not.toBeInTheDocument()
  })

  it("should show login button when user is not logged in", () => {
    render(<PricingCard {...defaultProps} />)

    expect(screen.getByText("pricing.loginToPurchase")).toBeInTheDocument()
  })

  it("should show loading state when auth is loading", () => {
    mockUseAuth.loading = true

    render(<PricingCard {...defaultProps} />)

    expect(screen.getByText("pricing.loading")).toBeInTheDocument()
  })

  it("should handle free plan selection", async () => {
    mockUseAuth.user = { id: "user123" } as any
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Free pass created successfully" })
    })

    render(<PricingCard {...defaultProps} priceId={undefined} />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/access-passes/create-free",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  })

  it("should handle paid plan selection", async () => {
    mockUseAuth.user = { id: "user123" } as any
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ url: "https://checkout.stripe.com/pay/cs_test_123" })
    })

    render(<PricingCard {...defaultProps} priceId="price_123" />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    expect(global.fetch).toHaveBeenCalledWith("/api/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        priceId: "price_123",
        plan: "PRO"
      })
    })
  })

  it("should show payment error when checkout fails", async () => {
    mockUseAuth.user = { id: "user123" } as any
    mockPush.mockImplementation(() => {})
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Payment failed" })
    })

    vi.spyOn(global, "fetch").mockImplementation(mockFetch)

    render(<PricingCard {...defaultProps} priceId="price_123" />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    await vi.waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalled()
      },
      { timeout: 1000 }
    )

    await vi.waitFor(
      () => {
        expect(screen.queryByTestId("loader-2-icon")).not.toBeInTheDocument()
      },
      { timeout: 1000 }
    )

    expect(screen.getByTestId("payment-error")).toBeInTheDocument()
    expect(screen.getByText("Payment failed")).toBeInTheDocument()
  })
})
