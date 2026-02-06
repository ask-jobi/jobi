import { NextRequest, NextResponse } from "next/server"
import { loadHistory, verifySessionOwnership } from "@/lib/agent/chat-history"

export const dynamic = "force-dynamic"

/**
 * Helper: 获取并验证当前用户
 */
async function getAuthenticatedUser() {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  return user
}

/**
 * Helper: 验证用户拥有该 session
 */
async function verifyOwnership(sessionId: string, userId: string) {
  const isOwner = await verifySessionOwnership(sessionId, userId)
  if (!isOwner) {
    throw new Error("Forbidden: You do not own this session")
  }
}

/**
 * GET /api/chat-sessions/[id]/messages
 * 获取单个 session 的聊天消息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const user = await getAuthenticatedUser()
    await verifyOwnership(sessionId, user.id)

    const messages = await loadHistory(sessionId)

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("Get chat messages failed:", error)

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error.message || "Failed to get chat messages" },
      { status: 500 }
    )
  }
}
