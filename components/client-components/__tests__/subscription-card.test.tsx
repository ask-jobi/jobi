/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { SubscriptionCard } from "../subscription-card"

// Mock QuotaDisplay component
vi.mock("../quota-display", () => ({
  QuotaDisplay: ({ tokenBalance }: { tokenBalance: any }) => (
    <div data-testid="quota-display">
      Token Balance for {tokenBalance.plan ?? "NONE"}
    </div>
  )
}))

describe("SubscriptionCard", () => {
  const mockSubscription = {
    plan: "PRO",
    chatTokenLimit: 100000000,
    chatTokenUsed: 25000000,
    chatTokenRemaining: 75000000
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
    expect(screen.getByText("Token Balance for PRO")).toBeInTheDocument()
  })

  it("should show error message when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false
    })

    render(<SubscriptionCard />)

    // Wait for the component to update
    await screen.findByText("loadingTokenBalanceError")

    expect(screen.getByText("loadingTokenBalanceError")).toBeInTheDocument()
  })

  it("should show failed to load message when data is null", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null)
    })

    render(<SubscriptionCard />)

    // Wait for the component to update
    await screen.findByText("failedToLoadTokenBalance")

    expect(screen.getByText("failedToLoadTokenBalance")).toBeInTheDocument()
  })
})
