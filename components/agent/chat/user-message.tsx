"use client"

import { useCallback } from "react"
import {
  ActionBarPrimitive,
  MessagePrimitive,
  useAuiState,
  useThreadRuntime
} from "@assistant-ui/react"
import { Button } from "@/components/ui/button"
import { useResume } from "@/lib/store/resume"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Undo2 } from "lucide-react"

export function UserMessage() {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-[44rem] auto-rows-auto content-start gap-y-2 px-2 py-3 duration-150"
      data-role="user"
    >
      <div className="col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="mt-1 flex items-center gap-1 justify-end">
          <UserActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}

export function UserActionBar() {
  const t = useTranslations("chat")
  const messageId = useAuiState((s) => s.message?.id)
  const { updateResumeData } = useResume()
  const runtime = useThreadRuntime()

  const handleTruncate = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/truncate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to truncate")
      }

      const result = await response.json()
      console.log(result)

      if (result.resume) {
        updateResumeData(result.resume)
      }

      const currentMessages = runtime.exportExternalState()
      const messages = currentMessages.messages
      const messageIndex = messages.findIndex(
        (m: any) => m.message.id === messageId
      )
      if (messageIndex !== -1) {
        currentMessages.messages = messages.slice(0, messageIndex)
        if (messageIndex === 0) {
          currentMessages.headId = null
        }
        runtime.importExternalState(currentMessages)
      }

      toast.success(t("truncateSuccess"))
    } catch (error) {
      console.error("Truncate error:", error)
      toast.error(error instanceof Error ? error.message : t("truncateFailed"))
    }
  }, [runtime, updateResumeData, t, messageId])

  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="flex gap-1"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleTruncate}
        title={t("truncate")}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
    </ActionBarPrimitive.Root>
  )
}
