"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"

type ChatEventType =
  Database["public"]["Tables"]["chat_events"]["Insert"]["event_type"]

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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_events")
    .insert({
      session_id: sessionId,
      message_id: messageId ?? null,
      event_type: eventType,
      event_data: eventData ?? {}
    })
    .select("id")
    .single()

  if (error) {
    console.error("Failed to log chat event:", error)
    throw new Error(`Failed to log event: ${error.message}`)
  }

  revalidatePath(`/chat/${sessionId}`)
  return data.id
}

export async function logResumeModification(
  sessionId: string,
  messageId: string,
  eventData: Record<string, unknown>
) {
  return logChatEvent({
    sessionId,
    messageId,
    eventType: "resume_modification",
    eventData
  })
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
