"use server"

import { revalidatePath } from "next/cache"

import {
  toolCallEventDataSchema,
  toolResultEventDataSchema,
  toolFailedEventDataSchema,
  summaryCheckpointEventDataSchema,
  rollbackEventDataSchema
} from "@/lib/agent/schema"
import { getDatabase } from "@/lib/db/client"
import { chatEvents } from "@/lib/db/schema"

type ChatEventType =
  | "summary_checkpoint"
  | "rollback"
  | "tool_call"
  | "tool_result"
  | "tool_failed"

function validateEventData(
  eventType: ChatEventType,
  eventData: Record<string, unknown>
): Record<string, unknown> {
  switch (eventType) {
    case "tool_call":
      return toolCallEventDataSchema.parse(eventData)
    case "tool_result":
      return toolResultEventDataSchema.parse(eventData)
    case "tool_failed":
      return toolFailedEventDataSchema.parse(eventData)
    case "summary_checkpoint":
      return summaryCheckpointEventDataSchema.parse(eventData)
    case "rollback":
      return rollbackEventDataSchema.parse(eventData)
    default:
      return eventData
  }
}

export async function logChatEvent({
  sessionId,
  messageId,
  eventType,
  eventData
}: {
  sessionId: string
  messageId?: string | null
  eventType: ChatEventType
  eventData?: Record<string, unknown>
}) {
  const db = await getDatabase()

  const validatedEventData = eventData
    ? validateEventData(eventType, eventData)
    : {}

  const [event] = await db
    .insert(chatEvents)
    .values({
      id: crypto.randomUUID(),
      sessionId,
      messageId: messageId ?? null,
      eventType,
      eventData: validatedEventData
    })
    .returning({ id: chatEvents.id })

  revalidatePath(`/chat/${sessionId}`)
  return event.id
}

export async function logSummaryCheckpoint(
  sessionId: string,
  messageId: string,
  summaryText: string
) {
  return logChatEvent({
    sessionId,
    messageId,
    eventType: "summary_checkpoint",
    eventData: {
      summary_text: summaryText
    }
  })
}

export async function logRollback(
  sessionId: string,
  truncatedMessageId: string
) {
  return logChatEvent({
    sessionId,
    messageId: truncatedMessageId,
    eventType: "rollback",
    eventData: {}
  })
}
