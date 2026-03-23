"use client"

import { cn } from "@/lib/utils"
import { useSetChatSessionId } from "@/lib/store/chat"
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
  ChatUIMessage,
  ResumeEditorModifyInput,
  ResumeEditorReorderInput
} from "@/types/chat"
import { useEffect, useState } from "react"

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const { application, resumeData, updateResumeByToolOutput } = useResume()
  const resumeId = application?.resume.id
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { sessionId } = useChatId({ resumeId })
  const setChatSessionId = useSetChatSessionId()

  useEffect(() => {
    setChatSessionId(sessionId)
  }, [sessionId, setChatSessionId])

  const chat = useAIChat<ChatUIMessage>({
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
      setIsInitialLoading(false)
    }
  })

  const runtime = useAISDKRuntime(chat)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root
        className={cn(
          "aui-root aui-thread-root @container flex h-full flex-col bg-background",
          className
        )}
      >
        <ThreadViewport isInitialLoading={isInitialLoading} />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}
