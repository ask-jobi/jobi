/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PaymentSuccessActions } from "../payment-success-actions"

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh
  })
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, className, size }: any) => (
    <button
      className={className}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}))

describe("PaymentSuccessActions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it("disables dashboard action until checkout status is processed", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ processed: false })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ processed: true })
      } as Response)

    render(
      <PaymentSuccessActions
        sessionId="cs_test_123"
        checkingLabel="Checking payment status"
        delayedLabel="Payment received. Tokens may take a moment to appear."
        dashboardLabel="Go to dashboard"
        homeLabel="Back to home"
      />
    )

    expect(
      screen.getByRole("button", { name: "Checking payment status" })
    ).toBeDisabled()

    await act(async () => {
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(2000)
      await Promise.resolve()
    })

    expect(
      screen.getByRole("button", { name: "Go to dashboard" })
    ).toBeEnabled()

    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/stripe/checkout-status?session_id=cs_test_123",
      { cache: "no-store" }
    )
  })

  it("keeps dashboard action enabled when session id is missing", () => {
    render(
      <PaymentSuccessActions
        checkingLabel="Checking payment status"
        delayedLabel="Payment received. Tokens may take a moment to appear."
        dashboardLabel="Go to dashboard"
        homeLabel="Back to home"
      />
    )

    expect(
      screen.getByRole("button", { name: "Go to dashboard" })
    ).toBeEnabled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("uses constrained responsive action sizing", () => {
    render(
      <PaymentSuccessActions
        checkingLabel="Checking payment status"
        delayedLabel="Payment received. Tokens may take a moment to appear."
        dashboardLabel="Go to dashboard"
        homeLabel="Back to home"
      />
    )

    expect(screen.getByTestId("payment-success-actions")).toHaveClass(
      "grid",
      "sm:grid-cols-2"
    )
    expect(screen.getByRole("button", { name: "Go to dashboard" })).toHaveClass(
      "min-w-0",
      "whitespace-normal"
    )
    expect(screen.getByRole("button", { name: "Back to home" })).toHaveClass(
      "min-w-0",
      "whitespace-normal"
    )
  })
})
