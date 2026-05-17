"use client"

import { useEffect, useRef } from "react"
import { useAui } from "@assistant-ui/react"
import type { ChatThreadLifecycle, PendingChatAction } from "@/lib/store/chat"

interface ChatPendingActionEffectProps {
  action: PendingChatAction | null
  lifecycle: ChatThreadLifecycle
  resumeId?: string
  onConsumed: () => void
}

export function ChatPendingActionEffect({
  action,
  lifecycle,
  resumeId,
  onConsumed
}: ChatPendingActionEffectProps) {
  const aui = useAui()
  const lastConsumedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!action || lifecycle !== "ready") return
    if (!resumeId || action.resumeId !== resumeId) return
    if (lastConsumedIdRef.current === action.id) return

    lastConsumedIdRef.current = action.id
    aui.thread().append({
      content: [{ type: "text", text: action.message }],
      runConfig: aui.composer().getState().runConfig
    })
    onConsumed()
  }, [action, aui, lifecycle, onConsumed, resumeId])

  return null
}
