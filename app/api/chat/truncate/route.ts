import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  extractAiResumeEditOutputs,
  getMessage,
  getMessagesAfter,
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
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const authoritativeState = await commitResumeOperation({
      supabase,
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
    const supabase = await createClient()

    const body = await request.json()
    const parseResult = truncateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { messageId } = parseResult.data

    const { data: message, error: messageError } = await supabase
      .from("resume_chat_messages")
      .select("session_id")
      .eq("id", messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    await verifyOwnership(message.session_id, user.id)

    const { data: session, error: sessionError } = await supabase
      .from("resume_chat_sessions")
      .select("resume_id")
      .eq("id", message.session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const targetMessage = await getMessage(messageId)

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
        session.resume_id,
        user.id,
        supabase
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

    const currentJobApp = await getJobApplicationByResumeId(session.resume_id)

    return NextResponse.json({
      resume: currentJobApp.resumes.resume_json,
      currentRevision: currentJobApp.resumes.current_revision
    })
  } catch (error) {
    return handleApiError(error)
  }
}
