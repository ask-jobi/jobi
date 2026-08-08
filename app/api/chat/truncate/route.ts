import { NextRequest, NextResponse } from "next/server"
import { getDatabase, type AppDatabase } from "@/lib/db/client"
import {
  extractAiResumeEditOutputs,
  getMessage,
  getMessagesAfter,
  getSessionSummary,
  restoreConversationSummaryAfterTruncate,
  truncateMessages
} from "@/server/ai/chat/history"
import { AiResumeEditError, revertAiResumeEdits } from "@/lib/resume/ai-edits"
import { getJobApplicationByResumeId } from "@/server/resume"
import { logRollback } from "@/server/chat-events"
import { commitResumeOperation } from "@/server/resume/commit"
import { z } from "zod"
import {
  requireVerifiedUserIdentity,
  verifyOwnership,
  handleApiError,
  ApiError
} from "@/server/auth-helper"
import type { AiResumeEditOutput } from "@/lib/resume/ai-edits"

const truncateSchema = z.object({
  messageId: z.uuid()
})

async function applyToolReversions(
  toolOutputs: AiResumeEditOutput[],
  resumeId: string,
  actorId: string,
  db: AppDatabase
) {
  try {
    const authoritativeState = await commitResumeOperation({
      db,
      actorId,
      resumeId,
      operation: ({ resume }) => ({
        nextResume: revertAiResumeEdits(resume, toolOutputs, {
          detectSemanticConflict: true
        }),
        metadata: undefined
      })
    })

    return {
      resume: authoritativeState.resume,
      currentRevision: authoritativeState.currentRevision
    }
  } catch (error) {
    if (
      error instanceof AiResumeEditError &&
      error.code === "semantic-conflict"
    ) {
      throw new ApiError(error.message, 409)
    }

    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUserIdentity()
    const db = await getDatabase()

    const body = await request.json()
    const parseResult = truncateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { messageId } = parseResult.data

    const message = await getMessage(messageId)

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    await verifyOwnership(message.session_id, user.id)

    const session = await getSessionSummary(message.session_id)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const targetMessage = message

    const messagesToTruncate = await getMessagesAfter(
      targetMessage.session_id,
      targetMessage.created_at
    )

    const toolsToRevert: AiResumeEditOutput[] = []

    for (const msg of messagesToTruncate) {
      if (msg.has_tools) {
        const originalValues = extractAiResumeEditOutputs(msg.parts)
        toolsToRevert.push(...originalValues)
      }
    }

    let authoritativeResume = null

    if (toolsToRevert.length > 0) {
      authoritativeResume = await applyToolReversions(
        toolsToRevert,
        session.resumeId,
        user.id,
        db
      )
    }

    await truncateMessages(messagesToTruncate)

    await restoreConversationSummaryAfterTruncate(
      targetMessage.session_id,
      targetMessage.created_at
    )

    await logRollback(targetMessage.session_id, messageId)

    if (authoritativeResume) {
      return NextResponse.json(authoritativeResume)
    }

    const currentJobApp = await getJobApplicationByResumeId(session.resumeId)

    return NextResponse.json({
      resume: currentJobApp.resumes.resume_json,
      currentRevision: currentJobApp.resumes.current_revision
    })
  } catch (error) {
    return handleApiError(error)
  }
}
