/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

import { QuotaDisplay } from "../quota-display"

describe("QuotaDisplay", () => {
  const defaultSubscription = {
    plan: "PRO" as const,
    planName: "Pro Plan",
    expiryDate: "2025-12-31",
    isActive: true,
    chatTokenLimit: 100000000,
    chatTokenUsed: 25000000,
    quotas: {
      fullOptimize: { used: 5, total: 10 },
      blockOptimize: { used: 3, total: 20 },
      motivationLetter: { used: 2, total: 5 }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render with subscription data", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByTestId("ui-card")).toBeInTheDocument()
    expect(screen.getByTestId("ui-card-header")).toBeInTheDocument()
    expect(screen.getByTestId("ui-card-content")).toBeInTheDocument()
  })

  it("should display plan name as badge", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByTestId("ui-badge")).toHaveTextContent("planPro")
  })

  it("should display token total, used, and remaining", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByText("tokenTotal")).toBeInTheDocument()
    expect(screen.getByText("tokenUsed")).toBeInTheDocument()
    expect(screen.getByText("tokenRemaining")).toBeInTheDocument()
    expect(screen.getByText("100,000,000")).toBeInTheDocument()
    expect(screen.getByText("25,000,000")).toBeInTheDocument()
    expect(screen.getByText("75,000,000")).toBeInTheDocument()
  })

  it("should not display legacy quota labels", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.queryByText("blockOptimization")).not.toBeInTheDocument()
    expect(screen.queryByText("motivationLetter")).not.toBeInTheDocument()
    expect(screen.queryByText("chatTokens")).not.toBeInTheDocument()
  })

  it("should display correct badge for LITE plan", () => {
    const liteSubscription = { ...defaultSubscription, plan: "LITE" as const }
    render(<QuotaDisplay subscription={liteSubscription} />)

    expect(screen.getByTestId("ui-badge")).toHaveTextContent("planLite")
  })

  it("should display correct badge for FREE plan", () => {
    const freeSubscription = { ...defaultSubscription, plan: "FREE" as const }
    render(<QuotaDisplay subscription={freeSubscription} />)

    expect(screen.getByTestId("ui-badge")).toHaveTextContent("planFree")
  })

  it("should handle zero token totals", () => {
    const zeroQuotaSubscription = {
      ...defaultSubscription,
      chatTokenLimit: 0,
      chatTokenUsed: 0
    }
    render(<QuotaDisplay subscription={zeroQuotaSubscription} />)

    expect(screen.getAllByText("0")).toHaveLength(3)
  })

  it("should display used and remaining tokens from compatibility fields", () => {
    const customTokenSubscription = {
      ...defaultSubscription,
      chatTokenLimit: 500000,
      chatTokenUsed: 120000
    }
    render(<QuotaDisplay subscription={customTokenSubscription} />)

    expect(screen.getByText("500,000")).toBeInTheDocument()
    expect(screen.getByText("120,000")).toBeInTheDocument()
    expect(screen.getByText("380,000")).toBeInTheDocument()
  })
})
