import "server-only"

import { createClient } from "@/lib/supabase/server"
import { verifySessionOwnership } from "@/lib/agent/chat-history"
import type { Database } from "@/types/supabase"
import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js"

export type AuthContext = {
  supabase: SupabaseClient<Database>
  user: User | null
  error: AuthError | null
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  return {
    supabase,
    user,
    error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { user, error } = await getAuthContext()
  return error ? null : user
}

export async function requireAuthContext(): Promise<{
  supabase: SupabaseClient<Database>
  user: User
}> {
  const { supabase, user, error } = await getAuthContext()

  if (error || !user) {
    throw new ApiError("Unauthorized", 401)
  }

  return { supabase, user }
}

export async function getAuthenticatedUser() {
  const { user } = await requireAuthContext()
  return user
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
  console.error("API error:", error)

  if (error instanceof ApiError) {
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
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }

  return Response.json({ error: "Internal server error" }, { status: 500 })
}
