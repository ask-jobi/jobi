"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { SessionSummary } from "@/lib/agent/chat-history"
import { useAuth } from "@/lib/hooks/use-auth"

interface UseChatIdOptions {
  resumeId?: string
}

interface UseChatIdReturn {
  sessionId: string
  sessions: SessionSummary[]
  loading: boolean
  error: Error | null
}

export function useChatId({ resumeId }: UseChatIdOptions): UseChatIdReturn {
  const [sessionId, setSessionId] = useState<string>("")
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const initialized = useRef(false)

  const resumeIdRef = useRef(resumeId)
  resumeIdRef.current = resumeId

  const createNewSession = useCallback(async (): Promise<string> => {
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

    const newSession = await response.json()

    setSessions((prev) => [newSession, ...prev])
    setSessionId(newSession.id)

    return newSession.id
  }, [])

  const fetchSessions = useCallback(async () => {
    if (!resumeIdRef.current) {
      return
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

      const result = await response.json()
      const sessionList: SessionSummary[] = result || []

      setSessions(sessionList)

      if (sessionList.length > 0) {
        setSessionId(sessionList[0].id)
      } else {
        await createNewSession()
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred")
      setError(error)
      console.error("Failed to fetch chat sessions:", err)
    } finally {
      setLoading(false)
    }
  }, [createNewSession])

  useEffect(() => {
    if (resumeIdRef.current && !initialized.current) {
      initialized.current = true
      fetchSessions()
    }
  }, [fetchSessions])

  return {
    sessionId,
    sessions,
    loading,
    error
  }
}
