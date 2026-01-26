/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { PaymentCancelledAlert } from "../payment-cancelled-alert"

describe("PaymentCancelledAlert", () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should render alert when isVisible is true", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    expect(screen.getByTestId("payment-cancelled-alert")).toBeInTheDocument()
  })

  it("should not render when isVisible is false", () => {
    render(<PaymentCancelledAlert isVisible={false} onClose={mockOnClose} />)

    expect(
      screen.queryByTestId("payment-cancelled-alert")
    ).not.toBeInTheDocument()
  })

  it("should call onClose when close button is clicked", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    const closeButton = screen.getByTestId("close-button")
    fireEvent.click(closeButton)

    vi.advanceTimersByTime(300)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it("should auto hide after 5 seconds", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    vi.advanceTimersByTime(5000)
    vi.advanceTimersByTime(300)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it("should have correct styling classes", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    const card = screen.getByTestId("payment-cancelled-alert")
    expect(card).toHaveClass("border-orange-200")
    expect(card).toHaveClass("bg-orange-50")
  })
})
