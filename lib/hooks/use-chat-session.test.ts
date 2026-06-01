/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest"
import type { SessionSummary } from "@/server/ai/chat/history"
import type { UseChatSessionReturn } from "./use-chat-session"

describe("use-chat-session types", () => {
  it("should expose canonical session state and mutators", () => {
    const summary: SessionSummary = {
      id: "session-1",
      title: "PM tailoring",
      resumeId: "resume-1",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 3
    }

    const value: UseChatSessionReturn = {
      session: summary,
      loading: false,
      error: null,
      refreshSession: async () => summary
    }

    expect(value.session?.id).toBe("session-1")
    expect(typeof value.refreshSession).toBe("function")
  })
})
