"use client"

import { cn } from "@/lib/utils"
import { useResume } from "@/lib/store/resume"
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
import { chatDataPartSchemas } from "@/types/chat"
import type {
  ChatUIMessage,
  ResumeEditorModifyInput,
  ResumeEditorModifyOutput,
  ResumeEditorReorderInput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import { useEffect, useState } from "react"
import { useChatSessionState } from "@/lib/hooks/use-chat-session"
import { useChatSessionIdValue } from "@/lib/store/chat"

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const sessionId = useChatSessionIdValue()

  if (!sessionId) {
    return null
  }

  return <ChatInterfaceThread key={sessionId} className={className} />
}

function ChatInterfaceThread({ className }: ChatInterfaceProps) {
  const { resumeData, updateResumeByToolOutput } = useResume()
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { updateSessionTitleLocally } = useChatSessionState()
  const sessionId = useChatSessionIdValue()

  useEffect(() => {
    setIsInitialLoading(Boolean(sessionId))
  }, [sessionId])

  const chat = useAIChat<ChatUIMessage>({
    id: sessionId,
    generateId: generateUUID,
    dataPartSchemas: chatDataPartSchemas,
    onData: (part) => {
      if (part.type === "data-sessionTitle") {
        const titleUpdate = part.data as {
          sessionId: string
          title: string
        }
        if (titleUpdate.sessionId === sessionId) {
          updateSessionTitleLocally(titleUpdate.title)
        }
      }
    },
    onToolCall: async ({ toolCall }) => {
      const { input } = toolCall

      if (toolCall.toolName === "resumeEditorModify") {
        const typedInput = input as ResumeEditorModifyInput

        const modifyOutput = (await executeResumeEditorModifyTool(
          typedInput,
          resumeData!!
        )) as ResumeEditorModifyOutput

        addToolOutput({
          tool: "resumeEditorModify",
          toolCallId: toolCall.toolCallId,
          output: modifyOutput
        })

        await updateResumeByToolOutput(modifyOutput)
      } else if (toolCall.toolName === "resumeEditorReorder") {
        const typedInput = input as ResumeEditorReorderInput

        const reorderOutput = (await executeResumeEditorReorderTool(
          typedInput,
          resumeData!!
        )) as ResumeEditorReorderOutput

        addToolOutput({
          tool: "resumeEditorReorder",
          toolCallId: toolCall.toolCallId,
          output: reorderOutput
        })

        await updateResumeByToolOutput(reorderOutput)
      }
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      api: "/api/chat/resume",
      prepareSendMessagesRequest({ messages, id }) {
        const latestMessage = messages[messages.length - 1]
        return { body: { message: latestMessage, id } }
      }
    })
  })

  const addToolOutput = chat.addToolOutput as (
    output:
      | {
          tool: "resumeEditorModify"
          toolCallId: string
          output: ResumeEditorModifyOutput
        }
      | {
          tool: "resumeEditorReorder"
          toolCallId: string
          output: ResumeEditorReorderOutput
        }
  ) => void

  useChatHistory({
    sessionId,
    onLoad: (entries) => {
      const loadedMessages = entries.map(toUIMessage)
      chat.setMessages(loadedMessages as ChatUIMessage[])
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
