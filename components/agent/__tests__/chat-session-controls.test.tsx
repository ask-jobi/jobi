/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatSessionControls } from "../chat-session-controls"
import * as chatSessionModule from "@/lib/hooks/use-chat-session"

const mockOpenRightPanel = vi.fn()

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("jotai", async () => {
  const actual = await vi.importActual<typeof import("jotai")>("jotai")

  return {
    ...actual,
    useSetAtom: () => mockOpenRightPanel
  }
})

vi.mock("@/lib/hooks/use-chat-session", () => ({
  useChatSessionState: vi.fn()
}))

describe("ChatSessionControls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chatSessionModule.useChatSessionState).mockReturnValue({
      session: null,
      loading: false,
      error: null,
      refreshSession: vi.fn(),
      updateSessionTitleLocally: vi.fn()
    })
  })

  it("should render the current session title", () => {
    vi.mocked(chatSessionModule.useChatSessionState).mockReturnValue({
      session: {
        id: "session-1",
        title: "Tailor for product role",
        resumeId: "resume-1",
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        messageCount: 1
      },
      loading: false,
      error: null,
      refreshSession: vi.fn(),
      updateSessionTitleLocally: vi.fn()
    })

    render(<ChatSessionControls />)

    expect(screen.getByText("Tailor for product role")).toBeInTheDocument()
  })

  it("should render the fallback title for a default session title", () => {
    vi.mocked(chatSessionModule.useChatSessionState).mockReturnValue({
      session: {
        id: "session-1",
        title: "New Chat",
        resumeId: "resume-1",
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        messageCount: 0
      },
      loading: false,
      error: null,
      refreshSession: vi.fn(),
      updateSessionTitleLocally: vi.fn()
    })

    render(<ChatSessionControls />)

    expect(screen.getByText("sessionFallbackTitle")).toBeInTheDocument()
  })

  it("should close the chat panel", () => {
    render(<ChatSessionControls />)

    fireEvent.click(screen.getByRole("button", { name: /close/i }))

    expect(mockOpenRightPanel).toHaveBeenCalledWith("evaluation")
  })
})
