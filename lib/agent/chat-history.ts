import "server-only"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/supabase"
import type { UIMessagePart, UIDataTypes, UITools } from "ai"
import {
  MessagePart,
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import {
  DEFAULT_CHAT_SESSION_TITLE,
  deriveChatSessionTitleFromParts,
  isDefaultChatSessionTitle
} from "@/lib/chat-session-title"

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
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
  reasoningTokens?: number
}

export interface UpdateMessageParams {
  messageId: string
  parts?: MessagePart
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
  reasoningTokens?: number
}

export interface ChatHistoryEntry {
  id: string
  role: ChatMessageRole
  parts: MessagePart
  createdAt: string
  tokenCount?: number
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
  reasoningTokens?: number
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
  totalTokens?: number
  totalInputTokens?: number
  totalOutputTokens?: number
  totalCachedTokens?: number
  totalReasoningTokens?: number
}

export interface SessionTokenUsageMessage {
  id: string
  role: ChatMessageRole
  createdAt: string
  tokenCount: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
}

export interface SessionTokenUsage {
  sessionId: string
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCachedTokens: number
  totalReasoningTokens: number
  messages: SessionTokenUsageMessage[]
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
      title: title || DEFAULT_CHAT_SESSION_TITLE
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
  inputTokens,
  outputTokens,
  cachedTokens,
  reasoningTokens
}: UpdateMessageParams): Promise<void> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  if (parts !== undefined) {
    updateData.parts = parts
    updateData.has_tools = hasToolParts(parts)
  }
  if (inputTokens !== undefined) updateData.input_tokens = inputTokens
  if (outputTokens !== undefined) updateData.output_tokens = outputTokens
  if (cachedTokens !== undefined) updateData.cached_tokens = cachedTokens
  if (reasoningTokens !== undefined)
    updateData.reasoning_tokens = reasoningTokens

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
  inputTokens,
  outputTokens,
  cachedTokens,
  reasoningTokens
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
      has_tools: hasTools,
      input_tokens: inputTokens ?? 0,
      output_tokens: outputTokens ?? 0,
      cached_tokens: cachedTokens ?? 0,
      reasoning_tokens: reasoningTokens ?? 0
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to save message:", error)
    throw new Error(`Failed to save message: ${error.message}`)
  }

  if (role === "user") {
    await autoTitleSessionFromUserMessages(sessionId)
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
    createdAt: msg.created_at,
    tokenCount: getTotalTokens(msg),
    inputTokens: msg.input_tokens ?? 0,
    outputTokens: msg.output_tokens ?? 0,
    cachedTokens: msg.cached_tokens ?? 0,
    reasoningTokens: msg.reasoning_tokens ?? 0
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
    createdAt: msg.created_at,
    tokenCount: getTotalTokens(msg),
    inputTokens: msg.input_tokens ?? 0,
    outputTokens: msg.output_tokens ?? 0,
    cachedTokens: msg.cached_tokens ?? 0,
    reasoningTokens: msg.reasoning_tokens ?? 0
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
    conversationSummary: session.conversation_summary || undefined,
    totalTokens: getTotalTokens(session),
    totalInputTokens: session.total_input_tokens ?? 0,
    totalOutputTokens: session.total_output_tokens ?? 0,
    totalCachedTokens: session.total_cached_tokens ?? 0,
    totalReasoningTokens: session.total_reasoning_tokens ?? 0
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

export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("resume_chat_sessions")
    .update({ title })
    .eq("id", sessionId)

  if (error) {
    console.error("Failed to update session title:", error)
    throw new Error(`Failed to update session title: ${error.message}`)
  }
}

export async function updateSessionTokenUsage(
  sessionId: string
): Promise<void> {
  const supabase = await createClient()

  const { data: messages, error } = await supabase
    .from("resume_chat_messages")
    .select("input_tokens, output_tokens, cached_tokens, reasoning_tokens")
    .eq("session_id", sessionId)
    .eq("truncated", false)

  if (error) {
    console.error("Failed to calculate session token usage:", error)
    throw new Error(`Failed to calculate token usage: ${error.message}`)
  }

  const totalInputTokens = messages?.reduce(
    (sum, msg) => sum + (msg.input_tokens ?? 0),
    0
  )
  const totalOutputTokens = messages?.reduce(
    (sum, msg) => sum + (msg.output_tokens ?? 0),
    0
  )
  const totalCachedTokens = messages?.reduce(
    (sum, msg) => sum + (msg.cached_tokens ?? 0),
    0
  )
  const totalReasoningTokens = messages?.reduce(
    (sum, msg) => sum + (msg.reasoning_tokens ?? 0),
    0
  )

  const { error: updateError } = await supabase
    .from("resume_chat_sessions")
    .update({
      total_input_tokens: totalInputTokens ?? 0,
      total_output_tokens: totalOutputTokens ?? 0,
      total_cached_tokens: totalCachedTokens ?? 0,
      total_reasoning_tokens: totalReasoningTokens ?? 0
    })
    .eq("id", sessionId)

  if (updateError) {
    console.error("Failed to update session token usage:", updateError)
    throw new Error(
      `Failed to update session token usage: ${updateError.message}`
    )
  }
}

