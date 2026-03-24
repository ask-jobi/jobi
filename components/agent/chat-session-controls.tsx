"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  DEFAULT_CHAT_SESSION_TITLE,
  isDefaultChatSessionTitle
} from "@/lib/chat-session-title"
import { MessageSquarePlus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSetAtom } from "jotai"
import { openRightPanelAtom } from "@/lib/store/resume"
import { useChatSessionsState } from "@/lib/hooks/use-chat-sessions"
import { useActiveChatSession } from "@/lib/hooks/use-active-chat-session"

export function ChatSessionControls() {
  const t = useTranslations("chat")
  const openRightPanel = useSetAtom(openRightPanelAtom)
  const { sessions, loading, creating, createSession } = useChatSessionsState()
  const { activeSessionId, selectSession, activateNewSession } =
    useActiveChatSession()

  return (
    <div className="border-b bg-muted/50 px-3 py-2">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {sessions.map((session, index) => (
            <button
              key={session.id}
              type="button"
              onClick={() => selectSession(session.id)}
              className={cn(
                "min-w-0 max-w-full rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
                session.id === activeSessionId
                  ? "border-primary bg-background text-foreground"
                  : "border-transparent bg-background/70 text-muted-foreground hover:bg-background"
              )}
            >
              <span className="block truncate font-medium">
                {getSessionLabel(
                  session.title,
                  index,
                  t("sessionFallbackTitle")
                )}
              </span>
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void createSession().then((session) => {
                activateNewSession(session.id)
              })
            }}
            disabled={loading || creating}
            className="h-8 text-xs"
          >
            {creating ? <Spinner /> : <MessageSquarePlus />}
            {t("newSession")}
          </Button>
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
    </div>
  )
}

function getSessionLabel(
  title: string | null,
  index: number,
  fallbackLabel: string
) {
  if (!isDefaultChatSessionTitle(title)) {
    return title
  }

  if (title === DEFAULT_CHAT_SESSION_TITLE) {
    return `${fallbackLabel} ${index + 1}`
  }

  return fallbackLabel
}
