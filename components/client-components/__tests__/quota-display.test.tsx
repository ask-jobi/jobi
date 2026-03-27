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

    expect(screen.getByTestId("ui-badge")).toHaveTextContent("pro30Days")
  })

  it("should display expiry date", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByText("validUntil")).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it("should display quota usage with progress bars", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByText("blockOptimization")).toBeInTheDocument()
    expect(screen.getByText("motivationLetter")).toBeInTheDocument()
    expect(screen.getByText("chatTokens")).toBeInTheDocument()
    expect(screen.getAllByTestId("ui-progress")).toHaveLength(2)
  })

  it("should display used/total quotas", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByText("3 / 20")).toBeInTheDocument()
    expect(screen.getByText("2 / 5")).toBeInTheDocument()
    expect(screen.getByText("100,000,000")).toBeInTheDocument()
  })

  it("should show renew button when subscription is active", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(
      screen.getByRole("button", { name: "renewPlan" })
    ).toBeInTheDocument()
  })

  it("should show buy button when subscription is not active", () => {
    const inactiveSubscription = { ...defaultSubscription, isActive: false }
    render(<QuotaDisplay subscription={inactiveSubscription} />)

    expect(screen.getByRole("button", { name: "buyPlan" })).toBeInTheDocument()
  })

  it("should show upgrade button for LITE plan", () => {
    const liteSubscription = { ...defaultSubscription, plan: "LITE" as const }
    render(<QuotaDisplay subscription={liteSubscription} />)

    expect(
      screen.getByRole("button", { name: "upgradeToPro" })
    ).toBeInTheDocument()
  })

  it("should calculate correct usage percentage", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    const progressBars = screen.getAllByTestId("ui-progress")
    const indicators = progressBars.map((bar) =>
      bar.querySelector('[data-slot="progress-indicator"]')
    )
    expect(indicators[0]).toHaveStyle({ transform: "translateX(-85%)" })
    expect(indicators[1]).toHaveStyle({ transform: "translateX(-60%)" })
  })

  it("should display no active plan message when expiry date is null", () => {
    const noPlanSubscription = { ...defaultSubscription, expiryDate: null }
    render(<QuotaDisplay subscription={noPlanSubscription} />)

    expect(screen.getByText("noActivePlan")).toBeInTheDocument()
  })

  it("should handle zero total quota", () => {
    const zeroQuotaSubscription = {
      ...defaultSubscription,
      quotas: {
        fullOptimize: { used: 0, total: 0 },
        blockOptimize: { used: 0, total: 0 },
        motivationLetter: { used: 0, total: 0 }
      },
      chatTokenLimit: 0
    }
    render(<QuotaDisplay subscription={zeroQuotaSubscription} />)

    const usages = screen.getAllByText(/0 \/ 0/)
    expect(usages).toHaveLength(2)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("should display correct badge for LITE plan", () => {
    const liteSubscription = { ...defaultSubscription, plan: "LITE" as const }
    render(<QuotaDisplay subscription={liteSubscription} />)

    expect(screen.getByTestId("ui-badge")).toHaveTextContent("lite14Days")
  })

  it("should display correct badge for FREE plan", () => {
    const freeSubscription = { ...defaultSubscription, plan: "FREE" as const }
    render(<QuotaDisplay subscription={freeSubscription} />)

    expect(screen.getByTestId("ui-badge")).toHaveTextContent("freeTrial")
  })

  it("should handle subscription with null plan", () => {
    const nullPlanSubscription = { ...defaultSubscription, plan: null }
    render(<QuotaDisplay subscription={nullPlanSubscription} />)

    expect(screen.getByTestId("ui-badge")).toHaveTextContent("noPlan")
  })

  it("should show upgrade button for FREE plan", () => {
    const freeSubscription = {
      ...defaultSubscription,
      plan: "FREE" as const,
      isActive: false
    }
    render(<QuotaDisplay subscription={freeSubscription} />)

    expect(screen.getByRole("button", { name: "buyPlan" })).toBeInTheDocument()
  })

  it("should show both renew and upgrade buttons for LITE plan when active", () => {
    const liteActiveSubscription = {
      ...defaultSubscription,
      plan: "LITE" as const,
      isActive: true
    }
    render(<QuotaDisplay subscription={liteActiveSubscription} />)

    expect(
      screen.getByRole("button", { name: "renewPlan" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "upgradeToPro" })
    ).toBeInTheDocument()
  })
})
