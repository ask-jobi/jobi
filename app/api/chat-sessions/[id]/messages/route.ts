import { NextRequest, NextResponse } from "next/server"
import { loadHistory } from "@/server/ai/chat/history"
import {
  requireVerifiedUserIdentity,
  verifyOwnership,
  handleApiError
} from "@/server/auth-helper"

export const dynamic = "force-dynamic"

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
    const user = await requireVerifiedUserIdentity()
    await verifyOwnership(sessionId, user.id)

    const messages = await loadHistory(sessionId)

    return NextResponse.json(messages)
  } catch (error) {
    return handleApiError(error)
  }
}
