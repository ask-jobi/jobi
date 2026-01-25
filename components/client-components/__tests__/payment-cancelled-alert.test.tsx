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

    expect(screen.getByTestId("card")).toBeInTheDocument()
    expect(screen.getByTestId("card-title")).toBeInTheDocument()
    expect(screen.getByTestId("card-description")).toBeInTheDocument()
  })

  it("should not render when isVisible is false", () => {
    render(<PaymentCancelledAlert isVisible={false} onClose={mockOnClose} />)

    expect(screen.queryByTestId("card")).not.toBeInTheDocument()
  })

  it("should call onClose when close button is clicked", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    const closeButton = screen.getByTestId("x-icon").closest("button")
    fireEvent.click(closeButton!)

    vi.advanceTimersByTime(300)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it("should show alert icon", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    expect(screen.getByTestId("alert-circle-icon")).toBeInTheDocument()
  })

  it("should auto hide after 5 seconds", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    vi.advanceTimersByTime(5000)
    vi.advanceTimersByTime(300)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it("should have correct styling classes", () => {
    render(<PaymentCancelledAlert isVisible={true} onClose={mockOnClose} />)

    const card = screen.getByTestId("card")
    expect(card).toHaveClass("border-orange-200")
    expect(card).toHaveClass("bg-orange-50")
  })
})
