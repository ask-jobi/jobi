/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest"
import type { SessionSummary } from "@/lib/agent/chat-history"
import type { UseChatSessionsReturn } from "./use-chat-sessions"

describe("use-chat-sessions types", () => {
  it("should expose session collection state and mutators", () => {
    const summary: SessionSummary = {
      id: "session-1",
      title: "PM tailoring",
      resumeId: "resume-1",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 3
    }

    const value: UseChatSessionsReturn = {
      sessions: [summary],
      loading: false,
      creating: false,
      error: null,
      createSession: async () => summary,
      refreshSessions: async () => [summary],
      updateSessionTitleLocally: () => {}
    }

    expect(value.sessions[0].id).toBe("session-1")
    expect(typeof value.createSession).toBe("function")
  })
})
