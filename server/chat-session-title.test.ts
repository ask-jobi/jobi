/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest"
import {
  CHAT_SESSION_TITLE_MAX_LENGTH,
  DEFAULT_CHAT_SESSION_TITLE,
  normalizeChatSessionTitle,
  isDefaultChatSessionTitle
} from "@/lib/chat-session-title"

describe("chat-session-title", () => {
  it("should normalize whitespace", () => {
    expect(normalizeChatSessionTitle("  Improve\nmy   resume  ")).toBe(
      "Improve my resume"
    )
  })

  it("should strip wrapping quotes", () => {
    expect(normalizeChatSessionTitle('  "First useful title"  ')).toBe(
      "First useful title"
    )
  })

  it("should return null when no usable text exists", () => {
    expect(normalizeChatSessionTitle("   ")).toBeNull()
  })

  it("should truncate long titles to the supported max length", () => {
    const title = normalizeChatSessionTitle(
      "a".repeat(CHAT_SESSION_TITLE_MAX_LENGTH + 10)
    )

    expect(title).toHaveLength(CHAT_SESSION_TITLE_MAX_LENGTH)
  })

  it("should detect the default placeholder title", () => {
    expect(isDefaultChatSessionTitle(DEFAULT_CHAT_SESSION_TITLE)).toBe(true)
    expect(isDefaultChatSessionTitle("Meaningful title")).toBe(false)
  })
})
