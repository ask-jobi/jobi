/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDatabase } from "@/lib/db/client"
import { logChatEvent } from "./chat-events"

const values = vi.fn()
const returning = vi.fn(async () => [{ id: "event-1" }])

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }))

describe("logChatEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    values.mockReturnValue({ returning })
    vi.mocked(getDatabase).mockResolvedValue({
      insert: vi.fn(() => ({ values }))
    } as never)
  })

  it("validates and writes a tool_call event", async () => {
    await expect(
      logChatEvent({
        sessionId: "session-1",
        messageId: "message-1",
        eventType: "tool_call",
        eventData: {
          toolName: "resumeEditorModify",
          toolCallId: "call-1",
          input: {},
          baseVersion: 1
        }
      })
    ).resolves.toBe("event-1")

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        eventType: "tool_call"
      })
    )
  })

  it("rejects invalid tool event data before writing", async () => {
    await expect(
      logChatEvent({
        sessionId: "session-1",
        eventType: "tool_call",
        eventData: {}
      })
    ).rejects.toThrow()

    expect(values).not.toHaveBeenCalled()
  })

  it.each([
    ["summary_checkpoint" as const, { summary_text: "summary" }],
    ["rollback" as const, {}]
  ])("writes valid %s event data", async (eventType, eventData) => {
    await expect(
      logChatEvent({ sessionId: "session-1", eventType, eventData })
    ).resolves.toBe("event-1")
  })
})
