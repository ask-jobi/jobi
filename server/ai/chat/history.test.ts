/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getOrCreateCanonicalSessionSummary,
  getSessionSummary
} from "@/server/ai/chat/history"
import * as supabaseModule from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server")

describe("chat history canonical sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("resolves concurrent canonical session creation through an idempotent upsert", async () => {
    const sessionRow = {
      id: "session-1",
      user_id: "user-1",
      resume_id: "resume-1",
      status: "active",
      title: "New Chat",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      conversation_summary: null,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cached_tokens: 0,
      total_reasoning_tokens: 0
    }

    const upsert = vi.fn().mockResolvedValue({ error: null })
    const sessionsRange = vi.fn().mockResolvedValue({
      data: [sessionRow],
      error: null
    })
    const sessionsQuery = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue({
        range: sessionsRange
      })
    }
    const messagesCountEq = vi.fn().mockResolvedValue({
      count: 0,
      error: null
    })
    const messagesCountQuery = {
      eq: vi
        .fn()
        .mockReturnValueOnce({ eq: messagesCountEq })
        .mockReturnValueOnce({ eq: messagesCountEq })
    }

    const mockSupabaseClient = {
      from: vi.fn((table: string) => {
        if (table === "resume_chat_sessions") {
          return {
            upsert,
            select: vi.fn().mockReturnValue(sessionsQuery)
          }
        }

        if (table === "resume_chat_messages") {
          return {
            select: vi.fn().mockReturnValue(messagesCountQuery)
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      })
    } as any

    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    const [first, second] = await Promise.all([
      getOrCreateCanonicalSessionSummary({
        userId: "user-1",
        resumeId: "resume-1"
      }),
      getOrCreateCanonicalSessionSummary({
        userId: "user-1",
        resumeId: "resume-1"
      })
    ])

    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        resume_id: "resume-1",
        title: "New Chat"
      },
      {
        onConflict: "user_id,resume_id",
        ignoreDuplicates: true
      }
    )
    expect(first).toEqual(second)
    expect(first).toMatchObject({
      id: "session-1",
      title: "New Chat",
      resumeId: "resume-1",
      status: "active",
      messageCount: 0
    })
    expect(messagesCountEq).toHaveBeenCalledWith("truncated", false)
  })

  it("returns archived canonical sessions instead of creating replacements", async () => {
    const sessionRow = {
      id: "session-archived",
      user_id: "user-1",
      resume_id: "resume-1",
      status: "archived",
      title: "Earlier chat",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      conversation_summary: null,
      total_input_tokens: 4,
      total_output_tokens: 3,
      total_cached_tokens: 0,
      total_reasoning_tokens: 1
    }

    const upsert = vi.fn().mockResolvedValue({ error: null })
    const messagesCountEq = vi.fn().mockResolvedValue({
      count: 2,
      error: null
    })
    const sessionsQuery = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: [sessionRow],
          error: null
        })
      })
    }

    const mockSupabaseClient = {
      from: vi.fn((table: string) => {
        if (table === "resume_chat_sessions") {
          return {
            upsert,
            select: vi.fn().mockReturnValue(sessionsQuery)
          }
        }

        if (table === "resume_chat_messages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: messagesCountEq
              })
            })
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      })
    } as any

    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    const session = await getOrCreateCanonicalSessionSummary({
      userId: "user-1",
      resumeId: "resume-1"
    })

    expect(session).toMatchObject({
      id: "session-archived",
      title: "Earlier chat",
      status: "archived",
      messageCount: 2
    })
    expect(messagesCountEq).toHaveBeenCalledWith("truncated", false)
  })

  it("counts only non-truncated messages in a session summary", async () => {
    const messagesCountEq = vi.fn().mockResolvedValue({
      count: 3,
      error: null
    })

    const mockSupabaseClient = {
      from: vi.fn((table: string) => {
        if (table === "resume_chat_sessions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "session-1",
                    user_id: "user-1",
                    resume_id: "resume-1",
                    status: "active",
                    title: "New Chat",
                    created_at: "2026-01-01T00:00:00Z",
                    updated_at: "2026-01-01T00:00:00Z",
                    conversation_summary: null,
                    total_input_tokens: 4,
                    total_output_tokens: 3,
                    total_cached_tokens: 0,
                    total_reasoning_tokens: 1
                  },
                  error: null
                })
              })
            })
          }
        }

        if (table === "resume_chat_messages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: messagesCountEq
              })
            })
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      })
    } as any

    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)

    const session = await getSessionSummary("session-1")

    expect(session).toMatchObject({
      id: "session-1",
      messageCount: 3
    })
    expect(messagesCountEq).toHaveBeenCalledWith("truncated", false)
  })
})
