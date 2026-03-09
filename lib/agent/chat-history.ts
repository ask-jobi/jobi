import "server-only"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/supabase"
import type { UIMessagePart, UIDataTypes, UITools } from "ai"
import {
  MessagePart,
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"

type ChatMessage = Database["public"]["Tables"]["resume_chat_messages"]["Row"]
type ChatSession = Database["public"]["Tables"]["resume_chat_sessions"]["Row"]
type ChatSessionStatus =
  Database["public"]["Tables"]["resume_chat_sessions"]["Insert"]["status"]
type ChatMessageRole = ChatMessage["role"]

export interface CreateSessionParams {
  userId: string
  resumeId: string
  title?: string
}

export interface SaveMessageParams {
  id: string
  sessionId: string
  role: ChatMessageRole
  parts: MessagePart
  cost?: number
}

export interface UpdateMessageParams {
  messageId: string
  parts?: MessagePart
  cost?: number
  tokenCount?: number
}

export interface ChatHistoryEntry {
  id: string
  role: ChatMessageRole
  parts: MessagePart
  createdAt: string
}

export interface SessionSummary {
  id: string
  title: string | null
  resumeId: string
  status: ChatSessionStatus
  createdAt: string
  updatedAt: string
  messageCount: number
  conversationSummary?: string
}

/**
 * Create a new chat session
 */
export async function createSession({
  userId,
  resumeId,
  title
}: CreateSessionParams): Promise<ChatSession> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("resume_chat_sessions")
    .insert({
      user_id: userId,
      resume_id: resumeId,
      title: title || "New Chat"
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create chat session:", error)
    throw new Error(`Failed to create chat session: ${error.message}`)
  }

  return data
}

export async function updateMessage({
  messageId,
  parts,
  cost,
  tokenCount
}: UpdateMessageParams): Promise<void> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  if (parts !== undefined) {
    updateData.parts = parts
    updateData.has_tools = hasToolParts(parts)
  }
  if (cost !== undefined) updateData.cost = cost
  if (tokenCount !== undefined) updateData.token_count = tokenCount

  const { error } = await supabase
    .from("resume_chat_messages")
    .update(updateData)
    .eq("id", messageId)

  if (error) {
    console.error("Failed to update message:", error)
    throw new Error(`Failed to update message: ${error.message}`)
  }
}

/**
 * Save a message to a chat session
 */
export async function saveMessage({
  id,
  sessionId,
  role,
  parts,
  cost = 0
}: SaveMessageParams): Promise<ChatMessage> {
  const supabase = await createClient()
  const hasTools = hasToolParts(parts)

  const { data, error } = await supabase
    .from("resume_chat_messages")
    .insert({
      id,
      session_id: sessionId,
      role,
      parts,
      cost,
      has_tools: hasTools
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to save message:", error)
    throw new Error(`Failed to save message: ${error.message}`)
  }

  return data
}

/**
 * Load chat history for a session
 */
export async function loadHistory(
  sessionId: string,
  options?: { limit?: number; offset?: number }
): Promise<ChatHistoryEntry[]> {
  const supabase = await createClient()
  const limit = options?.limit ?? 100
  const offset = options?.offset ?? 0

  const { data, error } = await supabase
    .from("resume_chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("truncated", false)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Failed to load chat history:", error)
    throw new Error(`Failed to load chat history: ${error.message}`)
  }

  return data.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    createdAt: msg.created_at
  }))
}

/**
 * Load messages after a specific message (for context after checkpoint)
 */
export async function loadMessagesAfter(
  sessionId: string,
  afterMessageId: string,
  limit: number = 100
): Promise<ChatHistoryEntry[]> {
  const supabase = await createClient()

  const { data: afterMsg, error: afterError } = await supabase
    .from("resume_chat_messages")
    .select("created_at")
    .eq("id", afterMessageId)
    .single()

  if (afterError || !afterMsg) {
    console.error("Failed to find after message:", afterError)
    return []
  }

  const { data, error } = await supabase
    .from("resume_chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("truncated", false)
    .gt("created_at", afterMsg.created_at)
    .order("created_at", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("Failed to load messages after:", error)
    return []
  }

  return data.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    createdAt: msg.created_at
  }))
}

/**
 * Get session summary (for listing sessions)
 */
