import { NextRequest, NextResponse } from "next/server"
import { getSessionTokenUsage } from "@/lib/agent/chat-history"
import { buildChatTokenQuota, getActiveAccessPass } from "@/server/quota"
import {
  getAuthenticatedUser,
  verifyOwnership,
  handleApiError
} from "@/server/auth-helpers"

export const dynamic = "force-dynamic"

/**
 * GET /api/chat-sessions/[id]/token-usage
 * 获取单个 session 的 token 使用统计和消息明细
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const user = await getAuthenticatedUser()
    await verifyOwnership(sessionId, user.id)

    const tokenUsage = await getSessionTokenUsage(sessionId)
    const activeAccessPass = await getActiveAccessPass(user.id)

    return NextResponse.json({
      success: true,
      data: {
        ...tokenUsage,
        chatTokenLimit: buildChatTokenQuota(activeAccessPass).limit,
        usedChatTokens: buildChatTokenQuota(activeAccessPass).used
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
