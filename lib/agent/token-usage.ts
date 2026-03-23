export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  reasoningTokens: number
  totalTokens: number
}

const emptyTokenUsage = (): TokenUsage => {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0
  }
}

const getNumber = (value: unknown): number | undefined => {
  return typeof value === "number" ? value : undefined
}

export function parseTokenUsage(usage: unknown): TokenUsage {
  if (!usage || typeof usage !== "object") {
    return emptyTokenUsage()
  }

  const usageRecord = usage as Record<string, unknown>
  const rawUsage =
    usageRecord.raw && typeof usageRecord.raw === "object"
      ? (usageRecord.raw as Record<string, unknown>)
      : undefined

  const inputTokens =
    getNumber(rawUsage?.input_tokens) ?? getNumber(usageRecord.inputTokens) ?? 0
  const outputTokens =
    getNumber(rawUsage?.output_tokens) ??
    getNumber(usageRecord.outputTokens) ??
    0
  const cacheCreationTokens =
    getNumber(rawUsage?.cache_creation_input_tokens) ?? 0
  const cacheReadTokens =
    getNumber(rawUsage?.cache_read_input_tokens) ??
    getNumber(usageRecord.cachedInputTokens) ??
    0
  const reasoningTokens =
    getNumber(rawUsage?.reasoning_tokens) ??
    getNumber(usageRecord.reasoningTokens) ??
    0
  const totalTokens =
    getNumber(usageRecord.totalTokens) ??
    inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens

  return {
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    reasoningTokens,
    totalTokens
  }
}

export function getEmptyTokenUsage(): TokenUsage {
  return emptyTokenUsage()
}