export async function getSessionTokenUsage(
  sessionId: string
): Promise<SessionTokenUsage> {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from("resume_chat_sessions")
    .select(
      "id, total_input_tokens, total_output_tokens, total_cached_tokens, total_reasoning_tokens"
    )
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    console.error("Failed to get session token usage:", sessionError)
    throw new Error("Session not found")
  }

  const { data: messages, error: messagesError } = await supabase
    .from("resume_chat_messages")
    .select(
      "id, role, created_at, input_tokens, output_tokens, cached_tokens, reasoning_tokens"
    )
    .eq("session_id", sessionId)
    .eq("truncated", false)
    .order("created_at", { ascending: true })

  if (messagesError) {
    console.error("Failed to get message token usage:", messagesError)
    throw new Error(
      `Failed to get message token usage: ${messagesError.message}`
    )
  }

  return {
    sessionId: session.id,
    totalTokens: getTotalTokens(session),
    totalInputTokens: session.total_input_tokens ?? 0,
    totalOutputTokens: session.total_output_tokens ?? 0,
    totalCachedTokens: session.total_cached_tokens ?? 0,
    totalReasoningTokens: session.total_reasoning_tokens ?? 0,
    messages:
      messages?.map((message) => ({
        id: message.id,
        role: message.role,
        createdAt: message.created_at,
        tokenCount: getTotalTokens(message),
        inputTokens: message.input_tokens ?? 0,
        outputTokens: message.output_tokens ?? 0,
        cachedTokens: message.cached_tokens ?? 0,
        reasoningTokens: message.reasoning_tokens ?? 0
      })) ?? []
  }
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

function getTotalTokens(
  source:
    | Pick<
        ChatMessage,
        "input_tokens" | "output_tokens" | "cached_tokens" | "reasoning_tokens"
      >
    | Pick<
        ChatSession,
        | "total_input_tokens"
        | "total_output_tokens"
        | "total_cached_tokens"
        | "total_reasoning_tokens"
      >
): number {
  if ("input_tokens" in source) {
    return (
      (source.input_tokens ?? 0) +
      (source.output_tokens ?? 0) +
      (source.cached_tokens ?? 0) +
      (source.reasoning_tokens ?? 0)
    )
  }

  return (
    (source.total_input_tokens ?? 0) +
    (source.total_output_tokens ?? 0) +
    (source.total_cached_tokens ?? 0) +
    (source.total_reasoning_tokens ?? 0)
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

export type ChatEvent = {
  id: string
  session_id: string
  message_id: string | null
  event_type: "resume_modification" | "summary_checkpoint" | "rollback"
  event_data: Record<string, unknown>
  created_at: string
}

export async function getLatestValidSummaryCheckpoint(
  sessionId: string
): Promise<ChatEvent | null> {
  const supabase = await createClient()

  const { data: checkpoints, error } = await supabase
    .from("chat_events")
    .select("id, message_id, event_data, created_at")
    .eq("session_id", sessionId)
    .eq("event_type", "summary_checkpoint")
    .order("created_at", { ascending: false })

  if (error || !checkpoints) {
    return null
  }

  for (const checkpoint of checkpoints) {
    if (!checkpoint.message_id) continue

    const { data: message } = await supabase
      .from("resume_chat_messages")
      .select("truncated")
      .eq("id", checkpoint.message_id)
      .single()

    if (message && !message.truncated) {
      return checkpoint as ChatEvent
    }
  }

  return null
}

export async function restoreConversationSummaryAfterTruncate(
  sessionId: string,
  beforeTimestamp: string
): Promise<void> {
  const supabase = await createClient()

  const { data: checkpoint } = await supabase
    .from("chat_events")
    .select("event_data")
    .eq("session_id", sessionId)
    .eq("event_type", "summary_checkpoint")
    .lt("created_at", beforeTimestamp)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const summaryText =
    typeof checkpoint?.event_data?.summary_text === "string"
      ? checkpoint.event_data.summary_text
      : null

  await supabase
    .from("resume_chat_sessions")
    .update({ conversation_summary: summaryText })
    .eq("id", sessionId)
}

async function autoTitleSessionFromUserMessages(
  sessionId: string
): Promise<void> {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from("resume_chat_sessions")
    .select("title")
    .eq("id", sessionId)
    .single()

  if (sessionError || !isDefaultChatSessionTitle(session?.title)) {
    if (sessionError) {
      console.error("Failed to load session for auto-title:", sessionError)
      throw new Error(`Failed to load session: ${sessionError.message}`)
    }

    return
  }

  const { data: userMessages, error: messagesError } = await supabase
    .from("resume_chat_messages")
    .select("parts")
    .eq("session_id", sessionId)
    .eq("role", "user")
    .eq("truncated", false)
    .order("created_at", { ascending: true })

  if (messagesError) {
    console.error("Failed to load user messages for auto-title:", messagesError)
    throw new Error(`Failed to load user messages: ${messagesError.message}`)
  }

  const title = (userMessages || [])
    .map((message) => deriveChatSessionTitleFromParts(message.parts))
    .find((value): value is string => Boolean(value))

  if (!title) {
    return
  }

  await updateSessionTitle(sessionId, title)
}
