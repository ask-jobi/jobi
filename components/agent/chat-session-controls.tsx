"use client"

import { Spinner } from "@/components/ui/spinner"
import {
  DEFAULT_CHAT_SESSION_TITLE,
  isDefaultChatSessionTitle
} from "@/lib/chat-session-title"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSetAtom } from "jotai"
import { openRightPanelAtom } from "@/lib/store/resume"
import { useChatSessionState } from "@/lib/hooks/use-chat-session"

export function ChatSessionControls() {
  const t = useTranslations("chat")
  const openRightPanel = useSetAtom(openRightPanelAtom)
  const { session, loading } = useChatSessionState()
  const sessionLabel = getSessionLabel(
    session?.title,
    t("sessionFallbackTitle")
  )

  return (
    <div className="border-b bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 truncate text-sm font-medium">
          {sessionLabel}
        </div>
        <button
          type="button"
          onClick={() => openRightPanel("evaluation")}
          className="rounded p-1 hover:bg-muted"
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {loading && (
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          <Spinner className="mr-2" />
          {t("loading")}
        </div>
      )}
    </div>
  )
}

function getSessionLabel(
  title: string | null | undefined,
  fallbackLabel: string
) {
  if (!isDefaultChatSessionTitle(title)) {
    return title
  }

  if (title === DEFAULT_CHAT_SESSION_TITLE) {
    return fallbackLabel
  }

  return fallbackLabel
}
