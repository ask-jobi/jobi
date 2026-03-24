import type { MessagePart } from "@/types/chat"

export const DEFAULT_CHAT_SESSION_TITLE = "New Chat"
export const CHAT_SESSION_TITLE_MAX_LENGTH = 200

export function isDefaultChatSessionTitle(title: string | null | undefined) {
  return !title || title === DEFAULT_CHAT_SESSION_TITLE
}

export function deriveChatSessionTitleFromParts(
  parts: MessagePart,
  maxLength: number = CHAT_SESSION_TITLE_MAX_LENGTH
) {
  const normalizedText = parts
    .filter(
      (part): part is Extract<MessagePart[number], { type: "text" }> =>
        part.type === "text" && typeof part.text === "string"
    )
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalizedText) {
    return null
  }

  return normalizedText.slice(0, maxLength).trimEnd()
}
