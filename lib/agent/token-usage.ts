import type { LanguageModelUsage } from "ai"

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
  totalTokens: number
}

const emptyTokenUsage = (): TokenUsage => {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0
  }
}

export function parseTokenUsage(
  usage: LanguageModelUsage | undefined
): TokenUsage {
  if (!usage) {
    return emptyTokenUsage()
  }

  const inputTokens = usage.inputTokenDetails.noCacheTokens ?? 0
  const cachedTokens = usage.inputTokenDetails.cacheReadTokens ?? 0
  const outputTokens = usage.outputTokens ?? 0
  // reasoningTokens is a sub-breakdown of output, not additive
  const reasoningTokens = usage.outputTokenDetails.reasoningTokens ?? 0
  // Trust provider/AI SDK total directly
  const totalTokens = usage.totalTokens ?? 0

  return {
    inputTokens,
    outputTokens,
    cachedTokens,
    reasoningTokens,
    totalTokens
  }
}

export function getEmptyTokenUsage(): TokenUsage {
  return emptyTokenUsage()
}
