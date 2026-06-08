import { NextRequest, NextResponse } from "next/server"
import { loadHistory } from "@/server/ai/chat/history"
import {
  requireVerifiedUserIdentity,
  verifyOwnership,
  handleApiError
} from "@/server/auth-helper"

export const dynamic = "force-dynamic"
const DEFAULT_MESSAGES_LIMIT = 100
const MAX_MESSAGES_LIMIT = 200

function parseMessagesLimit(request: NextRequest): number {
  const rawLimit = request.nextUrl.searchParams.get("limit")
  if (!rawLimit) {
    return DEFAULT_MESSAGES_LIMIT
  }

  const parsedLimit = Number.parseInt(rawLimit, 10)
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_MESSAGES_LIMIT
  }

  return Math.min(parsedLimit, MAX_MESSAGES_LIMIT)
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
    const user = await requireVerifiedUserIdentity()
    await verifyOwnership(sessionId, user.id)

    const messages = await loadHistory(sessionId, {
      limit: parseMessagesLimit(request)
    })

    return NextResponse.json(messages)
  } catch (error) {
    return handleApiError(error)
  }
}
