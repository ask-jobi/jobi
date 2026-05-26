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
import { repairToolCall, tools } from "@/lib/agent/tools"
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
} from "@/lib/agent/chat-history"
import { generateConversationSummary } from "@/lib/agent/conversation-summary"
import { getJobApplicationByResumeId } from "@/server/resume"
import { model } from "@/lib/agent/model"
import { generateUUID } from "@/lib/utils"
import chatPrompt from "@/server/ai/prompts/resume-chat.prompt"
import { ResumeData, ResumeJobDescription } from "@/types/resume"
import { ResumeEvaluationOutput } from "@/types/evaluation"
import {
  logSummaryCheckpoint,
  logResumeModification
} from "@/server/chat-events"
import { ChatTokenUsage, ChatUIMessage } from "@/types/chat"
import {
  requireVerifiedUserIdentity,
  handleApiError
} from "@/server/auth-helper"
import { parseTokenUsage } from "@/lib/agent/token-usage"
import { isDefaultChatSessionTitle } from "@/lib/chat-session-title"
import {
  buildChatTokenQuota,
  consumeChatTokens,
  getActiveAccessPass,
  verifyChatTokenQuota
} from "@/server/quota"
import { generateChatSessionTitle } from "@/lib/agent/chat-session-title-generator"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
const CHAT_TOKEN_LIMIT_MESSAGE =
  "Your token balance is exhausted. Buy another token bundle to continue chatting."

const convertUIMessage = (msg: ChatHistoryEntry): ChatUIMessage => {
  return {
    id: msg.id,
    role: msg.role,
    parts: msg.parts
  }
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

    const [currentSession, contextMessages] = await Promise.all([
      getSessionSummary(sessionId),
      loadContextMessages(sessionId)
    ])

    const jobApplication = await getJobApplicationByResumeId(
      currentSession!!.resumeId
    )

    const resumeData = jobApplication.resumes.resume_json as ResumeData
    const resumeLang = jobApplication.resumes.language
    const jobDescription = jobApplication.jobs as ResumeJobDescription
    const evaluationReport = jobApplication.resumes
      .evaluation_report as ResumeEvaluationOutput

    const conversationSummary = currentSession?.conversationSummary

    const existingIdx = contextMessages.findIndex((m) => m.id === message.id)
    if (existingIdx >= 0) {
      contextMessages[existingIdx] = message
    } else {
      contextMessages.push(message)
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

    if (message.role === "user") {
      void saveMessage({
        id: message.id,
        sessionId,
        role: "user",
        parts: message.parts
      })
    }

    // 空的message会导致验证失败
    const uiMessages = await validateUIMessages<ChatUIMessage>({
      messages: allMessages,
      tools
    })

    const stream = createUIMessageStream({
      originalMessages: uiMessages,
      generateId: generateUUID,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: model,
          stopWhen: stepCountIs(5),
          messages: await convertToModelMessages(uiMessages),
          experimental_transform: smoothStream(),
          tools,
          experimental_repairToolCall: repairToolCall
        })

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
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
          generateChatSessionTitle(message.parts).then(async (title) => {
            if (!title) {
              return
            }

            await updateSessionTitle(sessionId, title)
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
          void updateSessionTokenUsage(sessionId).catch((err) => {
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
        if (responseMessage) {
          for (const part of responseMessage.parts) {
            if (
              (part.type === "tool-resumeEditorModify" ||
                part.type === "tool-resumeEditorReorder") &&
              part.state === "output-available"
            ) {
              void logResumeModification(
                sessionId,
                responseMessage.id,
                part.output as Record<string, unknown>
              )
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