export async function getSessionSummary(
  sessionId: string
): Promise<SessionSummary | null> {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from("resume_chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (sessionError) {
    console.error("Failed to get session:", sessionError)
    throw new Error(`Failed to get session: ${sessionError.message}`)
  }

  const { count } = await supabase
    .from("resume_chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)

  return {
    id: session.id,
    title: session.title,
    resumeId: session.resume_id!!,
    status: session.status,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    messageCount: count ?? 0,
    conversationSummary: session.conversation_summary || undefined
  }
}

export async function updateConversationSummary(
  sessionId: string,
  summary: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("resume_chat_sessions")
    .update({ conversation_summary: summary })
    .eq("id", sessionId)

  if (error) {
    console.error("Failed to update conversation summary:", error)
    throw new Error(`Failed to update summary: ${error.message}`)
  }
}

export async function listSessions(
  resumeId: string,
  options?: {
    status?: ChatSessionStatus
    limit?: number
    offset?: number
  }
): Promise<SessionSummary[]> {
  const supabase = await createClient()
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  let query = supabase
    .from("resume_chat_sessions")
    .select("*")
    .eq("resume_id", resumeId)

  if (options?.status) {
    query = query.eq("status", options.status)
  }

  const { data: sessions, error } = await query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Failed to list sessions:", error)
    throw new Error(`Failed to list sessions: ${error.message}`)
  }

  return Promise.all(
    sessions.map(async (session) => {
      const { count } = await supabase
        .from("resume_chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id)

      return {
        id: session.id,
        title: session.title,
        status: session.status,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        messageCount: count ?? 0
      } as SessionSummary
    })
  )
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: ChatSessionStatus
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("resume_chat_sessions")
    .update({ status })
    .eq("id", sessionId)

  if (error) {
    console.error("Failed to update session status:", error)
    throw new Error(`Failed to update session status: ${error.message}`)
  }
}

/**
 * Soft delete a session (mark as archived)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await updateSessionStatus(sessionId, "archived")
}

/**
 * Permanently delete a session and all its messages
 */
export async function permanentlyDeleteSession(
  sessionId: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from("resume_chat_messages")
    .delete()
    .eq("session_id", sessionId)

  const { error } = await supabase
    .from("resume_chat_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) {
    console.error("Failed to delete session:", error)
    throw new Error(`Failed to delete session: ${error.message}`)
  }
}

/**
 * Update session cost tracking
 */
export async function updateSessionCost(
  sessionId: string,
  additionalTokens: number,
  additionalCost: number
): Promise<void> {
  const supabase = await createClient()

  const { data: session, error: fetchError } = await supabase
    .from("resume_chat_sessions")
    .select("total_tokens, total_cost")
    .eq("id", sessionId)
    .single()

  if (fetchError) {
    console.error("Failed to fetch session:", fetchError)
    throw new Error(`Failed to fetch session: ${fetchError.message}`)
  }

  const { error } = await supabase
    .from("resume_chat_sessions")
    .update({
      total_tokens: (session.total_tokens ?? 0) + additionalTokens,
      total_cost: (session.total_cost ?? 0) + additionalCost
    })
    .eq("id", sessionId)

  if (error) {
    console.error("Failed to update session cost:", error)
    throw new Error(`Failed to update session cost: ${error.message}`)
  }
}

/**
 * Verify user owns the session (for security)
 */
export async function verifySessionOwnership(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("resume_chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Failed to verify session ownership:", error)
    throw new Error(`Failed to verify session ownership: ${error.message}`)
  }

  return data !== null
}

function hasToolParts(
  parts: Array<UIMessagePart<UIDataTypes, UITools>>
): boolean {
  return parts.some(
    (part) =>
      part.type &&
      typeof part.type === "string" &&
      part.type.startsWith("tool-")
  )
}

export async function truncateMessages(messages: ChatMessage[]) {
  const supabase = await createClient()

  const messageIds = messages.map((m) => m.id)
  if (messageIds.length > 0) {
    const { error: updateError } = await supabase
      .from("resume_chat_messages")
      .update({ truncated: true })
      .in("id", messageIds)

    if (updateError) {
      console.error("Failed to truncate messages:", updateError)
      throw new Error(`Failed to truncate messages: ${updateError.message}`)
    }
  }
}

export async function getMessagesAfter(
  sessionId: string,
  afterTimestamp: string
): Promise<ChatMessage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("resume_chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("truncated", false)
    .gte("created_at", afterTimestamp)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Failed to get messages after:", error)
    throw new Error(`Failed to get messages after: ${error.message}`)
  }

  return data || []
}

export function extractToolOriginalValues(
  parts: Array<UIMessagePart<UIDataTypes, UITools>>
): (ResumeEditorModifyOutput | ResumeEditorReorderOutput)[] {
  const results: (ResumeEditorModifyOutput | ResumeEditorReorderOutput)[] = []

  for (const part of parts) {
    if (
      (part.type === "tool-resumeEditorModify" ||
        part.type === "tool-resumeEditorReorder") &&
      part.state === "output-available"
    ) {
      const output = part.output as
        | ResumeEditorModifyOutput
        | ResumeEditorReorderOutput
      if (
        output.operation === "rewrite" ||
        output.operation === "delete" ||
        output.operation === "add" ||
        output.operation === "reorderBlocks" ||
        output.operation === "reorderSections"
      ) {
        results.push(output)
      }
    }
  }

  return results
}

export async function getMessage(messageId: string) {
  const supabase = await createClient()

  const { data: targetMessage, error: targetError } = await supabase
    .from("resume_chat_messages")
    .select("*")
    .eq("id", messageId)
    .single()

  if (targetError || !targetMessage) {
    console.error("Failed to get target message:", targetError)
    throw new Error(`Failed to get target message: ${targetError?.message}`)
  }
  return targetMessage
}

export async function getLatestSummaryCheckpoint(
  sessionId: string
): Promise<ChatEvent | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_events")
    .select("*")
    .eq("session_id", sessionId)
    .eq("event_type", "summary_checkpoint")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Failed to get latest summary checkpoint:", error)
    return null
  }

  return data
}

export async function getMessageCount(sessionId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("resume_chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("truncated", false)

  if (error) {
    console.error("Failed to get message count:", error)
    return 0
  }

  return count ?? 0
}

export type ChatEvent = {
  id: string
  session_id: string
  message_id: string | null
  event_type: "resume_modification" | "summary_checkpoint" | "rollback"
  event_data: Record<string, unknown>
  created_at: string
}
