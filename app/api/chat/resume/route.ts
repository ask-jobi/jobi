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
  updateSessionTokenUsage
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
import { ChatUIMessage } from "@/types/chat"
import { getAuthenticatedUser, handleApiError } from "@/server/auth-helpers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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

export async function POST(request: NextRequest) {
  try {
    await getAuthenticatedUser()

    const { message, id: sessionId }: { message: ChatUIMessage; id: string } =
      await request.json()

    const currentSession = await getSessionSummary(sessionId)
    const jobApplication = await getJobApplicationByResumeId(
      currentSession!!.resumeId
    )

    const resumeData = jobApplication.resumes.resume_json as ResumeData
    const resumeLang = jobApplication.resumes.language
    const jobDescription = jobApplication.jobs as ResumeJobDescription
    const evaluationReport = jobApplication.resumes
      .evaluation_report as ResumeEvaluationOutput

    const conversationSummary = currentSession?.conversationSummary

    const contextMessages = await loadContextMessages(sessionId)
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

    if (message.role === "user") {
      await saveMessage({
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

        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }))
      },
      onFinish: async ({ messages: finishedMessages, responseMessage }) => {
        let parsedUsage: {
          inputTokens: number
          outputTokens: number
          cachedTokens: number
          reasoningTokens: number
          totalTokens: number
        } | null = null

        try {
          const result = streamText({
            model: model,
            stopWhen: stepCountIs(5),
            messages: await convertToModelMessages(uiMessages),
            tools
          })
          const usage = await result.usage
          console.log("usage ", usage)
          if (usage) {
            parsedUsage = {
              inputTokens:
                (usage as { promptTokens?: number }).promptTokens ?? 0,
              outputTokens:
                (usage as { completionTokens?: number }).completionTokens ?? 0,
              cachedTokens:
                ((usage as { cacheReadTokens?: number }).cacheReadTokens ?? 0) +
                ((usage as { cacheCreationTokens?: number })
                  .cacheCreationTokens ?? 0),
              reasoningTokens:
                (usage as { reasoningTokens?: number }).reasoningTokens ?? 0,
              totalTokens: (usage as { totalTokens?: number }).totalTokens ?? 0
            }
          }
        } catch {
          // Ignore errors when getting usage
        }

        for (const finishedMsg of finishedMessages.filter(
          (msg) => msg.id !== "system"
        )) {
          const existingMsg = allMessages.find((m) => m.id === finishedMsg.id)
          if (existingMsg) {
            await updateMessage({
              messageId: existingMsg.id,
              parts: finishedMsg.parts,
              tokenCount: parsedUsage?.totalTokens,
              inputTokens: parsedUsage?.inputTokens,
              outputTokens: parsedUsage?.outputTokens,
              cachedTokens: parsedUsage?.cachedTokens,
              reasoningTokens: parsedUsage?.reasoningTokens
            })
          } else {
            contextMessages.push(finishedMsg)
            await saveMessage({
              id: finishedMsg.id,
              sessionId,
              role: finishedMsg.role,
              parts: finishedMsg.parts,
              inputTokens: parsedUsage?.inputTokens,
              outputTokens: parsedUsage?.outputTokens,
              cachedTokens: parsedUsage?.cachedTokens,
              reasoningTokens: parsedUsage?.reasoningTokens
            })
          }
        }

        if (parsedUsage && parsedUsage.totalTokens > 0) {
          await updateSessionTokenUsage(sessionId).catch((err) => {
            console.error("Failed to update session token usage:", err)
          })
        }

        console.log("responseMessage", responseMessage)
        if (responseMessage) {
          for (const part of responseMessage.parts) {
            if (
              (part.type === "tool-resumeEditorModify" ||
                part.type === "tool-resumeEditorReorder") &&
              part.state === "output-available"
            ) {
              await logResumeModification(
                sessionId,
                responseMessage.id,
                part.output as Record<string, unknown>
              )
            }
          }
        }

        if (contextMessages.length >= 10) {
          generateConversationSummary(
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
    console.error("Chat API error:", error)
    return handleApiError(error)
  }
}
