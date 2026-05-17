export const DEFAULT_CHAT_SESSION_TITLE = "New Chat"
export const CHAT_SESSION_TITLE_MAX_LENGTH = 200

export function isDefaultChatSessionTitle(title: string | null | undefined) {
  return !title || title === DEFAULT_CHAT_SESSION_TITLE
}

export function normalizeChatSessionTitle(
  title: string | null | undefined,
  maxLength: number = CHAT_SESSION_TITLE_MAX_LENGTH
) {
  const normalizedText = (title || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")

  if (!normalizedText) {
    return null
  }

  return normalizedText.slice(0, maxLength).trimEnd()
}
