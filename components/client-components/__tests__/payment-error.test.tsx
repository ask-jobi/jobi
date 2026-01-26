/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { PaymentError } from "../payment-error"

describe("PaymentError", () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should not render when there is no error", () => {
    render(<PaymentError error={undefined} onClose={mockOnClose} />)

    expect(screen.queryByTestId("payment-error")).not.toBeInTheDocument()
  })

  it("should not render when error is empty string", () => {
    render(<PaymentError error="" onClose={mockOnClose} />)

    expect(screen.queryByTestId("payment-error")).not.toBeInTheDocument()
  })

  it("should render error card when there is an error", () => {
    render(<PaymentError error="Payment failed" onClose={mockOnClose} />)

    expect(screen.getByTestId("payment-error")).toBeInTheDocument()
    expect(screen.getByText("pricing.paymentError.title")).toBeInTheDocument()
    expect(screen.getByText("Payment failed")).toBeInTheDocument()
  })

  it("should call onClose when close button is clicked", () => {
    render(<PaymentError error="Payment failed" onClose={mockOnClose} />)

    const closeButton = screen.getByTestId("ui-button")
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("should automatically hide after 5 seconds", () => {
    vi.useFakeTimers()

    render(<PaymentError error="Payment failed" onClose={mockOnClose} />)

    expect(screen.getByTestId("payment-error")).toBeInTheDocument()

    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000)

    expect(mockOnClose).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it("should clear timeout when unmounted", () => {
    vi.useFakeTimers()

    const { unmount } = render(
      <PaymentError error="Payment failed" onClose={mockOnClose} />
    )

    expect(screen.getByTestId("payment-error")).toBeInTheDocument()

    // Unmount the component before the timeout
    unmount()

    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000)

    // onClose should not have been called
    expect(mockOnClose).not.toHaveBeenCalled()

    vi.useRealTimers()
  })
})
