import { describe, expect, it } from "vitest"
import { parseTokenUsage } from "@/lib/agent/token-usage"

describe("parseTokenUsage", () => {
  it("should parse the current usage object without double counting cached tokens", () => {
    const usage = parseTokenUsage({
      inputTokens: 4243,
      outputTokens: 270,
      totalTokens: 4513,
      cachedInputTokens: 4242,
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
      cacheCreationTokens: 0,
      cacheReadTokens: 4242,
      reasoningTokens: 0,
      totalTokens: 4513
    })
  })

  it("should return zeros for missing usage", () => {
    expect(parseTokenUsage(undefined)).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0
    })
  })
})
