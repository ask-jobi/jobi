/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getSessionTokenUsage,
  updateSessionTokenUsage
} from "@/lib/agent/chat-history"
import * as supabaseModule from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server")

describe("chat-history token usage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should aggregate session token usage from non-truncated messages", async () => {
    const update = vi.fn().mockResolvedValue({ error: null })
    const sessionUpdateChain = {
      eq: vi.fn().mockResolvedValue({ error: null })
    }
    const messagesSelectChain = {
      eq: vi.fn().mockReturnThis()
    }

    messagesSelectChain.eq = vi
      .fn()
      .mockReturnValueOnce(messagesSelectChain)
      .mockReturnValueOnce({
        data: [
          {
            token_count: 10,
            input_tokens: 6,
            output_tokens: 3,
            cached_tokens: 1,
            reasoning_tokens: 0
          },
          {
            token_count: 15,
            input_tokens: 8,
            output_tokens: 4,
            cached_tokens: 2,
            reasoning_tokens: 1
          }
        ],
        error: null
      })

    const mockSupabaseClient = {
      from: vi.fn((table: string) => {
        if (table === "resume_chat_messages") {
          return {
            select: vi.fn().mockReturnValue(messagesSelectChain)
          }
        }

        if (table === "resume_chat_sessions") {
          return {
            update: vi.fn().mockImplementation((payload) => {
              update(payload)
              return sessionUpdateChain
            })
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      })
    } as any

    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    await updateSessionTokenUsage("session-1")

    expect(update).toHaveBeenCalledWith({
      total_tokens: 25,
      total_input_tokens: 14,
      total_output_tokens: 7,
      total_cached_tokens: 3,
      total_reasoning_tokens: 1
    })
    expect(sessionUpdateChain.eq).toHaveBeenCalledWith("id", "session-1")
  })

  it("should return session totals and message token details", async () => {
    const sessionSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "session-1",
            total_tokens: 25,
            total_input_tokens: 14,
            total_output_tokens: 7,
            total_cached_tokens: 3,
            total_reasoning_tokens: 1
          },
          error: null
        })
      })
    }

    const messagesOrderChain = {
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "msg-1",
            role: "user",
            created_at: "2024-01-01T00:00:00Z",
            token_count: 10,
            input_tokens: 6,
            output_tokens: 3,
            cached_tokens: 1,
            reasoning_tokens: 0
          }
        ],
        error: null
      })
    }

    const messagesSelectChain = {
      eq: vi.fn().mockReturnThis(),
      order: messagesOrderChain.order
    }

    messagesSelectChain.eq = vi
      .fn()
      .mockReturnValueOnce(messagesSelectChain)
      .mockReturnValueOnce(messagesSelectChain)

    const mockSupabaseClient = {
      from: vi.fn((table: string) => {
        if (table === "resume_chat_sessions") {
          return {
            select: vi.fn().mockReturnValue(sessionSelectChain)
          }
        }

        if (table === "resume_chat_messages") {
          return {
            select: vi.fn().mockReturnValue(messagesSelectChain)
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      })
    } as any

    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    const result = await getSessionTokenUsage("session-1")

    expect(result).toEqual({
      sessionId: "session-1",
      totalTokens: 25,
      totalInputTokens: 14,
      totalOutputTokens: 7,
      totalCachedTokens: 3,
      totalReasoningTokens: 1,
      messages: [
        {
          id: "msg-1",
          role: "user",
          createdAt: "2024-01-01T00:00:00Z",
          tokenCount: 10,
          inputTokens: 6,
          outputTokens: 3,
          cachedTokens: 1,
          reasoningTokens: 0
        }
      ]
    })
  })
})
