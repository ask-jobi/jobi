"use client"

import { useCallback, useEffect, useRef } from "react"
import type { SessionSummary } from "@/server/ai/chat/history"
import { useApplicationResume } from "@/lib/store/resume"
import {
  useChatSessionErrorValue,
  useChatSessionValue,
  useChatSessionLoadingValue,
  useSetChatSession,
  useSetChatSessionId,
  useSetChatSessionLoading,
  useSetChatSessionError
} from "@/lib/store/chat"

export interface UseChatSessionReturn {
  session: SessionSummary | null
  loading: boolean
  error: Error | null
  refreshSession: () => Promise<SessionSummary | null>
}

export function useChatSession(): UseChatSessionReturn {
  const { application } = useApplicationResume()
  const resumeId = application?.resume.id
  const { refreshSession, ...state } = useChatSessionStoreState(resumeId)

  useEffect(() => {
    void refreshSession()
  }, [refreshSession, resumeId])

  return { ...state, refreshSession }
}

export function useChatSessionState(): UseChatSessionReturn {
  const { application } = useApplicationResume()
  return useChatSessionStoreState(application?.resume.id)
}

function useChatSessionStoreState(
  resumeId: string | undefined
): UseChatSessionReturn {
  const session = useChatSessionValue()
  const loading = useChatSessionLoadingValue()
  const error = useChatSessionErrorValue()
  const setSession = useSetChatSession()
  const setSessionId = useSetChatSessionId()
  const setLoading = useSetChatSessionLoading()
  const setError = useSetChatSessionError()

  const resumeIdRef = useRef(resumeId)
  resumeIdRef.current = resumeId

  const refreshSession =
    useCallback(async (): Promise<SessionSummary | null> => {
      if (!resumeIdRef.current) {
        setSession(null)
        setSessionId("")
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/chat-sessions?resumeId=${resumeIdRef.current}`
        )

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string }
          throw new Error(errorData.error || "Failed to fetch chat session")
        }

        const nextSession: SessionSummary | null = await response.json()
        setSession(nextSession)
        setSessionId(nextSession?.id ?? "")

        return nextSession
      } catch (err) {
        const nextError =
          err instanceof Error ? err : new Error("Unknown error occurred")
        setError(nextError)
        console.error("Failed to fetch chat session:", err)
        return null
      } finally {
        setLoading(false)
      }
    }, [setError, setLoading, setSession, setSessionId])

  return {
    session,
    loading,
    error,
    refreshSession
  }
}
