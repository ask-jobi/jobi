/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatHandoffEffect } from "../chat/chat-handoff-effect"

const mockAppend = vi.fn()
const mockUseAuiState = vi.fn()

vi.mock("@assistant-ui/react", () => ({
  useAui: () => ({
    thread: () => ({
      append: mockAppend
    }),
    composer: () => ({
      getState: () => ({
        runConfig: { model: "test" }
      })
    })
  }),
  useAuiState: (
    selector: (state: { thread: { isRunning: boolean } }) => boolean
  ) => mockUseAuiState(selector),
  AssistantRuntimeProvider: ({ children }: { children: ReactNode }) => children,
  ThreadPrimitive: {
    Root: ({ children }: { children: ReactNode }) => children
  }
}))

describe("ChatHandoffEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuiState.mockImplementation((selector) =>
      selector({ thread: { isRunning: false } })
    )
  })

  it("should append the pending handoff message once and consume it", () => {
    const onConsumed = vi.fn()

    const { rerender } = render(
      <ChatHandoffEffect
        handoff={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        resumeId="resume-123"
        isInitialLoading={false}
        onConsumed={onConsumed}
      />
    )

    rerender(
      <ChatHandoffEffect
        handoff={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        resumeId="resume-123"
        isInitialLoading={false}
        onConsumed={onConsumed}
      />
    )

    expect(mockAppend).toHaveBeenCalledTimes(1)
    expect(mockAppend).toHaveBeenCalledWith({
      content: [{ type: "text", text: "让我帮您优化简历..." }],
      runConfig: { model: "test" }
    })
    expect(onConsumed).toHaveBeenCalledTimes(1)
  })

  it("should not append while initial history is loading", () => {
    render(
      <ChatHandoffEffect
        handoff={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        resumeId="resume-123"
        isInitialLoading={true}
        onConsumed={vi.fn()}
      />
    )

    expect(mockAppend).not.toHaveBeenCalled()
  })

  it("should not append when the handoff belongs to a different resume", () => {
    render(
      <ChatHandoffEffect
        handoff={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        resumeId="resume-456"
        isInitialLoading={false}
        onConsumed={vi.fn()}
      />
    )

    expect(mockAppend).not.toHaveBeenCalled()
  })
})
