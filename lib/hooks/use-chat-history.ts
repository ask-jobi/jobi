"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ChatHistoryEntry } from "@/lib/agent/chat-history"

export interface UseChatHistoryOptions {
  sessionId: string | null
  limit?: number
  onLoad?: (messages: ChatHistoryEntry[]) => void
}

export interface UseChatHistoryReturn {
  messages: ChatHistoryEntry[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useChatHistory({
  sessionId,
  limit = 100,
  onLoad
}: UseChatHistoryOptions): UseChatHistoryReturn {
  const [messages, setMessages] = useState<ChatHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const initialized = useRef(false)

  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  const fetchMessages = useCallback(async () => {
    if (!sessionIdRef.current) {
      return
    }

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

      setMessages(messageList)
      onLoad?.(messageList)
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred")
      setError(error)
      console.error("Failed to fetch chat messages:", err)
    } finally {
      setLoading(false)
    }
  }, [limit, onLoad])

  useEffect(() => {
    if (sessionIdRef.current && !initialized.current) {
      initialized.current = true
      fetchMessages()
    }
  }, [fetchMessages])

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages
  }
}
