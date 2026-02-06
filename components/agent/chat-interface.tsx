"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useResume } from "@/lib/store/resume"
import { useChatId } from "@/lib/hooks/use-chat-id"
import { useChatHistory } from "@/lib/hooks/use-chat-history"
import { generateUUID } from "@/lib/utils"
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk"
import { useChat as useAIChat } from "@ai-sdk/react"
import { AssistantRuntimeProvider, ThreadPrimitive } from "@assistant-ui/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls
} from "ai"
import {
  ThreadViewport,
  executeResumeEditorModifyTool,
  executeResumeEditorReorderTool,
  toUIMessage
} from "./chat"
import type {
  ResumeEditorModifyInput,
  ResumeEditorReorderInput
} from "@/types/chat"
import { useTranslations } from "next-intl"

interface ChatInterfaceProps {
  className?: string
}

function LoadingState() {
  const t = useTranslations("chat")
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  )
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const { application, resumeData, updateResumeByToolOutput } = useResume()
  const resumeId = application?.resume.id

  const { sessionId, loading: sessionLoading } = useChatId({ resumeId })

  const chat = useAIChat({
    id: sessionId,
    generateId: generateUUID,
    onToolCall: async ({ toolCall }) => {
      const { input } = toolCall

      let output = null
      if (toolCall.toolName === "resumeEditorModify") {
        const typedInput = input as ResumeEditorModifyInput

        output = await executeResumeEditorModifyTool(typedInput, resumeData!!)
      }
      if (toolCall.toolName === "resumeEditorReorder") {
        const typedInput = input as ResumeEditorReorderInput

        output = await executeResumeEditorReorderTool(typedInput, resumeData!!)
      }

      if (output) {
        chat.addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output
        })

        await updateResumeByToolOutput(output)
      }
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      api: "/api/chat/resume",
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: messages[messages.length - 1], id } }
      }
    })
  })

  useChatHistory({
    sessionId,
    onLoad: (entries) => {
      const loadedMessages = entries.map(toUIMessage)
      chat.setMessages(loadedMessages)
    }
  })

  const runtime = useAISDKRuntime(chat)

  if (sessionLoading || !sessionId) {
    return (
      <div className={cn("flex flex-col h-full bg-background", className)}>
        <LoadingState />
      </div>
    )
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root
        className={cn(
          "aui-root aui-thread-root @container flex h-full flex-col bg-background",
          className
        )}
      >
        <ThreadViewport />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}
