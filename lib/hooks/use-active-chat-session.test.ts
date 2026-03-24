/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest"
import type { UseActiveChatSessionReturn } from "./use-active-chat-session"

describe("use-active-chat-session types", () => {
  it("should expose active session selection controls", () => {
    const value: UseActiveChatSessionReturn = {
      activeSessionId: "session-1",
      selectSession: () => {},
      activateNewSession: () => {},
      clearActiveSession: () => {}
    }

    expect(value.activeSessionId).toBe("session-1")
    expect(typeof value.selectSession).toBe("function")
    expect(typeof value.activateNewSession).toBe("function")
  })
})
