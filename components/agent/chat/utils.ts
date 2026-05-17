import { UIMessage } from "ai"

export function extractTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n")
}

export function toUIMessage(entry: any): UIMessage {
  return {
    id: entry.id,
    role: entry.role as "user" | "assistant",
    parts: entry.parts
  }
}
