import { NextRequest } from "next/server"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  validateUIMessages
} from "ai"
import { tools } from "@/lib/agent/tools"
import {
  getLatestValidSummaryCheckpoint,
  loadHistory,
  loadMessagesAfter,
  saveMessage,
  updateMessage,
  updateConversationSummary,
  type ChatHistoryEntry,
  getSessionSummary,
  updateSessionTokenUsage,
  updateSessionTitle
} from "@/server/ai/chat/history"
import { generateConversationSummary } from "@/server/ai/chat/conversation-summary"
import { getJobApplicationByResumeId } from "@/server/resume"
import { model } from "@/server/ai/model"
import { generateUUID } from "@/lib/utils"
import chatPrompt from "@/server/ai/prompts/resume-chat.prompt"
import { ResumeData, ResumeJobDescription } from "@/types/resume"
import { ResumeEvaluationOutput } from "@/types/evaluation"
import { logSummaryCheckpoint } from "@/server/chat-events"
import { ChatTokenUsage, ChatUIMessage } from "@/types/chat"
import {
  requireVerifiedUserIdentity,
  handleApiError,
  verifyOwnership,
  ApiError
} from "@/server/auth-helper"
import { parseTokenUsage } from "@/lib/agent/token-usage"
import { isDefaultChatSessionTitle } from "@/lib/chat-session-title"
import {
  buildChatTokenQuota,
  consumeChatTokens,
  getActiveAccessPass,
  verifyChatTokenQuota
} from "@/server/quota"
import { generateChatSessionTitle } from "@/server/ai/chat/session-title-generator"
import { createResumeChatServerTools } from "@/server/ai/chat/tools/registry"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
const CHAT_TOKEN_LIMIT_MESSAGE =
  "Your token balance is exhausted. Buy another token bundle to continue chatting."
const CHAT_STREAM_MAX_OUTPUT_TOKENS = 2048
const CHAT_STREAM_TIMEOUT_MS = {
  totalMs: 120_000,
  stepMs: 60_000,
  chunkMs: 30_000
}
const CHAT_STREAM_RETRY_MESSAGE =
  "The chat response could not be completed. Please retry."
const CHAT_STREAM_TIMEOUT_MESSAGE =
  "The chat response took too long. Please retry."

const convertUIMessage = (msg: ChatHistoryEntry): ChatUIMessage => {
  return {
    id: msg.id,
    role: msg.role,
    parts: msg.parts
  }
}

function hasMessageParts(message: ChatUIMessage): boolean {
  return Array.isArray(message.parts) && message.parts.length > 0
}

function sanitizeHistoricalContextMessages(
  messages: ChatUIMessage[]
): ChatUIMessage[] {
  const sanitizedMessages: ChatUIMessage[] = []

  for (const message of messages) {
    if (!hasMessageParts(message)) {
      if (
        message.role === "assistant" &&
        sanitizedMessages.at(-1)?.role === "user"
      ) {
        sanitizedMessages.pop()
      }
      continue
    }

    if (message.role === "user" && sanitizedMessages.at(-1)?.role === "user") {
      sanitizedMessages.pop()
    }

    sanitizedMessages.push(message)
  }

  if (sanitizedMessages.at(-1)?.role === "user") {
    sanitizedMessages.pop()
  }

  return sanitizedMessages
}

function getChatStreamErrorMessage(error: unknown): string {
  console.error("[Resume Chat] Stream error:", error)

  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return CHAT_STREAM_TIMEOUT_MESSAGE
  }

  if (error instanceof Error && error.name === "AbortError") {
    return CHAT_STREAM_TIMEOUT_MESSAGE
  }

  return CHAT_STREAM_RETRY_MESSAGE
}

async function loadContextMessages(sessionId: string) {
  const latestValidCheckpoint = await getLatestValidSummaryCheckpoint(sessionId)
  const checkpointMessageId = latestValidCheckpoint?.message_id
  if (checkpointMessageId) {
    return (await loadMessagesAfter(sessionId, checkpointMessageId, 10)).map(
      convertUIMessage
    )
  } else {
    return (await loadHistory(sessionId, { limit: 10 })).map(convertUIMessage)
  }
}

