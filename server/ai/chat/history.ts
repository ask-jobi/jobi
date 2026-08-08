import "server-only"

import type { UIDataTypes, UIMessagePart, UITools } from "ai"
import { and, asc, count, desc, eq, gt, gte, inArray, lt } from "drizzle-orm"

import { DEFAULT_CHAT_SESSION_TITLE } from "@/lib/chat-session-title"
import { getDatabase, type AppDatabase } from "@/lib/db/client"
import {
  chatEvents,
  resumes,
  resumeChatMessages,
  resumeChatSessions,
  type ChatMessageRow
} from "@/lib/db/schema"
import type {
  MessagePart,
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"

export type ChatSessionStatus = "active" | "completed" | "archived"
export type ChatMessageRole = "user" | "assistant" | "system"

export type ChatMessage = {
  id: string
  session_id: string
  role: ChatMessageRole
  parts: MessagePart
  truncated: boolean
  has_tools: boolean
  created_at: string
}

interface GetOrCreateCanonicalSessionParams {
  userId: string
  resumeId: string
}

export interface SaveMessageParams {
  id: string
  sessionId: string
  role: ChatMessageRole
  parts: MessagePart
}

export interface UpdateMessageParams {
  messageId: string
  parts?: MessagePart
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

function toChatMessage(message: ChatMessageRow): ChatMessage {
  return {
    id: message.id,
    session_id: message.sessionId,
    role: message.role,
    parts: message.parts,
    truncated: message.truncated,
    has_tools: message.hasTools,
    created_at: message.createdAt
  }
}

function toHistoryEntry(message: ChatMessageRow): ChatHistoryEntry {
  return {
    id: message.id,
    role: message.role,
    parts: message.parts,
    createdAt: message.createdAt
  }
}

export async function updateMessage({
  messageId,
  parts
}: UpdateMessageParams): Promise<void> {
  if (parts === undefined) {
    return
  }

  const db = await getDatabase()
  await db
    .update(resumeChatMessages)
    .set({ parts, hasTools: hasToolParts(parts) })
    .where(eq(resumeChatMessages.id, messageId))
}

export async function saveMessage({
  id,
  sessionId,
  role,
  parts
}: SaveMessageParams): Promise<ChatMessage> {
  const db = await getDatabase()
  const [message] = await db
    .insert(resumeChatMessages)
    .values({
      id,
      sessionId,
      role,
      parts,
      hasTools: hasToolParts(parts)
    })
    .returning()

  return toChatMessage(message)
}

export async function loadHistory(
  sessionId: string,
  options?: { limit?: number; offset?: number }
): Promise<ChatHistoryEntry[]> {
  const db = await getDatabase()
  const messages = await db
    .select()
    .from(resumeChatMessages)
    .where(
      and(
        eq(resumeChatMessages.sessionId, sessionId),
        eq(resumeChatMessages.truncated, false)
      )
    )
    .orderBy(asc(resumeChatMessages.createdAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0)

  return messages.map(toHistoryEntry)
}

export async function loadMessagesAfter(
  sessionId: string,
  afterMessageId: string,
  limit: number = 100
): Promise<ChatHistoryEntry[]> {
  const db = await getDatabase()
  const [afterMessage] = await db
    .select({ createdAt: resumeChatMessages.createdAt })
    .from(resumeChatMessages)
    .where(eq(resumeChatMessages.id, afterMessageId))
    .limit(1)

  if (!afterMessage) {
    return []
  }

  const messages = await db
    .select()
    .from(resumeChatMessages)
    .where(
      and(
        eq(resumeChatMessages.sessionId, sessionId),
        eq(resumeChatMessages.truncated, false),
        gt(resumeChatMessages.createdAt, afterMessage.createdAt)
      )
    )
    .orderBy(asc(resumeChatMessages.createdAt))
    .limit(limit)

  return messages.map(toHistoryEntry)
}

async function countActiveMessages(db: AppDatabase, sessionId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(resumeChatMessages)
    .where(
      and(
        eq(resumeChatMessages.sessionId, sessionId),
        eq(resumeChatMessages.truncated, false)
      )
    )

  return result?.count ?? 0
}

export async function getSessionSummary(
  sessionId: string
): Promise<SessionSummary | null> {
  const db = await getDatabase()
  const [session] = await db
    .select()
    .from(resumeChatSessions)
    .where(eq(resumeChatSessions.id, sessionId))
    .limit(1)

  if (!session) {
    return null
  }

  return {
    id: session.id,
    title: session.title,
    resumeId: session.resumeId,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: await countActiveMessages(db, sessionId),
    conversationSummary: session.conversationSummary || undefined
  }
}

export async function updateConversationSummary(
  sessionId: string,
  summary: string
): Promise<void> {
  const db = await getDatabase()
  await db
    .update(resumeChatSessions)
    .set({ conversationSummary: summary, updatedAt: new Date().toISOString() })
    .where(eq(resumeChatSessions.id, sessionId))
}

async function listSessions(
  resumeId: string,
  options?: {
    userId?: string
    status?: ChatSessionStatus
    limit?: number
    offset?: number
  }
): Promise<SessionSummary[]> {
  const db = await getDatabase()
  const filters = [eq(resumeChatSessions.resumeId, resumeId)]
  if (options?.userId) {
    filters.push(eq(resumeChatSessions.userId, options.userId))
  }
  if (options?.status) {
    filters.push(eq(resumeChatSessions.status, options.status))
  }

  const sessions = await db
    .select()
    .from(resumeChatSessions)
    .where(and(...filters))
    .orderBy(desc(resumeChatSessions.updatedAt))
    .limit(options?.limit ?? 20)
    .offset(options?.offset ?? 0)

  return Promise.all(
    sessions.map(async (session) => ({
      id: session.id,
      title: session.title,
      resumeId: session.resumeId,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: await countActiveMessages(db, session.id),
      conversationSummary: session.conversationSummary || undefined
    }))
  )
}

export async function getOrCreateCanonicalSessionSummary({
  userId,
  resumeId
}: GetOrCreateCanonicalSessionParams): Promise<SessionSummary> {
  const db = await getDatabase()
  const [ownedResume] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1)

  if (!ownedResume) {
    throw new Error(`Resume not found with id: ${resumeId}`)
  }

  await db
    .insert(resumeChatSessions)
    .values({
      id: crypto.randomUUID(),
      userId,
      resumeId,
      title: DEFAULT_CHAT_SESSION_TITLE
    })
    .onConflictDoNothing({ target: resumeChatSessions.resumeId })

  const canonicalSession = (
    await listSessions(resumeId, { userId, limit: 1 })
  )[0]

  if (!canonicalSession) {
    throw new Error("Failed to resolve canonical chat session")
  }

  return canonicalSession
}

export async function updateSessionStatus(
  sessionId: string,
  status: ChatSessionStatus
): Promise<void> {
  const db = await getDatabase()
  await db
    .update(resumeChatSessions)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(resumeChatSessions.id, sessionId))
}

export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  const db = await getDatabase()
  await db
    .update(resumeChatSessions)
    .set({ title, updatedAt: new Date().toISOString() })
    .where(eq(resumeChatSessions.id, sessionId))
}

