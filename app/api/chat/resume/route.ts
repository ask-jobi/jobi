import { NextRequest, NextResponse } from "next/server"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  InferUITools,
  smoothStream,
  stepCountIs,
  streamText,
  ToolCallRepairFunction,
  UIDataTypes,
  UIMessage,
  validateUIMessages
} from "ai"
import { createClient } from "@/lib/supabase/server"
import { tools } from "@/lib/agent/tools"
import {
  getSessionSummary,
  loadHistory,
  saveMessage,
  updateMessage
} from "@/lib/agent/chat-history"
import { getJobApplicationByResumeId } from "@/server/resume"
import { model } from "@/lib/agent/model"
import { generateUUID } from "@/lib/utils"
import chatPrompt from "@/server/ai/prompts/resume-chat.prompt"
import { ResumeData, ResumeJobDescription } from "@/types/resume"
import { ResumeEvaluationOutput } from "@/types/evaluation"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export type UseChatToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>

const MAX_HISTORY_MESSAGES = 20

const repairToolCall: ToolCallRepairFunction<typeof tools> = async ({
  toolCall,
  tools,
  error
}) => {
  console.log("toolCall: ", toolCall)

  return toolCall
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, id: sessionId }: { message: UIMessage; id: string } =
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

    const previousMessages = await loadHistory(sessionId, {
      limit: MAX_HISTORY_MESSAGES
    })

    const validatedHistoryMessages = previousMessages.filter(
      (msg) => msg.id !== message.id
    )

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
            language: resumeLang
          })
        }
      ],
      createdAt: new Date().toISOString()
    } as UIMessage

    const allMessages: UIMessage[] = [
      systemMessage,
      ...validatedHistoryMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
        createdAt: msg.createdAt
      })),
      message
    ]

    if (message.role === "user") {
      await saveMessage({
        id: message.id,
        sessionId,
        role: "user",
        parts: message.parts
      })
    }

    const uiMessages = await validateUIMessages<UseChatToolsMessage>({
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
      onFinish: async ({ messages: finishedMessages }) => {
        for (const finishedMsg of finishedMessages.filter(
          (msg) => msg.id !== "system"
        )) {
          const existingMsg = allMessages.find((m) => m.id === finishedMsg.id)
          if (existingMsg) {
            await updateMessage({
              messageId: existingMsg.id,
              parts: finishedMsg.parts
            })
          } else {
            await saveMessage({
              id: finishedMsg.id,
              sessionId,
              role: finishedMsg.role,
              parts: finishedMsg.parts
            })
          }
        }
      }
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
