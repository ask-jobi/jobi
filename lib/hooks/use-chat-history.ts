"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ChatHistoryEntry } from "@/lib/agent/chat-history"

export interface UseChatHistoryOptions {
  sessionId: string | null
  limit?: number
}

export interface UseChatHistoryReturn {
  messages: ChatHistoryEntry[]
  loading: boolean
  isInitialLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useChatHistory({
  sessionId,
  limit = 100
}: UseChatHistoryOptions): UseChatHistoryReturn {
  const [messages, setMessages] = useState<ChatHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [didFinishFirstLoad, setDidFinishFirstLoad] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)

  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  const fetchMessages = useCallback(async () => {
    if (!sessionIdRef.current) {
      setMessages([])
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/chat-sessions/${sessionIdRef.current}/messages?limit=${limit}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch messages")
      }

      const messageList: ChatHistoryEntry[] = (await response.json()) || []

      if (requestId !== requestIdRef.current) {
        return
      }

      setMessages(messageList)
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }

      const error =
        err instanceof Error ? err : new Error("Unknown error occurred")
      setError(error)
      console.error("Failed to fetch chat messages:", err)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setDidFinishFirstLoad(true)
      }
    }
  }, [limit])

  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      setLoading(false)
      setDidFinishFirstLoad(false)
      return
    }

    setDidFinishFirstLoad(false)
    void fetchMessages()
  }, [fetchMessages, sessionId])

  return {
    messages,
    loading,
    isInitialLoading: loading && !didFinishFirstLoad,
    error,
    refetch: fetchMessages
  }
}
