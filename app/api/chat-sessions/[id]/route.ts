import { NextRequest, NextResponse } from "next/server"
import {
  getSessionSummary,
  updateSessionTitle,
  updateSessionStatus,
  permanentlyDeleteSession
} from "@/server/ai/chat/history"
import { z } from "zod"
import {
  requireVerifiedUserIdentity,
  verifyOwnership,
  handleApiError
} from "@/server/auth-helper"

const updateSessionSchema = z.object({
  status: z.enum(["active", "completed", "archived"]).optional(),
  title: z
    .string()
    .max(200, "Title must be less than 200 characters")
    .optional()
})

export const dynamic = "force-dynamic"

/**
 * GET /api/chat-sessions/[id]
 * 获取单个 session 的详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const user = await requireVerifiedUserIdentity()
    await verifyOwnership(sessionId, user.id)

    const session = await getSessionSummary(sessionId)

    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/chat-sessions/[id]
 * 更新 session（状态或标题）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()

    const validationResult = updateSessionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const user = await requireVerifiedUserIdentity()
    await verifyOwnership(sessionId, user.id)

    if (validationResult.data.status) {
      await updateSessionStatus(sessionId, validationResult.data.status)
    }

    if (validationResult.data.title) {
      await updateSessionTitle(sessionId, validationResult.data.title)
    }

    const session = await getSessionSummary(sessionId)

    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/chat-sessions/[id]
 * 永久删除 session 及所有消息
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const user = await requireVerifiedUserIdentity()
    await verifyOwnership(sessionId, user.id)

    await permanentlyDeleteSession(sessionId)

    return NextResponse.json({
      success: true,
      message: "Chat session deleted successfully"
    })
  } catch (error) {
    return handleApiError(error)
  }
}
