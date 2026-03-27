"use client"

import { useAuiState } from "@assistant-ui/react"
import { useCallback, useEffect, useRef, useState } from "react"

export interface ChatSessionTokenUsage {
  sessionId: string
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCachedTokens: number
  totalReasoningTokens: number
  chatTokenLimit: number
  usedChatTokens: number
}

interface TokenUsageResponse {
  success: boolean
  data: ChatSessionTokenUsage
}

interface UseChatSessionTokenUsageParams {
  sessionId?: string
}

export function useChatSessionTokenUsage({
  sessionId
}: UseChatSessionTokenUsageParams) {
  const lastMessageId = useAuiState((s) => s.thread.messages.at(-1)?.id ?? "")
  const lastMessageRole = useAuiState(
    (s) => s.thread.messages.at(-1)?.role ?? ""
  )
  const [tokenUsage, setTokenUsage] = useState<ChatSessionTokenUsage | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(true)
  const previousAssistantMessageIdRef = useRef("")

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchTokenUsage = useCallback(async () => {
    if (!sessionId) {
      setTokenUsage(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/chat-sessions/${sessionId}/token-usage`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch token usage")
      }

      const payload = (await response.json()) as TokenUsageResponse

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return
      }

      setTokenUsage(payload.data)
      setError(null)
    } catch (fetchError: unknown) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return
      }

      setError(
        fetchError instanceof Error
          ? fetchError
          : new Error("Failed to fetch token usage")
      )
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [sessionId])

  useEffect(() => {
    void fetchTokenUsage()
  }, [fetchTokenUsage])

  useEffect(() => {
    if (
      sessionId &&
      lastMessageRole === "assistant" &&
      lastMessageId &&
      previousAssistantMessageIdRef.current === ""
    ) {
      previousAssistantMessageIdRef.current = lastMessageId
    }

    if (!sessionId || lastMessageRole !== "assistant" || !lastMessageId) {
      return
    }

    if (previousAssistantMessageIdRef.current !== lastMessageId) {
      previousAssistantMessageIdRef.current = lastMessageId
      void fetchTokenUsage()
    }
  }, [fetchTokenUsage, lastMessageId, lastMessageRole, sessionId])

  return {
    tokenUsage,
    isLoading,
    error
  }
}
