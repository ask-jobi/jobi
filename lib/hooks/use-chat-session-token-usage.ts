"use client"

import { useEffect, useRef, useState } from "react"

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
  refreshKey?: string | number
  enabled?: boolean
}

export function useChatSessionTokenUsage({
  sessionId,
  refreshKey,
  enabled = true
}: UseChatSessionTokenUsageParams) {
  const [tokenUsage, setTokenUsage] = useState<ChatSessionTokenUsage | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setTokenUsage(null)
      setError(null)
      setIsLoading(false)
      return
    }

    if (!enabled) {
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current?.abort()
    abortControllerRef.current = abortController
    setIsLoading(true)

    fetch(`/api/chat-sessions/${sessionId}/token-usage`, {
      signal: abortController.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch token usage")
        }

        return (await response.json()) as TokenUsageResponse
      })
      .then((payload) => {
        setTokenUsage(payload.data)
        setError(null)
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return
        }

        setError(
          fetchError instanceof Error
            ? fetchError
            : new Error("Failed to fetch token usage")
        )
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [enabled, refreshKey, sessionId])

  return {
    tokenUsage,
    isLoading,
    error
  }
}
