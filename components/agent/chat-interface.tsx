"use client"

import { cn } from "@/lib/utils"
import { editModalOpenAtom, useApplicationResume } from "@/lib/store/resume"
import { useChatHistory } from "@/lib/hooks/use-chat-history"
import { generateUUID } from "@/lib/utils"
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk"
import { useChat as useAIChat } from "@ai-sdk/react"
import { AssistantRuntimeProvider, ThreadPrimitive } from "@assistant-ui/react"
import { DefaultChatTransport } from "ai"
import { ThreadViewport, toUIMessage } from "./chat"
import { chatDataPartSchemas } from "@/types/chat"
import type { AuthoritativeResumePatch, ChatUIMessage } from "@/types/chat"
import { useEffect, useRef } from "react"
import { useAtomValue } from "jotai"
import {
  useAdjustPendingChatPatchCount,
  useChatSessionIdValue,
  usePendingChatActionValue,
  usePendingChatPatchCountValue,
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
  const { application, applicationResumeData, replaceAuthoritativeResume } =
    useApplicationResume()
  const isEditModalOpen = useAtomValue(editModalOpenAtom)
  const sessionId = useChatSessionIdValue()
  const pendingChatAction = usePendingChatActionValue()
  const pendingChatPatchCount = usePendingChatPatchCountValue()
  const setPendingChatAction = useSetPendingChatAction()
  const adjustPendingChatPatchCount = useAdjustPendingChatPatchCount()
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
    onData: (dataPart) => {
      if (dataPart.type !== "data-resume-patch") {
        return
      }

      const patch = dataPart.data as AuthoritativeResumePatch
      adjustPendingChatPatchCount(1)

      try {
        replaceAuthoritativeResume({
          resume: patch.body.resume,
          currentRevision: patch.nextVersion
        })
      } finally {
        adjustPendingChatPatchCount(-1)
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

    if (
      chat.status === "ready" &&
      lifecycle === "running" &&
      pendingChatPatchCount === 0
    ) {
      markRunFinished()
      notifyTokenBalanceUpdated()
    }
  }, [
    chat.status,
    lifecycle,
    markFailed,
    markRunFinished,
    markRunStarted,
    pendingChatPatchCount
  ])

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
