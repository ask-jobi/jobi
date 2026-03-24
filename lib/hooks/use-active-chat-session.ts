"use client"

import { useEffect } from "react"
import {
  useChatSessionIdValue,
  useChatSessionsLoadingValue,
  useChatSessionsValue,
  useSetChatSessionId
} from "@/lib/store/chat"

export interface UseActiveChatSessionReturn {
  activeSessionId: string
  selectSession: (sessionId: string) => void
  activateNewSession: (sessionId: string) => void
  clearActiveSession: () => void
}

export function useActiveChatSession(): UseActiveChatSessionReturn {
  const activeSessionId = useChatSessionIdValue()
  const setActiveSessionId = useSetChatSessionId()
  const sessions = useChatSessionsValue()
  const loading = useChatSessionsLoadingValue()

  useEffect(() => {
    if (loading) {
      return
    }

    if (sessions.length === 0) {
      setActiveSessionId("")
      return
    }

    if (sessions.some((session) => session.id === activeSessionId)) {
      return
    }

    setActiveSessionId(sessions[0].id)
  }, [activeSessionId, loading, sessions, setActiveSessionId])

  return {
    activeSessionId,
    selectSession: setActiveSessionId,
    activateNewSession: setActiveSessionId,
    clearActiveSession: () => setActiveSessionId("")
  }
}
