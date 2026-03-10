import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  extractToolOriginalValues,
  getMessage,
  getMessagesAfter,
  restoreConversationSummaryAfterTruncate,
  truncateMessages
} from "@/lib/agent/chat-history"
import {
  getJobApplicationByResumeId,
  getResumeData,
  saveResumeChange
} from "@/server/resume"
import { logRollback } from "@/server/chat-events"
import { z } from "zod"
import {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import {
  getAuthenticatedUser,
  verifyOwnership,
  handleApiError
} from "@/server/auth-helpers"
import { ResumeData } from "@/types/resume"

const truncateSchema = z.object({
  messageId: z.uuid()
})

async function revertToolOutput(
  toolOutputs: (ResumeEditorModifyOutput | ResumeEditorReorderOutput)[],
  resumeData: ResumeData
): Promise<ResumeData> {
  const updatedResume = structuredClone(resumeData)

  for (const output of toolOutputs) {
    if (output.operation === "rewrite") {
      if (!output.field) continue

      const section = updatedResume[output.entity]
      if (section && "blocks" in section) {
        const block = section.blocks.find((b: any) => b.blockId === output.id)
        if (block && output.field in block) {
          // @ts-expect-error need fix
          block[output.field] = output.originalValue
        }
      }
    }

    if (output.operation === "delete") {
      const section = updatedResume[output.entity]
      if (section && "blocks" in section) {
        // @ts-expect-error need fix
        section.blocks.push(output.originalValue)
      }
    }

    if (output.operation === "add") {
      const section = updatedResume[output.entity]
      if (section && "blocks" in section) {
        const newBlock = (output as any).newBlock
        const blockIndex = section.blocks.findIndex(
          (b: any) => b.blockId === newBlock?.blockId
        )
        if (blockIndex !== -1) {
          section.blocks.splice(blockIndex, 1)
        }
      }
    }

    if (output.operation === "reorderBlocks") {
      const entity = output.entity
      if (entity) {
        const section = updatedResume[entity]
        if (section && "blocks" in section) {
          const currentBlocks = [...section.blocks]
          const originalValue = output.originalValue as string[]
          const orderedBlocks = originalValue
            .map((id: string) => {
              return currentBlocks.find((b: any) => b.blockId === id)
            })
            .filter(Boolean)
          // @ts-expect-error - reordering blocks
          section.blocks = orderedBlocks
        }
      }
    }

    if (output.operation === "reorderSections") {
      const originalValue = output.originalValue as string[]
      updatedResume.sectionOrder = originalValue as any
    }
  }

  return updatedResume
}

async function applyToolReversions(
  toolOutputs: (ResumeEditorModifyOutput | ResumeEditorReorderOutput)[],
  resumeId: string
) {
  const jobApp = await getJobApplicationByResumeId(resumeId)

  if (!jobApp || !jobApp.resumes.resume_json) {
    throw new Error("Resume not found")
  }

  const updatedResume = await revertToolOutput(
    toolOutputs,
    jobApp.resumes.resume_json
  )

  await saveResumeChange(resumeId, updatedResume)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
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

    await truncateMessages(messagesToTruncate)

    await restoreConversationSummaryAfterTruncate(
      targetMessage.session_id,
      targetMessage.created_at
    )

    const toolsToRevert: (
      | ResumeEditorModifyOutput
      | ResumeEditorReorderOutput
    )[] = []

    for (const msg of messagesToTruncate) {
      if (msg.has_tools) {
        const originalValues = extractToolOriginalValues(msg.parts)
        toolsToRevert.push(...originalValues)
      }
    }

    if (toolsToRevert.length > 0) {
      await applyToolReversions(toolsToRevert, session.resume_id)
    }

    await logRollback(targetMessage.session_id, messageId)

    const resume = await getResumeData(session.resume_id)

    return NextResponse.json({
      resume
    })
  } catch (error) {
    console.error("Truncate error:", error)
    return handleApiError(error)
  }
}
