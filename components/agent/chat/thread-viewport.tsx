import { useCallback, useRef, useEffect } from "react"
import { useMutationObserver } from "@mantine/hooks"
import {
  ThreadPrimitive,
  useAuiState,
  AuiIf,
  useAui
} from "@assistant-ui/react"
import { Composer } from "./composer"
import { ThreadWelcome } from "./thread-welcome"
import { UserMessage } from "@/components/agent/chat/user-message"
import { AssistantMessage } from "@/components/agent/chat/assistant-message"
import { ChatLoadingSkeleton } from "./chat-loading-skeleton"

export function ThreadViewport({
  isInitialLoading
}: {
  isInitialLoading: boolean
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const isRunning = useAuiState((s) => s.thread.isRunning)
  const messagesLength = useAuiState((s) => s.thread.messages?.length ?? 0)
  const aui = useAui()

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [])

  const getTarget = isRunning ? () => viewportRef.current as HTMLElement : null

  useMutationObserver(
    scrollToBottom,
    {
      childList: true,
      subtree: true,
      characterData: true
    },
    getTarget
  )

  useEffect(() => {
    scrollToBottom()
  }, [messagesLength, scrollToBottom])

  return (
    <ThreadPrimitive.Viewport
      ref={viewportRef}
      turnAnchor="top"
      className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-4"
    >
      {isInitialLoading && <ChatLoadingSkeleton />}
      <AuiIf condition={(s) => s.thread.isEmpty && !isInitialLoading}>
        <ThreadWelcome />
      </AuiIf>
      <ThreadPrimitive.Messages
        components={{
          UserMessage,
          AssistantMessage
        }}
      />
      <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-[44rem] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 pt-2">
        <Composer />
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Viewport>
  )
}
