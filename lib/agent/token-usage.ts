export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  totalTokens: number
}

export function parseTokenUsage(usageMetadata?: {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
}): TokenUsage {
  if (!usageMetadata) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0
    }
  }

  return {
    inputTokens: usageMetadata.promptTokens ?? 0,
    outputTokens: usageMetadata.completionTokens ?? 0,
    cacheCreationTokens: usageMetadata.cacheCreationTokens ?? 0,
    cacheReadTokens: usageMetadata.cacheReadTokens ?? 0,
    totalTokens: usageMetadata.totalTokens ?? 0
  }
}

export interface TokenUsageFromStream {
  usageMetadata?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    cacheCreationTokens?: number
    cacheReadTokens?: number
  }
}

export function extractTokenUsageFromStream(streamResult: unknown): TokenUsage {
  if (!streamResult || typeof streamResult !== "object") {
    return {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0
    }
  }

  const result = streamResult as Record<string, unknown>
  const usageMetadata = result.usageMetadata as
    | {
        promptTokens?: number
        completionTokens?: number
        totalTokens?: number
        cacheCreationTokens?: number
        cacheReadTokens?: number
      }
    | undefined

  if (!usageMetadata) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0
    }
  }

  return {
    inputTokens: usageMetadata.promptTokens ?? 0,
    outputTokens: usageMetadata.completionTokens ?? 0,
    cacheCreationTokens: usageMetadata.cacheCreationTokens ?? 0,
    cacheReadTokens: usageMetadata.cacheReadTokens ?? 0,
    totalTokens: usageMetadata.totalTokens ?? 0
  }
}
