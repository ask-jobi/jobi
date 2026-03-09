import "server-only"
import { generateText } from "ai"
import { model } from "@/lib/agent/model"
import { conversationSummaryPrompt } from "@/server/ai/prompts/conversation-summary.prompt"
import { ChatUIMessage, MessagePart } from "@/types/chat"

function formatMessageParts(parts: MessagePart): string {
  const textParts = parts.filter((p) => p.type === "text")
  if (textParts.length > 0) {
    return textParts.map((p) => (p.text as string) || "").join("\n")
  }

  const toolParts = parts.filter(
    (p) =>
      p.type === "tool-resumeEditorModify" ||
      p.type === "tool-resumeEditorReorder"
  )
  if (toolParts.length > 0) {
    return toolParts
      .map((p) => `[Tool: ${p.output!!["operation"] || "unknown"}]`)
      .join(", ")
  }

  return "[No text content]"
}

export async function generateConversationSummary(
  messages: ChatUIMessage[],
  previousSummary: string
): Promise<string> {
  const messagesText = messages
    .map((m) => `${m.role}: ${formatMessageParts(m.parts)}`)
    .join("\n\n")

  const prompt = conversationSummaryPrompt.format({
    messages: messagesText,
    previousSummary: previousSummary || "无"
  })

  const { output } = await generateText({
    model,
    messages: [{ role: "user", content: prompt }]
  })

  return output.trim() || "暂无摘要"
}
