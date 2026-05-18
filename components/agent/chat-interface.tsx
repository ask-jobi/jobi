"use client"

import { cn } from "@/lib/utils"
import { editModalOpenAtom, useApplicationResume } from "@/lib/store/resume"
import { applyToolOutputToResume } from "@/lib/resume/mutations"
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
import { useEffect, useRef } from "react"
import { useAtomValue } from "jotai"
import {
  useChatSessionIdValue,
  usePendingChatActionValue,
  useSetPendingChatAction
} from "@/lib/store/chat"
import { ChatPendingActionEffect } from "./chat/chat-pending-action-effect"
import { useChatThreadLifecycle } from "@/lib/hooks/use-chat-thread-lifecycle"
import { notifyTokenBalanceUpdated } from "@/lib/token-balance-events"

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
  const { application, applicationResumeData, saveApplicationResume } =
    useApplicationResume()
  const isEditModalOpen = useAtomValue(editModalOpenAtom)
  const sessionId = useChatSessionIdValue()
  const pendingChatAction = usePendingChatActionValue()
  const setPendingChatAction = useSetPendingChatAction()
  const {
    lifecycle,
    markThreadSynced,
    markRunStarted,
    markRunFinished,
    markFailed
  } = useChatThreadLifecycle()

  const chat = useAIChat<ChatUIMessage>({
    id: sessionId,
    generateId: generateUUID,
    dataPartSchemas: chatDataPartSchemas,
    onToolCall: async ({ toolCall }) => {
      const { input } = toolCall

      if (!applicationResumeData) {
        return
      }

      if (toolCall.toolName === "resumeEditorModify") {
        const typedInput = input as ResumeEditorModifyInput

        const modifyOutput = (await executeResumeEditorModifyTool(
          typedInput,
          applicationResumeData
        )) as ResumeEditorModifyOutput

        addToolOutput({
          tool: "resumeEditorModify",
          toolCallId: toolCall.toolCallId,
          output: modifyOutput
        })

        const nextResume = applyToolOutputToResume(
          applicationResumeData,
          modifyOutput
        )
        await saveApplicationResume(nextResume)
      } else if (toolCall.toolName === "resumeEditorReorder") {
        const typedInput = input as ResumeEditorReorderInput

        const reorderOutput = (await executeResumeEditorReorderTool(
          typedInput,
          applicationResumeData
        )) as ResumeEditorReorderOutput

        addToolOutput({
          tool: "resumeEditorReorder",
          toolCallId: toolCall.toolCallId,
          output: reorderOutput
        })

        const nextResume = applyToolOutputToResume(
          applicationResumeData,
          reorderOutput
        )
        await saveApplicationResume(nextResume)
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

  const { messages, hasLoadedInitialHistory } = useChatHistory({ sessionId })
  const setChatMessagesRef = useRef(chat.setMessages)
  setChatMessagesRef.current = chat.setMessages

  useEffect(() => {
    if (!hasLoadedInitialHistory) {
      return
    }

    const loadedMessages = messages.map(toUIMessage)
    setChatMessagesRef.current(loadedMessages as ChatUIMessage[])
    const frameId = requestAnimationFrame(() => {
      markThreadSynced()
    })

    return () => cancelAnimationFrame(frameId)
  }, [hasLoadedInitialHistory, markThreadSynced, messages])

  useEffect(() => {
    if (chat.status === "error") {
      markFailed()
      return
    }

    if (chat.status === "submitted" || chat.status === "streaming") {
      markRunStarted()
      return
    }

    if (chat.status === "ready" && lifecycle === "running") {
      markRunFinished()
      notifyTokenBalanceUpdated()
    }
  }, [chat.status, lifecycle, markFailed, markRunFinished, markRunStarted])

  const runtime = useAISDKRuntime(chat)

  if (isEditModalOpen || !applicationResumeData) {
    return null
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root
        className={cn(
          "aui-root aui-thread-root @container flex h-full flex-col bg-background",
          className
        )}
      >
        <ChatPendingActionEffect
          action={pendingChatAction}
          lifecycle={lifecycle}
          resumeId={application?.resume.id}
          onConsumed={() => setPendingChatAction(null)}
        />
        <ThreadViewport lifecycle={lifecycle} />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}
