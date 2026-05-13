/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ApplicationTokenUsage } from "../application-token-usage"
import { TOKEN_BALANCE_UPDATED_EVENT } from "@/lib/token-balance-events"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  )
}))

describe("ApplicationTokenUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders aggregated token usage summary", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          plan: "PRO",
          chatTokenLimit: 20000,
          chatTokenUsed: 12450,
          chatTokenRemaining: 7550
        })
    } as Response)

    render(<ApplicationTokenUsage />)

    await waitFor(() => {
      expect(screen.getByText("12,450 / 20,000")).toBeInTheDocument()
    })

    expect(screen.getByText("tokenHeader")).toBeInTheDocument()
    expect(screen.getByText("currentPlan")).toBeInTheDocument()
    expect(screen.getByText("planPro")).toBeInTheDocument()
    expect(screen.getByText("tokenRemaining")).toBeInTheDocument()
    expect(screen.getByText("7,550")).toBeInTheDocument()
  })

  it("renders fallback state when request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false
    } as Response)

    render(<ApplicationTokenUsage />)

    await waitFor(() => {
      expect(screen.getByText("-- / --")).toBeInTheDocument()
    })

    expect(screen.getByText("failedToLoadTokenBalance")).toBeInTheDocument()
  })

  it("refreshes immediately when token balance update event is emitted", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            plan: "PRO",
            chatTokenLimit: 20000,
            chatTokenUsed: 12000,
            chatTokenRemaining: 8000
          })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            plan: "PRO",
            chatTokenLimit: 20000,
            chatTokenUsed: 12450,
            chatTokenRemaining: 7550
          })
      } as Response)

    render(<ApplicationTokenUsage />)

    await waitFor(() => {
      expect(screen.getByText("12,000 / 20,000")).toBeInTheDocument()
    })

    window.dispatchEvent(new Event(TOKEN_BALANCE_UPDATED_EVENT))

    await waitFor(() => {
      expect(screen.getByText("12,450 / 20,000")).toBeInTheDocument()
    })
  })
})