export async function permanentlyDeleteSession(
  sessionId: string
): Promise<void> {
  const db = await getDatabase()
  await db
    .delete(resumeChatSessions)
    .where(eq(resumeChatSessions.id, sessionId))
}

export async function verifySessionOwnership(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const db = await getDatabase()
  const [session] = await db
    .select({ id: resumeChatSessions.id })
    .from(resumeChatSessions)
    .where(
      and(
        eq(resumeChatSessions.id, sessionId),
        eq(resumeChatSessions.userId, userId)
      )
    )
    .limit(1)

  return Boolean(session)
}

function hasToolParts(parts: Array<UIMessagePart<UIDataTypes, UITools>>) {
  return parts.some(
    (part) => typeof part.type === "string" && part.type.startsWith("tool-")
  )
}

export async function truncateMessages(messages: ChatMessage[]) {
  const messageIds = messages.map((message) => message.id)
  if (messageIds.length === 0) {
    return
  }

  const db = await getDatabase()
  await db
    .update(resumeChatMessages)
    .set({ truncated: true })
    .where(inArray(resumeChatMessages.id, messageIds))
}

export async function getMessagesAfter(
  sessionId: string,
  afterTimestamp: string
): Promise<ChatMessage[]> {
  const db = await getDatabase()
  const messages = await db
    .select()
    .from(resumeChatMessages)
    .where(
      and(
        eq(resumeChatMessages.sessionId, sessionId),
        eq(resumeChatMessages.truncated, false),
        gte(resumeChatMessages.createdAt, afterTimestamp)
      )
    )
    .orderBy(asc(resumeChatMessages.createdAt))

  return messages.map(toChatMessage)
}

