"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function logResumeModification(
  sessionId: string,
  messageId: string,
  eventData: Record<string, unknown>
) {
  const supabase = await createClient()

  const { error } = await supabase.from("chat_events").insert({
    session_id: sessionId,
    message_id: messageId,
    event_type: "resume_modification",
    event_data: eventData
  })

  if (error) {
    console.error("Failed to log resume modification:", error)
    throw new Error(`Failed to log event: ${error.message}`)
  }

  revalidatePath(`/chat/${sessionId}`)
}

export async function logSummaryCheckpoint(
  sessionId: string,
  messageId: string,
  summaryText: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from("chat_events").insert({
    session_id: sessionId,
    message_id: messageId,
    event_type: "summary_checkpoint",
    event_data: {
      summary_text: summaryText
    }
  })

  if (error) {
    console.error("Failed to log summary checkpoint:", error)
    throw new Error(`Failed to log event: ${error.message}`)
  }

  revalidatePath(`/chat/${sessionId}`)
}

export async function logRollback(
  sessionId: string,
  truncatedMessageId: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from("chat_events").insert({
    session_id: sessionId,
    message_id: truncatedMessageId,
    event_type: "rollback",
    event_data: {}
  })

  if (error) {
    console.error("Failed to log rollback:", error)
    throw new Error(`Failed to log event: ${error.message}`)
  }

  revalidatePath(`/chat/${sessionId}`)
}
