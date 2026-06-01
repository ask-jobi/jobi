import "server-only"

import { createClient } from "@/lib/supabase/server"
import { verifySessionOwnership } from "@/server/ai/chat/history"
import type { Database } from "@/types/supabase"
import {
  isAuthRetryableFetchError,
  isAuthSessionMissingError,
  type AuthError,
  type SupabaseClient
} from "@supabase/supabase-js"

type AuthenticatedUserIdentity = {
  id: string
  email?: string
}

type VerifiedAuthContext = {
  supabase: SupabaseClient<Database>
  user: AuthenticatedUserIdentity | null
  error: AuthError | null
}

function isSupabaseAuthError(error: unknown): error is AuthError {
  return typeof error === "object" && error !== null && "__isAuthError" in error
}

function mapAuthErrorToApiError(
  error: AuthError | null | unknown
): ApiError | null {
  if (!error) {
    return null
  }

  if (isAuthRetryableFetchError(error)) {
    return new ApiError("Auth service temporarily unavailable", 503)
  }

  if (isAuthSessionMissingError(error)) {
    return new ApiError("Unauthorized", 401)
  }

  if (!isSupabaseAuthError(error)) {
    return new ApiError("Unauthorized", 401)
  }

  return new ApiError(error.message || "Unauthorized", 401)
}

function claimsToUserIdentity(
  claims: unknown
): AuthenticatedUserIdentity | null {
  const authClaims = claims as { sub?: unknown; email?: unknown } | null

  if (typeof authClaims?.sub !== "string") {
    return null
  }

  return {
    id: authClaims.sub,
    email: typeof authClaims.email === "string" ? authClaims.email : undefined
  }
}

function isMissingVerifiedIdentity(
  error: AuthError | null,
  user: AuthenticatedUserIdentity | null
): boolean {
  return isAuthSessionMissingError(error) || (!error && !user)
}

function requireVerifiedIdentityFromContext(context: VerifiedAuthContext): {
  supabase: SupabaseClient<Database>
  user: AuthenticatedUserIdentity
} {
  if (isMissingVerifiedIdentity(context.error, context.user)) {
    throw new ApiError("Unauthorized", 401)
  }

  const apiError = mapAuthErrorToApiError(context.error)

  if (apiError) {
    throw apiError
  }

  if (!context.user) {
    throw new ApiError("Unauthorized", 401)
  }

  return {
    supabase: context.supabase,
    user: context.user
  }
}

async function getVerifiedAuthContext(): Promise<VerifiedAuthContext> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  return {
    supabase,
    user: claimsToUserIdentity(data?.claims ?? null),
    error
  }
}

export async function getOptionalVerifiedUserIdentity(): Promise<AuthenticatedUserIdentity | null> {
  const context = await getVerifiedAuthContext()

  if (isMissingVerifiedIdentity(context.error, context.user)) {
    return null
  }

  const apiError = mapAuthErrorToApiError(context.error)

  if (apiError) {
    throw apiError
  }

  return context.user
}

export async function requireVerifiedAuthContext(): Promise<{
  supabase: SupabaseClient<Database>
  user: AuthenticatedUserIdentity
}> {
  const context = await getVerifiedAuthContext()
  return requireVerifiedIdentityFromContext(context)
}

export async function requireVerifiedUserIdentity(): Promise<AuthenticatedUserIdentity> {
  const { user } = await requireVerifiedAuthContext()
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
