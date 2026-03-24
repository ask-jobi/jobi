/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest"
import {
  CHAT_SESSION_TITLE_MAX_LENGTH,
  DEFAULT_CHAT_SESSION_TITLE,
  deriveChatSessionTitleFromParts,
  isDefaultChatSessionTitle
} from "@/lib/chat-session-title"

describe("chat-session-title", () => {
  it("should derive title from the first text parts", () => {
    expect(
      deriveChatSessionTitleFromParts([
        { type: "text", text: "  Improve\nmy   resume  " }
      ] as never)
    ).toBe("Improve my resume")
  })

  it("should ignore non-text parts", () => {
    expect(
      deriveChatSessionTitleFromParts([
        { type: "tool-resumeEditorModify", state: "output-available" },
        { type: "text", text: "First useful title" }
      ] as never)
    ).toBe("First useful title")
  })

  it("should return null when no usable text exists", () => {
    expect(
      deriveChatSessionTitleFromParts([{ type: "text", text: "   " }] as never)
    ).toBeNull()
  })

  it("should truncate long titles to the supported max length", () => {
    const title = deriveChatSessionTitleFromParts([
      { type: "text", text: "a".repeat(CHAT_SESSION_TITLE_MAX_LENGTH + 10) }
    ] as never)

    expect(title).toHaveLength(CHAT_SESSION_TITLE_MAX_LENGTH)
  })

  it("should detect the default placeholder title", () => {
    expect(isDefaultChatSessionTitle(DEFAULT_CHAT_SESSION_TITLE)).toBe(true)
    expect(isDefaultChatSessionTitle("Meaningful title")).toBe(false)
  })
})
