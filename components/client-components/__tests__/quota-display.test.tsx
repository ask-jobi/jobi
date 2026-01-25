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

    expect(screen.getByTestId("card")).toBeInTheDocument()
    expect(screen.getByTestId("card-header")).toBeInTheDocument()
    expect(screen.getByTestId("card-content")).toBeInTheDocument()
  })

  it("should display plan name as badge", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByTestId("badge")).toHaveTextContent("pro30Days")
  })

  it("should display expiry date", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByText("validUntil")).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it("should display quota usage with progress bars", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByText("fullOptimization")).toBeInTheDocument()
    expect(screen.getByText("blockOptimization")).toBeInTheDocument()
    expect(screen.getByText("motivationLetter")).toBeInTheDocument()
    expect(screen.getAllByTestId("progress")).toHaveLength(3)
  })

  it("should display used/total quotas", () => {
    render(<QuotaDisplay subscription={defaultSubscription} />)

    expect(screen.getByText("5 / 10")).toBeInTheDocument()
    expect(screen.getByText("3 / 20")).toBeInTheDocument()
    expect(screen.getByText("2 / 5")).toBeInTheDocument()
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

    const progressBars = screen.getAllByTestId("progress")
    expect(progressBars[0]).toHaveAttribute("value", "50")
    expect(progressBars[1]).toHaveAttribute("value", "15")
    expect(progressBars[2]).toHaveAttribute("value", "40")
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
      }
    }
    render(<QuotaDisplay subscription={zeroQuotaSubscription} />)

    const usages = screen.getAllByText(/0 \/ 0/)
    expect(usages).toHaveLength(3)
  })
})
