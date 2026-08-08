/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE, GET, PATCH } from "./route"
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
const session = {
  id: "session-1",
  title: "Test Chat",
  resumeId: "resume-1",
  status: "active" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  messageCount: 2
}

describe("/api/chat-sessions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.requireVerifiedUserIdentity).mockResolvedValue({
      id: "workspace-1"
    })
    vi.mocked(auth.verifyOwnership).mockResolvedValue()
    vi.mocked(history.getSessionSummary).mockResolvedValue(session)
  })

  it("returns a session owned by the workspace", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/chat-sessions/session-1"),
      { params }
    )
    const body = (await response.json()) as {
      success: boolean
      data: typeof session
    }

    expect(response.status).toBe(200)
    expect(body.data.id).toBe("session-1")
    expect(auth.verifyOwnership).toHaveBeenCalledWith(
      "session-1",
      "workspace-1"
    )
  })

  it("returns the ownership error", async () => {
    vi.mocked(auth.verifyOwnership).mockRejectedValue(
      new auth.ApiError("Forbidden", 403)
    )

    const response = await GET(
      new NextRequest("http://localhost/api/chat-sessions/session-1"),
      { params }
    )

    expect(response.status).toBe(403)
  })

  it("updates title and status", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost/api/chat-sessions/session-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated", status: "completed" })
      }),
      { params }
    )

    expect(response.status).toBe(200)
    expect(history.updateSessionTitle).toHaveBeenCalledWith(
      "session-1",
      "Updated"
    )
    expect(history.updateSessionStatus).toHaveBeenCalledWith(
      "session-1",
      "completed"
    )
  })

  it("deletes the owned session", async () => {
    const response = await DELETE(
      new NextRequest("http://localhost/api/chat-sessions/session-1", {
        method: "DELETE"
      }),
      { params }
    )

    expect(response.status).toBe(200)
    expect(history.permanentlyDeleteSession).toHaveBeenCalledWith("session-1")
  })
})
