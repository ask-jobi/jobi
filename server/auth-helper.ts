import "server-only"

import { cookies } from "next/headers"

import { getDatabase, type AppDatabase } from "@/lib/db/client"
import { verifyWorkspaceToken, workspaceCookie } from "@/lib/workspace/session"
import { verifySessionOwnership } from "@/server/ai/chat/history"

export type AuthenticatedUserIdentity = {
  id: string
}

async function getWorkspaceIdentity(): Promise<AuthenticatedUserIdentity | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(workspaceCookie.name)?.value
  const workspaceId = await verifyWorkspaceToken(token)

  return workspaceId ? { id: workspaceId } : null
}

export async function getOptionalVerifiedUserIdentity() {
  return getWorkspaceIdentity()
}

export async function getOptionalExistingUserIdentity() {
  return getWorkspaceIdentity()
}

export async function requireVerifiedUserIdentity(): Promise<AuthenticatedUserIdentity> {
  const user = await getWorkspaceIdentity()

  if (!user) {
    throw new ApiError("Unauthorized", 401)
  }

  return user
}

async function requireWorkspaceContext(): Promise<{
  db: AppDatabase
  user: AuthenticatedUserIdentity
}> {
  const user = await requireVerifiedUserIdentity()
  return { db: await getDatabase(), user }
}

export async function requireVerifiedAuthContext() {
  return requireWorkspaceContext()
}

export async function requireExistingAuthContext() {
  return requireWorkspaceContext()
}

export async function verifyOwnership(sessionId: string, userId: string) {
  const isOwner = await verifySessionOwnership(sessionId, userId)
  if (!isOwner) {
    throw new ApiError("Forbidden: You do not own this session", 403)
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) {
      console.error("API error:", error)
    }

    return Response.json({ error: error.message }, { status: error.statusCode })
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message.includes("Forbidden")) {
      return Response.json({ error: error.message }, { status: 403 })
    }
    if (error.message.includes("not found")) {
      return Response.json({ error: error.message }, { status: 404 })
    }

    console.error("API error:", error)

    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }

  console.error("API error:", error)

  return Response.json({ error: "Internal server error" }, { status: 500 })
}
