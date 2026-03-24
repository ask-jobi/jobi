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
import type {
  ChatUIMessage,
  ResumeEditorModifyInput,
  ResumeEditorReorderInput
} from "@/types/chat"
import { useEffect, useState } from "react"
import { isDefaultChatSessionTitle } from "@/lib/chat-session-title"
import { useChatSessionsState } from "@/lib/hooks/use-chat-sessions"
import { useActiveChatSession } from "@/lib/hooks/use-active-chat-session"

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const { activeSessionId: sessionId } = useActiveChatSession()

  if (!sessionId) {
    return null
  }

  return <ChatInterfaceThread key={sessionId} className={className} />
}

function ChatInterfaceThread({ className }: ChatInterfaceProps) {
  const { resumeData, updateResumeByToolOutput } = useResume()
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { sessions, refreshSessions } = useChatSessionsState()
  const { activeSessionId: sessionId } = useActiveChatSession()
  const activeSession = sessions.find((session) => session.id === sessionId)

  useEffect(() => {
    setIsInitialLoading(Boolean(sessionId))
  }, [sessionId])

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
    onFinish: () => {
      if (activeSession && isDefaultChatSessionTitle(activeSession.title)) {
        void refreshSessions()
      }
    },
    transport: new DefaultChatTransport({
      api: "/api/chat/resume",
      prepareSendMessagesRequest({ messages, id }) {
        const latestMessage = messages[messages.length - 1]
        return { body: { message: latestMessage, id } }
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
