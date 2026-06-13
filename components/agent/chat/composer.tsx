"use client"

import type { FormEvent } from "react"
import {
  ComposerPrimitive,
  AuiIf,
  useAui,
  useAuiState
} from "@assistant-ui/react"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon, SquareIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useApplicationResume } from "@/lib/store/resume"
import {
  useSetPendingChatAction,
  type ChatThreadLifecycle
} from "@/lib/store/chat"

interface ComposerProps {
  lifecycle: ChatThreadLifecycle
}

export function Composer({ lifecycle }: ComposerProps) {
  const t = useTranslations("chat")
  const aui = useAui()
  const { application } = useApplicationResume()
  const setPendingChatAction = useSetPendingChatAction()
  const isSendDisabled = useAuiState(
    (s) => s.thread.isRunning || !s.composer.isEditing || s.composer.isEmpty
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (lifecycle === "ready" || lifecycle === "error") {
      return
    }

    const message = aui.composer().getState().text.trim()
    if (!message || !application?.resume.id) {
      event.preventDefault()
      return
    }

    event.preventDefault()
    setPendingChatAction({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      resumeId: application.resume.id,
      message
    })
    aui.composer().setText("")
  }

  return (
    <ComposerPrimitive.Root
      className="aui-composer-root relative flex w-full flex-col"
      onSubmit={handleSubmit}
    >
      <div className="relative">
        <ComposerPrimitive.Input
          placeholder={t("composerPlaceholder")}
          className="aui-composer-input pr-12 max-h-32 min-h-14 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <div className="aui-composer-action-wrapper absolute bottom-3 right-2 flex items-center gap-1">
          <AuiIf condition={(s) => !s.thread.isRunning}>
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-8 w-8"
              aria-label="Send message"
              disabled={isSendDisabled}
            >
              <ArrowUpIcon className="h-4 w-4" />
            </Button>
          </AuiIf>
          <AuiIf condition={(s) => s.thread.isRunning}>
            <ComposerPrimitive.Cancel asChild>
              <Button
                type="button"
                size="icon"
                variant="default"
                className="rounded-full h-8 w-8"
                aria-label={t("stopGenerating")}
              >
                <SquareIcon className="h-3 w-3 fill-current" />
              </Button>
            </ComposerPrimitive.Cancel>
          </AuiIf>
        </div>
      </div>
    </ComposerPrimitive.Root>
  )
}