export function extractAiResumeEditOutputs(
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
        output.operation === "reorderEntries" ||
        output.operation === "reorderSections"
      ) {
        results.push(output)
      }
    }
  }

  return results
}

export async function getMessage(messageId: string) {
  const db = await getDatabase()
  const [message] = await db
    .select()
    .from(resumeChatMessages)
    .where(eq(resumeChatMessages.id, messageId))
    .limit(1)

  if (!message) {
    return null
  }

  return toChatMessage(message)
}

export type ChatEvent = {
  id: string
  session_id: string
  message_id: string | null
  event_type:
    | "summary_checkpoint"
    | "rollback"
    | "tool_call"
    | "tool_result"
    | "tool_failed"
  event_data: Record<string, unknown>
  created_at: string
}

export async function getLatestValidSummaryCheckpoint(
  sessionId: string
): Promise<ChatEvent | null> {
  const db = await getDatabase()
  const [checkpoint] = await db
    .select({
      id: chatEvents.id,
      sessionId: chatEvents.sessionId,
      messageId: chatEvents.messageId,
      eventType: chatEvents.eventType,
      eventData: chatEvents.eventData,
      createdAt: chatEvents.createdAt
    })
    .from(chatEvents)
    .innerJoin(
      resumeChatMessages,
      eq(chatEvents.messageId, resumeChatMessages.id)
    )
    .where(
      and(
        eq(chatEvents.sessionId, sessionId),
        eq(chatEvents.eventType, "summary_checkpoint"),
        eq(resumeChatMessages.truncated, false)
      )
    )
    .orderBy(desc(chatEvents.createdAt))
    .limit(1)

  return checkpoint
    ? {
        id: checkpoint.id,
        session_id: checkpoint.sessionId,
        message_id: checkpoint.messageId,
        event_type: checkpoint.eventType,
        event_data: checkpoint.eventData,
        created_at: checkpoint.createdAt
      }
    : null
}

export async function restoreConversationSummaryAfterTruncate(
  sessionId: string,
  beforeTimestamp: string
): Promise<void> {
  const db = await getDatabase()
  const [checkpoint] = await db
    .select({ eventData: chatEvents.eventData })
    .from(chatEvents)
    .where(
      and(
        eq(chatEvents.sessionId, sessionId),
        eq(chatEvents.eventType, "summary_checkpoint"),
        lt(chatEvents.createdAt, beforeTimestamp)
      )
    )
    .orderBy(desc(chatEvents.createdAt))
    .limit(1)

  const summaryText =
    typeof checkpoint?.eventData.summary_text === "string"
      ? checkpoint.eventData.summary_text
      : null

  await db
    .update(resumeChatSessions)
    .set({
      conversationSummary: summaryText,
      updatedAt: new Date().toISOString()
    })
    .where(eq(resumeChatSessions.id, sessionId))
}
