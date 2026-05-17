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
    tokenAmount: "1,000,000 Tokens",
    description: "Best for heavy usage",
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
    expect(screen.getByText("Best for heavy usage")).toBeInTheDocument()
    expect(screen.getByText("1,000,000 Tokens")).toBeInTheDocument()
    expect(screen.getByText("Feature 1")).toBeInTheDocument()
    expect(screen.getByText("Feature 2")).toBeInTheDocument()
    // Use a more flexible matcher for button text
    const buttons = screen.getAllByText(/Get Started/i)
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("should show popular badge when isPopular is true", () => {
    render(<PricingCard {...defaultProps} isPopular={true} />)

    expect(screen.getByText("pricing.mostPopular")).toBeInTheDocument()
  })

  it("should not show popular badge when isPopular is false", () => {
    render(<PricingCard {...defaultProps} isPopular={false} />)

    expect(screen.queryByText("pricing.mostPopular")).not.toBeInTheDocument()
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

  it("should render token amount even when feature list is empty", () => {
    render(
      <PricingCard
        {...defaultProps}
        features={[]}
        tokenAmount="500,000 Tokens"
      />
    )

    expect(screen.getByText("500,000 Tokens")).toBeInTheDocument()
  })

  it("should handle free plan selection", async () => {
    mockUseAuth.user = { id: "user123" } as any
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ message: "Free token grant created successfully" })
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

  it("should show ALREADY_TRIED error when user has tried before", async () => {
    mockUseAuth.user = { id: "user123" } as any
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: "您已经试用过该产品，请选择付费套餐继续使用",
          code: "ALREADY_TRIED"
        })
    })

    render(<PricingCard {...defaultProps} priceId={undefined} />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(screen.getByTestId("payment-error")).toBeInTheDocument()
    })
  })

  it("should handle network error during free pass creation", async () => {
    mockUseAuth.user = { id: "user123" } as any
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"))

    render(<PricingCard {...defaultProps} priceId={undefined} />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(screen.getByTestId("payment-error")).toBeInTheDocument()
    })
  })

  it("should redirect to checkout URL on successful payment", async () => {
    mockUseAuth.user = { id: "user123" } as any
    let locationHrefValue = ""
    Object.defineProperty(global, "location", {
      value: {
        get href() {
          return locationHrefValue
        },
        set href(value: string) {
          locationHrefValue = value
        }
      },
      writable: true
    })

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ url: "https://checkout.stripe.com/pay/cs_test_123" })
    })

    render(<PricingCard {...defaultProps} priceId="price_123" />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    await vi.waitFor(
      () => {
        expect(locationHrefValue).toBe(
          "https://checkout.stripe.com/pay/cs_test_123"
        )
      },
      { timeout: 2000 }
    )
  })

  it("should disable button during loading state", async () => {
    mockUseAuth.user = { id: "user123" } as any
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })
    global.fetch = vi.fn().mockReturnValueOnce(fetchPromise)

    render(<PricingCard {...defaultProps} priceId={undefined} />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    // Button should be disabled during loading
    expect(button.closest("button")).toBeDisabled()

    // Resolve the fetch
    resolveFetch!({
      ok: true,
      json: () =>
        Promise.resolve({ message: "Free token grant created successfully" })
    })

    await vi.waitFor(() => {
      expect(button.closest("button")).not.toBeDisabled()
    })
  })

  it("should handle 401 response by redirecting to login", async () => {
    mockUseAuth.user = { id: "user123" } as any
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" })
    })

    render(<PricingCard {...defaultProps} priceId="price_123" />)

    const button = screen.getByText("Get Started")
    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/auth/login?callbackUrl=%2Fpricing"
      )
    })
  })
})
