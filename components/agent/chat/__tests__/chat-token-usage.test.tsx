/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatTokenUsage, CHAT_TOKEN_SOFT_LIMIT } from "../chat-token-usage"
import * as auiModule from "@assistant-ui/react"
import * as tokenUsageHookModule from "@/lib/hooks/use-chat-session-token-usage"
import * as chatStoreModule from "@/lib/store/chat"

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

vi.mock("@assistant-ui/react", async () => {
  const actual = await vi.importActual("@assistant-ui/react")

  return {
    ...actual,
    useAuiState: vi.fn()
  }
})

vi.mock("@/lib/hooks/use-chat-session-token-usage", () => ({
  useChatSessionTokenUsage: vi.fn()
}))

vi.mock("@/lib/store/chat", () => ({
  useChatSessionIdValue: vi.fn()
}))

describe("ChatTokenUsage", () => {
  beforeEach(() => {
    vi.mocked(chatStoreModule.useChatSessionIdValue).mockReturnValue(
      "session-1"
    )
    vi.mocked(auiModule.useAuiState).mockImplementation((selector: any) =>
      selector({
        thread: {
          isRunning: false,
          messages: []
        }
      })
    )
  })

  it("should render only the progress bar by default", () => {
    vi.mocked(tokenUsageHookModule.useChatSessionTokenUsage).mockReturnValue({
      tokenUsage: {
        sessionId: "session-1",
        totalTokens: 12345,
        totalInputTokens: 8000,
        totalOutputTokens: 3000,
        totalCachedTokens: 1000,
        totalReasoningTokens: 345
      },
      isLoading: false,
      error: null
    })

    render(<ChatTokenUsage />)

    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("should render tooltip detail rows", () => {
    vi.mocked(tokenUsageHookModule.useChatSessionTokenUsage).mockReturnValue({
      tokenUsage: {
        sessionId: "session-1",
        totalTokens: 12345,
        totalInputTokens: 8000,
        totalOutputTokens: 3000,
        totalCachedTokens: 1000,
        totalReasoningTokens: 345
      },
      isLoading: false,
      error: null
    })

    render(<ChatTokenUsage />)

    expect(screen.getByText("tokenUsageDetails")).toBeInTheDocument()
    expect(screen.getByText("tokenInput")).toBeInTheDocument()
    expect(screen.getByText("8,000")).toBeInTheDocument()
    expect(screen.getByText("12,345")).toBeInTheDocument()
  })

  it("should show unavailable message when request fails", () => {
    vi.mocked(tokenUsageHookModule.useChatSessionTokenUsage).mockReturnValue({
      tokenUsage: null,
      isLoading: false,
      error: new Error("Failed to fetch token usage")
    })

    render(<ChatTokenUsage />)

    expect(screen.getByText("tokenUsageUnavailable")).toBeInTheDocument()
  })

  it("should use warning color when usage is near the soft limit", () => {
    vi.mocked(tokenUsageHookModule.useChatSessionTokenUsage).mockReturnValue({
      tokenUsage: {
        sessionId: "session-1",
        totalTokens: CHAT_TOKEN_SOFT_LIMIT * 0.75,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCachedTokens: 0,
        totalReasoningTokens: 0
      },
      isLoading: false,
      error: null
    })

    const { container } = render(<ChatTokenUsage />)

    const indicator = container.querySelector(
      "[data-slot='progress-indicator']"
    )

    expect(indicator).toHaveClass("bg-amber-500")
  })
})
