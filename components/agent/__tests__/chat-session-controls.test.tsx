/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatSessionControls } from "../chat-session-controls"
import * as chatSessionsModule from "@/lib/hooks/use-chat-sessions"
import * as activeSessionModule from "@/lib/hooks/use-active-chat-session"

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

vi.mock("@/lib/hooks/use-chat-sessions", () => ({
  useChatSessionsState: vi.fn()
}))

vi.mock("@/lib/hooks/use-active-chat-session", () => ({
  useActiveChatSession: vi.fn()
}))

describe("ChatSessionControls", () => {
  const selectSession = vi.fn()
  const activateNewSession = vi.fn()
  const createSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chatSessionsModule.useChatSessionsState).mockReturnValue({
      sessions: [],
      loading: false,
      creating: false,
      error: null,
      createSession,
      refreshSessions: vi.fn(),
      updateSessionTitleLocally: vi.fn()
    })
    vi.mocked(activeSessionModule.useActiveChatSession).mockReturnValue({
      activeSessionId: "",
      selectSession,
      activateNewSession,
      clearActiveSession: vi.fn()
    })
  })

  it("should render session titles and highlight the active session", () => {
    vi.mocked(chatSessionsModule.useChatSessionsState).mockReturnValue({
      sessions: [
        {
          id: "session-1",
          title: "Tailor for product role",
          resumeId: "resume-1",
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          messageCount: 1
        },
        {
          id: "session-2",
          title: "New Chat",
          resumeId: "resume-1",
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          messageCount: 0
        }
      ],
      loading: false,
      creating: false,
      error: null,
      createSession,
      refreshSessions: vi.fn(),
      updateSessionTitleLocally: vi.fn()
    })
    vi.mocked(activeSessionModule.useActiveChatSession).mockReturnValue({
      activeSessionId: "session-1",
      selectSession,
      activateNewSession,
      clearActiveSession: vi.fn()
    })

    render(<ChatSessionControls />)

    expect(screen.getByText("Tailor for product role")).toBeInTheDocument()
    expect(screen.getByText("sessionFallbackTitle 2")).toBeInTheDocument()
  })

  it("should call the create handler and activate the new session", async () => {
    createSession.mockResolvedValue({ id: "session-3" })

    render(<ChatSessionControls />)

    fireEvent.click(screen.getByRole("button", { name: /newSession/i }))

    expect(createSession).toHaveBeenCalledTimes(1)
    await Promise.resolve()
    expect(activateNewSession).toHaveBeenCalledWith("session-3")
  })

  it("should call the select handler when a session is clicked", () => {
    vi.mocked(chatSessionsModule.useChatSessionsState).mockReturnValue({
      sessions: [
        {
          id: "session-1",
          title: "Tailor for frontend role",
          resumeId: "resume-1",
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          messageCount: 3
        }
      ],
      loading: false,
      creating: false,
      error: null,
      createSession,
      refreshSessions: vi.fn(),
      updateSessionTitleLocally: vi.fn()
    })

    render(<ChatSessionControls />)

    fireEvent.click(
      screen.getByRole("button", { name: /Tailor for frontend role/i })
    )

    expect(selectSession).toHaveBeenCalledWith("session-1")
  })

  it("should close the chat panel", () => {
    render(<ChatSessionControls />)

    fireEvent.click(screen.getByRole("button", { name: /close/i }))

    expect(mockOpenRightPanel).toHaveBeenCalledWith("evaluation")
  })
})