async function createTokenLimitReachedResponse() {
  const assistantMessageId = generateUUID()
  const textPartId = generateUUID()

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: ({ writer }) => {
      writer.write({
        type: "start",
        messageId: assistantMessageId
      })
      writer.write({
        type: "text-start",
        id: textPartId
      })
      writer.write({
        type: "text-delta",
        id: textPartId,
        delta: CHAT_TOKEN_LIMIT_MESSAGE
      })
      writer.write({
        type: "text-end",
        id: textPartId
      })
      writer.write({
        type: "finish"
      })
    }
  })

  return createUIMessageStreamResponse({ stream })
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUserIdentity()

    const { message, id: sessionId }: { message: ChatUIMessage; id: string } =
      await request.json()

    await verifyOwnership(sessionId, user.id)

    const activeAccessPass = await getActiveAccessPass(user.id)

    if (activeAccessPass) {
      try {
        const chatTokenQuota = buildChatTokenQuota(activeAccessPass)
        verifyChatTokenQuota(chatTokenQuota.used, chatTokenQuota.limit)
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Chat token limit reached"
        ) {
          return createTokenLimitReachedResponse()
        }
        throw error
      }
    }

    const [currentSession, loadedContextMessages] = await Promise.all([
      getSessionSummary(sessionId),
      loadContextMessages(sessionId)
    ])

    if (!currentSession) {
      throw new ApiError("Chat session not found", 404)
    }

    const jobApplication = await getJobApplicationByResumeId(
      currentSession.resumeId
    )

    const resumeId = currentSession.resumeId
    const resumeData = jobApplication.resumes.resume_json as ResumeData
    const currentRevision = jobApplication.resumes.current_revision
    const resumeLang = jobApplication.resumes.language
    const jobDescription = jobApplication.jobs as ResumeJobDescription
    const evaluationReport = jobApplication.resumes
      .evaluation_report as ResumeEvaluationOutput

    const conversationSummary = currentSession?.conversationSummary
    const persistedCurrentMessage = loadedContextMessages.find(
      (contextMessage) => contextMessage.id === message.id
    )
    const contextMessages = sanitizeHistoricalContextMessages(
      loadedContextMessages.filter(
        (contextMessage) => contextMessage.id !== message.id
      )
    )
    contextMessages.push(message)

    if (message.role === "user") {
      if (persistedCurrentMessage) {
        await updateMessage({
          messageId: message.id,
          parts: message.parts
        })
      } else {
        await saveMessage({
          id: message.id,
          sessionId,
          role: "user",
          parts: message.parts
        })
      }
    }

    const systemMessage = {
      id: "system",
      role: "system",
      parts: [
        {
          type: "text",
          text: chatPrompt.format({
            resume: JSON.stringify(resumeData),
            jobDescription: jobDescription,
            evaluationReport: evaluationReport,
            language: resumeLang,
            conversationSummary: conversationSummary || ""
          })
        }
      ]
    } as ChatUIMessage

    const allMessages: ChatUIMessage[] = [systemMessage, ...contextMessages]
    const shouldGenerateSessionTitle = isDefaultChatSessionTitle(
      currentSession?.title
    )

    // Empty or dangling historical turns can make validation fail or replay stale prompts.
    const uiMessages = await validateUIMessages<ChatUIMessage>({
      messages: allMessages,
      tools
    })

    const stream = createUIMessageStream({
      originalMessages: uiMessages,
      generateId: generateUUID,
      onError: getChatStreamErrorMessage,
      execute: async ({ writer: dataStream }) => {
        const assistantMessageId = generateUUID()
        const supabase = await createClient()
        const serverTools = createResumeChatServerTools({
          supabase,
          userId: user.id,
          resumeId,
          sessionId,
          assistantMessageId,
          initialResume: resumeData,
          initialRevision: currentRevision,
          writer: dataStream
        })

        const result = streamText({
          model: model,
          stopWhen: stepCountIs(5),
          messages: await convertToModelMessages(uiMessages),
          abortSignal: request.signal,
          timeout: CHAT_STREAM_TIMEOUT_MS,
          maxOutputTokens: CHAT_STREAM_MAX_OUTPUT_TOKENS,
          experimental_transform: smoothStream(),
          tools: serverTools,
          onError: ({ error }) => {
            getChatStreamErrorMessage(error)
          }
        })

        dataStream.merge(
          result.toUIMessageStream({
            generateMessageId: () => assistantMessageId,
            sendReasoning: true,
            onError: getChatStreamErrorMessage,
            messageMetadata: ({ part }) => {
              if (part.type !== "finish") {
                return undefined
              }

              const normalizedUsage = parseTokenUsage(part.totalUsage)

              if (normalizedUsage.totalTokens <= 0) {
                return undefined
              }

              const tokenUsage: ChatTokenUsage = {
                inputTokens: normalizedUsage.inputTokens,
                outputTokens: normalizedUsage.outputTokens,
                cachedTokens: normalizedUsage.cachedTokens,
                reasoningTokens: normalizedUsage.reasoningTokens,
                totalTokens: normalizedUsage.totalTokens
              }

              return { tokenUsage }
            }
          })
        )

        if (shouldGenerateSessionTitle) {
          void generateChatSessionTitle(message.parts)
            .then(async (title) => {
              if (!title) {
                return
              }

              await updateSessionTitle(sessionId, title)
            })
            .catch((error) => {
              console.error("Failed to generate chat session title:", error)
            })
        }
      },
      onFinish: async ({ messages: finishedMessages, responseMessage }) => {
        const responseUsage = responseMessage.metadata?.tokenUsage
        const persistenceTasks: Promise<void | unknown>[] = []

        for (const finishedMsg of finishedMessages.filter(
          (msg) => msg.id !== "system"
        )) {
          const usageForMessage =
            responseUsage && responseMessage.id === finishedMsg.id
              ? {
                  inputTokens: responseUsage.inputTokens,
                  outputTokens: responseUsage.outputTokens,
                  cachedTokens: responseUsage.cachedTokens,
                  reasoningTokens: responseUsage.reasoningTokens
                }
              : {}
          const existingMsg = allMessages.find((m) => m.id === finishedMsg.id)
          if (existingMsg) {
            persistenceTasks.push(
              updateMessage({
                messageId: existingMsg.id,
                parts: finishedMsg.parts,
                ...usageForMessage
              })
            )
          } else {
            contextMessages.push(finishedMsg)
            persistenceTasks.push(
              saveMessage({
                id: finishedMsg.id,
                sessionId,
                role: finishedMsg.role,
                parts: finishedMsg.parts,
                ...usageForMessage
              })
            )
          }
        }

        await Promise.all(persistenceTasks)

        if (responseUsage && responseUsage.totalTokens > 0) {
          await updateSessionTokenUsage(sessionId).catch((err) => {
            console.error("Failed to update session token usage:", err)
          })

          if (activeAccessPass) {
            try {
              const latestAccessPass = await getActiveAccessPass(user.id)

              if (latestAccessPass) {
                const latestQuota = buildChatTokenQuota(latestAccessPass)
                const remainingTokens = Math.max(
                  latestQuota.limit - latestQuota.used,
                  0
                )

                if (remainingTokens >= responseUsage.totalTokens) {
                  await consumeChatTokens(
                    latestAccessPass.id,
                    responseUsage.totalTokens
                  )
                }
              }
            } catch (err) {
              console.error("Failed to update access pass token usage:", err)
            }
          }
        }

        if (contextMessages.length >= 10) {
          void generateConversationSummary(
            contextMessages,
            conversationSummary || ""
          )
            .then(async (newSummary) => {
              await updateConversationSummary(sessionId, newSummary)
              const lastMsg = contextMessages[contextMessages.length - 1]
              if (lastMsg) {
                await logSummaryCheckpoint(sessionId, lastMsg.id, newSummary)
              }
            })
            .catch((error) => {
              console.error("[Resume Chat] Failed to generate summary:", error)
            })
        }
      }
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    return handleApiError(error)
  }
}
