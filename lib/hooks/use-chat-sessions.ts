"use client"

import { useCallback, useEffect, useRef } from "react"
import type { SessionSummary } from "@/lib/agent/chat-history"
import { useResume } from "@/lib/store/resume"
import {
  useChatSessionsCreatingValue,
  useChatSessionsErrorValue,
  useChatSessionsLoadingValue,
  useChatSessionsValue,
  useSetChatSessions,
  useSetChatSessionsCreating,
  useSetChatSessionsError,
  useSetChatSessionsLoading
} from "@/lib/store/chat"

export interface UseChatSessionsReturn {
  sessions: SessionSummary[]
  loading: boolean
  creating: boolean
  error: Error | null
  createSession: () => Promise<SessionSummary>
  refreshSessions: () => Promise<SessionSummary[]>
  updateSessionTitleLocally: (id: string, title: string) => void
}

export function useChatSessions(): UseChatSessionsReturn {
  const { application } = useResume()
  const resumeId = application?.resume.id
  const { refreshSessions, ...state } = useChatSessionsStoreState(resumeId)

  useEffect(() => {
    void refreshSessions()
  }, [refreshSessions, resumeId])

  return { ...state, refreshSessions }
}

export function useChatSessionsState(): UseChatSessionsReturn {
  const { application } = useResume()
  return useChatSessionsStoreState(application?.resume.id)
}

function useChatSessionsStoreState(
  resumeId: string | undefined
): UseChatSessionsReturn {
  const sessions = useChatSessionsValue()
  const loading = useChatSessionsLoadingValue()
  const creating = useChatSessionsCreatingValue()
  const error = useChatSessionsErrorValue()
  const setSessions = useSetChatSessions()
  const setLoading = useSetChatSessionsLoading()
  const setCreating = useSetChatSessionsCreating()
  const setError = useSetChatSessionsError()

  const resumeIdRef = useRef(resumeId)
  resumeIdRef.current = resumeId

  const createSession = useCallback(async (): Promise<SessionSummary> => {
    try {
      if (!resumeIdRef.current) {
        throw new Error("Resume ID is required to create a session")
      }

      setCreating(true)
      setError(null)

      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resumeId: resumeIdRef.current
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create session")
      }

      const newSession: SessionSummary = await response.json()

      setSessions((prev) => [...prev, newSession])

      return newSession
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred")
      setError(error)
      throw error
    } finally {
      setCreating(false)
    }
  }, [setCreating, setError, setSessions])

  const refreshSessions = useCallback(async (): Promise<SessionSummary[]> => {
    if (!resumeIdRef.current) {
      setSessions([])
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/chat-sessions?resumeId=${resumeIdRef.current}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch sessions")
      }

      const sessionList: SessionSummary[] = (await response.json()) || []

      setSessions(sessionList)

      return sessionList
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred")
      setError(error)
      console.error("Failed to fetch chat sessions:", err)
      return []
    } finally {
      setLoading(false)
    }
  }, [setError, setLoading, setSessions])

  return {
    sessions,
    loading,
    creating,
    error,
    createSession,
    refreshSessions,
    updateSessionTitleLocally: (id, title) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id ? { ...session, title } : session
        )
      )
    }
  }
}
