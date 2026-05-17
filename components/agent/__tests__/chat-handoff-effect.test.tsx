/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatPendingActionEffect } from "../chat/chat-pending-action-effect"

const mockAppend = vi.fn()

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
  AssistantRuntimeProvider: ({ children }: { children: ReactNode }) => children,
  ThreadPrimitive: {
    Root: ({ children }: { children: ReactNode }) => children
  }
}))

describe("ChatPendingActionEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should append the pending action once and consume it", () => {
    const onConsumed = vi.fn()

    const { rerender } = render(
      <ChatPendingActionEffect
        action={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        lifecycle="ready"
        resumeId="resume-123"
        onConsumed={onConsumed}
      />
    )

    rerender(
      <ChatPendingActionEffect
        action={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        lifecycle="ready"
        resumeId="resume-123"
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

  it("should not append before the thread is ready", () => {
    render(
      <ChatPendingActionEffect
        action={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        lifecycle="loading-history"
        resumeId="resume-123"
        onConsumed={vi.fn()}
      />
    )

    expect(mockAppend).not.toHaveBeenCalled()
  })

  it("should not append when the action belongs to a different resume", () => {
    render(
      <ChatPendingActionEffect
        action={{
          id: "handoff-1",
          resumeId: "resume-123",
          message: "让我帮您优化简历..."
        }}
        lifecycle="ready"
        resumeId="resume-456"
        onConsumed={vi.fn()}
      />
    )

    expect(mockAppend).not.toHaveBeenCalled()
  })
})
