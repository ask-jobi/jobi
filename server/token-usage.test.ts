import { describe, expect, it } from "vitest"
import { parseTokenUsage } from "@/lib/agent/token-usage"

describe("parseTokenUsage", () => {
  it("should parse the standard LanguageModelUsage shape", () => {
    const usage = parseTokenUsage({
      inputTokens: 4243,
      inputTokenDetails: {
        noCacheTokens: 1,
        cacheReadTokens: 4242,
        cacheWriteTokens: 0
      },
      outputTokens: 270,
      outputTokenDetails: {
        textTokens: 270,
        reasoningTokens: 0
      },
      totalTokens: 4513,
      raw: {
        input_tokens: 1,
        output_tokens: 270,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 4242
      }
    })

    expect(usage).toEqual({
      inputTokens: 1,
      outputTokens: 270,
      cachedTokens: 4242,
      reasoningTokens: 0,
      totalTokens: 4513
    })
  })

  it("should return zeros for missing usage", () => {
    expect(parseTokenUsage(undefined)).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0
    })
  })

  it("should derive total tokens when totalTokens is unavailable", () => {
    const usage = parseTokenUsage({
      inputTokens: 1,
      inputTokenDetails: {
        noCacheTokens: 1,
        cacheReadTokens: 4242,
        cacheWriteTokens: 0
      },
      outputTokens: 270,
      outputTokenDetails: {
        textTokens: 270,
        reasoningTokens: 0
      },
      totalTokens: 4513
    })

    expect(usage).toEqual({
      inputTokens: 1,
      outputTokens: 270,
      cachedTokens: 4242,
      reasoningTokens: 0,
      totalTokens: 4513
    })
  })

  it("should use standard token details even without raw usage", () => {
    const usage = parseTokenUsage({
      inputTokens: 4243,
      inputTokenDetails: {
        noCacheTokens: 1,
        cacheReadTokens: 4240,
        cacheWriteTokens: 2
      },
      outputTokens: 270,
      outputTokenDetails: {
        textTokens: 265,
        reasoningTokens: 5
      },
      totalTokens: 4513
    })

    expect(usage).toEqual({
      inputTokens: 1,
      outputTokens: 270,
      cachedTokens: 4240,
      reasoningTokens: 5,
      totalTokens: 4513
    })
  })
})
