/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, within } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { CompactPlanDisplay } from "../compact-plan-display"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock UI components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange: _onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <div data-testid="dialog-title">{children}</div>
  ),
  DialogTrigger: ({ children }: any) => (
    <div data-testid="dialog-trigger">{children}</div>
  )
}))

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  Tooltip: ({ children, open: _open, defaultOpen: _defaultOpen }: any) => (
    <div data-testid="tooltip">{children}</div>
  ),
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipTrigger: ({ children }: any) => (
    <div data-testid="tooltip-trigger">{children}</div>
  )
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant: _variant, className }: any) => (
    <div data-testid="badge" className={className}>
      {children}
    </div>
  )
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, className, type: _type }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  )
}))

vi.mock("lucide-react", () => ({
  Package: () => <div data-testid="icon-package">Package Icon</div>,
  Info: () => <div data-testid="icon-info">Info Icon</div>
}))

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

describe("CompactPlanDisplay", () => {
  const defaultSubscription = {
    plan: "PRO" as const,
    chatTokenLimit: 100000000,
    chatTokenUsed: 25000000,
    chatTokenRemaining: 75000000
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    vi.spyOn(global, "fetch").mockRestore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render subscription button", () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise<Response>(() => {})
    )

    render(<CompactPlanDisplay />)

    expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it("should show no plan badge when subscription is null", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false
    } as Response)

    render(<CompactPlanDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId("badge")).toBeInTheDocument()
    })

    consoleError.mockRestore()
  })

  it("should render token summary when loaded", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(defaultSubscription)
    } as Response)

    render(<CompactPlanDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId("badge")).toBeInTheDocument()
    })

    expect(screen.getByTestId("badge")).toHaveTextContent("planPro")
    const dialogContent = screen.getByTestId("dialog-content")
    expect(within(dialogContent).getByText("tokenTotal")).toBeInTheDocument()
    expect(within(dialogContent).getByText("tokenUsed")).toBeInTheDocument()
    expect(within(dialogContent).getByText("tokenRemaining")).toBeInTheDocument()
    expect(within(dialogContent).getByText("100,000,000")).toBeInTheDocument()
    expect(within(dialogContent).getByText("25,000,000")).toBeInTheDocument()
    expect(within(dialogContent).getByText("75,000,000")).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it("should not render legacy quota labels", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(defaultSubscription)
    } as Response)

    render(<CompactPlanDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId("badge")).toBeInTheDocument()
    })

    expect(screen.queryByText("blockOptimization")).not.toBeInTheDocument()
    expect(screen.queryByText("motivationLetter")).not.toBeInTheDocument()
    expect(screen.queryByText("chatTokens")).not.toBeInTheDocument()

    consoleError.mockRestore()
  })

  it("should handle fetch error gracefully", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"))

    render(<CompactPlanDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument()
    })

    consoleError.mockRestore()
  })
})
