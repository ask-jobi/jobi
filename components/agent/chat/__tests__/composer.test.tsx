/**
 * @vitest-environment jsdom
 */
import type { FormEvent, ReactNode, TextareaHTMLAttributes } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Composer } from "../composer"

const mockSetPendingChatAction = vi.fn()
const mockSetText = vi.fn()

let composerState = {
  text: "Help me improve this resume",
  isEditing: true,
  isEmpty: false
}

let threadState = {
  isRunning: false
}

let lifecycle = "loading-history"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("@/lib/store/resume", () => ({
  useApplicationResume: () => ({
    application: {
      resume: {
        id: "resume-123"
      }
    }
  })
}))

vi.mock("@/lib/store/chat", () => ({
  useSetPendingChatAction: () => mockSetPendingChatAction
}))

vi.mock("@assistant-ui/react", () => ({
  ComposerPrimitive: {
    Root: ({
      children,
      onSubmit,
      className
    }: {
      children: ReactNode
      onSubmit?: (event: FormEvent<HTMLFormElement>) => void
      className?: string
    }) => (
      <form onSubmit={onSubmit} className={className}>
        {children}
      </form>
    ),
    Input: (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
      <textarea {...props} />
    ),
    Cancel: ({ children }: { children: ReactNode }) => children
  },
  AuiIf: ({
    condition,
    children
  }: {
    condition: (state: {
      thread: typeof threadState
      composer: typeof composerState
    }) => boolean
    children: ReactNode
  }) =>
    condition({ thread: threadState, composer: composerState })
      ? children
      : null,
  useAui: () => ({
    composer: () => ({
      getState: () => composerState,
      setText: mockSetText
    })
  }),
  useAuiState: (
    selector: (state: {
      thread: typeof threadState
      composer: typeof composerState
    }) => boolean
  ) => selector({ thread: threadState, composer: composerState })
}))

describe("Composer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lifecycle = "loading-history"
    composerState = {
      text: "Help me improve this resume",
      isEditing: true,
      isEmpty: false
    }
    threadState = {
      isRunning: false
    }
  })

  it("queues a pending send action before the thread is ready", () => {
    render(<Composer lifecycle={lifecycle as "loading-history"} />)

    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    expect(mockSetPendingChatAction).toHaveBeenCalledTimes(1)
    expect(mockSetPendingChatAction).toHaveBeenCalledWith(
      expect.objectContaining({
        resumeId: "resume-123",
        message: "Help me improve this resume"
      })
    )
    expect(mockSetText).toHaveBeenCalledWith("")
  })

  it("lets assistant-ui handle sends after a chat error", () => {
    render(<Composer lifecycle="error" />)

    fireEvent.click(screen.getByRole("button", { name: "Send message" }))

    expect(mockSetPendingChatAction).not.toHaveBeenCalled()
    expect(mockSetText).not.toHaveBeenCalled()
  })

  it("does not queue when the composer is empty", () => {
    composerState = {
      text: "   ",
      isEditing: true,
      isEmpty: true
    }

    render(<Composer lifecycle={lifecycle as "loading-history"} />)

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled()
  })
})
