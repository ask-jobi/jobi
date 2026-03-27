"use client"

import { useEffect, useRef } from "react"
import { useAui, useAuiState } from "@assistant-ui/react"
import type { PendingChatHandoff } from "@/lib/store/chat"

interface ChatHandoffEffectProps {
  handoff: PendingChatHandoff | null
  resumeId?: string
  isInitialLoading: boolean
  onConsumed: () => void
}

export function ChatHandoffEffect({
  handoff,
  resumeId,
  isInitialLoading,
  onConsumed
}: ChatHandoffEffectProps) {
  const aui = useAui()
  const isRunning = useAuiState((s) => s.thread.isRunning)
  const lastConsumedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!handoff || isInitialLoading || isRunning) return
    if (!resumeId || handoff.resumeId !== resumeId) return
    if (lastConsumedIdRef.current === handoff.id) return

    lastConsumedIdRef.current = handoff.id
    aui.thread().append({
      content: [{ type: "text", text: handoff.message }],
      runConfig: aui.composer().getState().runConfig
    })
    onConsumed()
  }, [aui, handoff, isInitialLoading, isRunning, onConsumed, resumeId])

  return null
}
