/**
 * @vitest-environment node
 */
import { GET, POST } from "./route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as chatHistoryModule from "@/server/ai/chat/history"
import * as authHelpersModule from "@/server/auth-helper"

vi.mock("@/server/ai/chat/history")
vi.mock("@/server/auth-helper", () => ({
  requireVerifiedUserIdentity: vi.fn(),
  handleApiError: vi.fn((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  })
}))

describe("GET /api/chat-sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authHelpersModule.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return null when resumeId is not provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat-sessions")
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toBeNull()
    expect(
      chatHistoryModule.getOrCreateCanonicalSessionSummary
    ).not.toHaveBeenCalled()
  })

  it("should resolve the canonical session for the resume", async () => {
    vi.mocked(
      chatHistoryModule.getOrCreateCanonicalSessionSummary
    ).mockResolvedValue({
      id: "session-1",
      title: "Tailor for PM role",
      resumeId: "resume-123",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 5
    })

    const request = new NextRequest(
      "http://localhost:3000/api/chat-sessions?resumeId=resume-123"
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(
      chatHistoryModule.getOrCreateCanonicalSessionSummary
    ).toHaveBeenCalledWith({
      userId: "user-1",
      resumeId: "resume-123"
    })
  })
})

describe("POST /api/chat-sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authHelpersModule.requireVerifiedUserIdentity).mockResolvedValue({
      id: "user-1"
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (body: { resumeId: string }): NextRequest => {
    return new NextRequest("http://localhost:3000/api/chat-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  }

  it("should return 400 when resumeId is invalid", async () => {
    const request = createMockRequest({
      resumeId: "invalid-uuid"
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = (await response.json()) as any
    expect(data.error).toBe("Invalid request parameters")
  })

  it("should resolve the canonical session idempotently", async () => {
    vi.mocked(
      chatHistoryModule.getOrCreateCanonicalSessionSummary
    ).mockResolvedValue({
      id: "session-1",
      title: "New Chat",
      resumeId: "550e8400-e29b-41d4-a716-446655440000",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 0
    })

    const request = createMockRequest({
      resumeId: "550e8400-e29b-41d4-a716-446655440000"
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(
      chatHistoryModule.getOrCreateCanonicalSessionSummary
    ).toHaveBeenCalledWith({
      userId: "user-1",
      resumeId: "550e8400-e29b-41d4-a716-446655440000"
    })
  })
})
