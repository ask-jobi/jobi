/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "./route"
import * as auth from "@/server/auth-helper"
import * as history from "@/server/ai/chat/history"

vi.mock("@/server/ai/chat/history")
vi.mock("@/server/auth-helper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth-helper")>()
  return {
    ...actual,
    requireVerifiedUserIdentity: vi.fn(),
    verifyOwnership: vi.fn()
  }
})

const params = Promise.resolve({ id: "session-1" })

describe("GET /api/chat-sessions/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.requireVerifiedUserIdentity).mockResolvedValue({
      id: "workspace-1"
    })
    vi.mocked(auth.verifyOwnership).mockResolvedValue()
    vi.mocked(history.loadHistory).mockResolvedValue([
      {
        id: "message-1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ])
  })

  it("loads messages after ownership verification", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/chat-sessions/session-1/messages?limit=25"
      ),
      { params }
    )
    const body = (await response.json()) as Array<{ id: string }>

    expect(response.status).toBe(200)
    expect(body[0].id).toBe("message-1")
    expect(history.loadHistory).toHaveBeenCalledWith("session-1", {
      limit: 25
    })
  })

  it("caps the requested limit", async () => {
    await GET(
      new NextRequest(
        "http://localhost/api/chat-sessions/session-1/messages?limit=500"
      ),
      { params }
    )

    expect(history.loadHistory).toHaveBeenCalledWith("session-1", {
      limit: 200
    })
  })

  it("returns an ownership error", async () => {
    vi.mocked(auth.verifyOwnership).mockRejectedValue(
      new auth.ApiError("Forbidden", 403)
    )

    const response = await GET(
      new NextRequest("http://localhost/api/chat-sessions/session-1/messages"),
      { params }
    )

    expect(response.status).toBe(403)
  })
})
