import { useRef } from "react"
import { ThreadPrimitive, AuiIf } from "@assistant-ui/react"
import { Composer } from "./composer"
import { ThreadWelcome } from "./thread-welcome"
import { UserMessage } from "@/components/agent/chat/user-message"
import { AssistantMessage } from "@/components/agent/chat/assistant-message"
import { ChatLoadingSkeleton } from "./chat-loading-skeleton"
import type { ChatThreadLifecycle } from "@/lib/store/chat"

export function ThreadViewport({
  lifecycle
}: {
  lifecycle: ChatThreadLifecycle
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const isLoadingThread =
    lifecycle === "loading-history" || lifecycle === "syncing-thread"

  return (
    <ThreadPrimitive.Viewport
      ref={viewportRef}
      autoScroll
      scrollToBottomOnInitialize
      scrollToBottomOnRunStart
      scrollToBottomOnThreadSwitch
      turnAnchor="top"
      className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-4"
    >
      {isLoadingThread && <ChatLoadingSkeleton />}
      <AuiIf condition={(s) => s.thread.isEmpty && lifecycle === "ready"}>
        <ThreadWelcome />
      </AuiIf>
      <ThreadPrimitive.Messages
        components={{
          UserMessage,
          AssistantMessage
        }}
      />
      <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-[44rem] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 pt-2">
        <Composer lifecycle={lifecycle} />
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Viewport>
  )
}
