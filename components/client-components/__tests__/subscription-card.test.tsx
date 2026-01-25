/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { SubscriptionCard } from "../subscription-card"

// Mock QuotaDisplay component
vi.mock("../quota-display", () => ({
  QuotaDisplay: ({ subscription }: { subscription: any }) => (
    <div data-testid="quota-display">
      Quota Display for {subscription.planName}
    </div>
  )
}))

describe("SubscriptionCard", () => {
  const mockSubscription = {
    plan: "PRO",
    planName: "Pro Plan",
    expiryDate: "2025-12-31",
    isActive: true,
    quotas: {
      fullOptimize: { used: 5, total: 10 },
      blockOptimize: { used: 3, total: 20 },
      motivationLetter: { used: 2, total: 5 }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should show loading state initially", () => {
    // Mock fetch to not resolve immediately
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))

    const { container } = render(<SubscriptionCard />)

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("should render QuotaDisplay when subscription data is loaded", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubscription)
    })

    render(<SubscriptionCard />)

    // Wait for the component to update
    await screen.findByTestId("quota-display")

    expect(screen.getByTestId("quota-display")).toBeInTheDocument()
    expect(screen.getByText("Quota Display for Pro Plan")).toBeInTheDocument()
  })

  it("should show error message when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false
    })

    render(<SubscriptionCard />)

    // Wait for the component to update
    await screen.findByText("loadingSubscriptionError")

    expect(screen.getByText("loadingSubscriptionError")).toBeInTheDocument()
  })

  it("should show failed to load message when data is null", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null)
    })

    render(<SubscriptionCard />)

    // Wait for the component to update
    await screen.findByText("failedToLoadSubscription")

    expect(screen.getByText("failedToLoadSubscription")).toBeInTheDocument()
  })
})
