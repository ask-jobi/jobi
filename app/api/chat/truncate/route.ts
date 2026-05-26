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
  getApplicationResumeData,
  saveApplicationResumeChange
} from "@/server/resume"
import { logRollback } from "@/server/chat-events"
import { z } from "zod"
import {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import {
  requireVerifiedUserIdentity,
  verifyOwnership,
  handleApiError
} from "@/server/auth-helper"
import type {
  ResumeData,
  ResumeSectionKey,
  SortableSectionKey
} from "@/types/resume"

const truncateSchema = z.object({
  messageId: z.uuid()
})

type EntryBasedResumeSection = NonNullable<ResumeData[SortableSectionKey]>

function hasEntries(
  section: ResumeData[ResumeSectionKey] | undefined
): section is EntryBasedResumeSection {
  return Boolean(section && "entries" in section)
}

async function revertToolOutput(
  toolOutputs: (ResumeEditorModifyOutput | ResumeEditorReorderOutput)[],
  resumeData: ResumeData
): Promise<ResumeData> {
  const updatedResume = structuredClone(resumeData)

  for (const output of toolOutputs) {
    if (output.operation === "rewrite") {
      if (!output.field) continue

      const section = updatedResume[output.entity]
      if (hasEntries(section)) {
        const entry = section.entries.find((item) => item.entryId === output.id)
        const mutableEntry = entry as unknown as
          | ({ entryId: string } & Record<string, unknown>)
          | undefined

        if (mutableEntry && output.field in mutableEntry) {
          mutableEntry[output.field] = output.originalValue
        }
      }
    }

    if (output.operation === "delete") {
      const section = updatedResume[output.entity]
      if (hasEntries(section)) {
        ;(
          section.entries as unknown as Array<
            { entryId: string } & Record<string, unknown>
          >
        ).push(
          output.originalValue as unknown as {
            entryId: string
          } & Record<string, unknown>
        )
      }
    }

    if (output.operation === "add") {
      const section = updatedResume[output.entity]
      if (hasEntries(section)) {
        const newEntry = output.newEntry
        const entryIndex = section.entries.findIndex(
          (item) => item.entryId === newEntry?.entryId
        )
        if (entryIndex !== -1) {
          section.entries.splice(entryIndex, 1)
        }
      }
    }

    if (output.operation === "reorderEntries") {
      const entity = output.entity
      if (entity) {
        const section = updatedResume[entity]
        if (hasEntries(section)) {
          const currentEntries = [...section.entries]
          const originalValue = output.originalValue as string[]
          const orderedEntries = originalValue
            .map((id) => {
              return currentEntries.find((item) => item.entryId === id)
            })
            .filter((entry): entry is (typeof section.entries)[number] =>
              Boolean(entry)
            )
          section.entries = orderedEntries as typeof section.entries
        }
      }
    }

    if (output.operation === "reorderSections") {
      updatedResume.sectionOrder = output.originalValue as SortableSectionKey[]
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

  await saveApplicationResumeChange(resumeId, updatedResume)
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

    const resume = await getApplicationResumeData(session.resume_id)

    return NextResponse.json({
      resume
    })
  } catch (error) {
    return handleApiError(error)
  }
}
