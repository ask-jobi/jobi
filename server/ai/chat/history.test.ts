/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDatabase } from "@/lib/db/client"
import {
  extractAiResumeEditOutputs,
  loadHistory,
  saveMessage,
  verifySessionOwnership
} from "./history"

vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }))

describe("chat history D1 persistence", () => {
  beforeEach(() => vi.clearAllMocks())

  it("saves JSON message parts and maps the database row", async () => {
    const row = {
      id: "message-1",
      sessionId: "session-1",
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
      truncated: false,
      hasTools: false,
      createdAt: "2026-01-01T00:00:00.000Z"
    }
    const returning = vi.fn(async () => [row])
    vi.mocked(getDatabase).mockResolvedValue({
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ returning }))
      }))
    } as never)

    await expect(
      saveMessage({
        id: row.id,
        sessionId: row.sessionId,
        role: row.role,
        parts: row.parts
      })
    ).resolves.toEqual({
      id: row.id,
      session_id: row.sessionId,
      role: row.role,
      parts: row.parts,
      truncated: false,
      has_tools: false,
      created_at: row.createdAt
    })
  })

  it("loads active messages with pagination", async () => {
    const offset = vi.fn(async () => [
      {
        id: "message-1",
        sessionId: "session-1",
        role: "user",
        parts: [],
        truncated: false,
        hasTools: false,
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ])
    vi.mocked(getDatabase).mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({ offset }))
            }))
          }))
        }))
      }))
    } as never)

    const messages = await loadHistory("session-1", { limit: 10, offset: 5 })
    expect(messages[0].id).toBe("message-1")
    expect(offset).toHaveBeenCalledWith(5)
  })

  it("checks workspace ownership in the query result", async () => {
    const limit = vi.fn(async () => [{ id: "session-1" }])
    vi.mocked(getDatabase).mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit }))
        }))
      }))
    } as never)

    await expect(
      verifySessionOwnership("session-1", "workspace-1")
    ).resolves.toBe(true)
  })

  it("extracts completed resume edit tool outputs", () => {
    const output = { operation: "delete", sectionId: "education" } as never
    expect(
      extractAiResumeEditOutputs([
        {
          type: "tool-resumeEditorModify",
          state: "output-available",
          output
        } as never
      ])
    ).toEqual([output])
  })
})
