import "server-only"
import { generateText } from "ai"
import { model } from "@/server/ai/model"
import { normalizeChatSessionTitle } from "@/lib/chat-session-title"
import { chatSessionTitlePrompt } from "@/server/ai/prompts/chat-session-title.prompt"
import type { MessagePart } from "@/types/chat"

function getMessageText(parts: MessagePart): string | null {
  const text = parts
    .filter(
      (part): part is Extract<MessagePart[number], { type: "text" }> =>
        part.type === "text" && typeof part.text === "string"
    )
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  return text || null
}

export async function generateChatSessionTitle(
  parts: MessagePart
): Promise<string | null> {
  const messageText = getMessageText(parts)

  if (!messageText) {
    return null
  }

  const { output } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: chatSessionTitlePrompt.format({
          message: messageText
        })
      }
    ]
  })

  return normalizeChatSessionTitle(output)
}
