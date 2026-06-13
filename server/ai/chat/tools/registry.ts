import "server-only"

import { tool, type UIMessageStreamWriter } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  resumeEditorModifyInputExamples,
  resumeEditorModifyInputSchema,
  resumeEditorModifyOutputSchema,
  resumeEditorModifyToolDescription,
  resumeEditorReorderInputExamples,
  resumeEditorReorderInputSchema,
  resumeEditorReorderOutputSchema,
  resumeEditorReorderToolDescription
} from "@/lib/agent/tools"
import {
  executeResumeEditorModifyTool,
  executeResumeEditorReorderTool
} from "@/lib/agent/resume-editor-execution"
import { applyAiResumeEdit } from "@/lib/resume/ai-edits"
import { logChatEvent } from "@/server/chat-events"
import { commitResumeOperation } from "@/server/resume/commit"
import type {
  ChatUIMessage,
  ResumeEditorModifyInput,
  ResumeEditorReorderInput
} from "@/types/chat"
import type { Database } from "@/types/supabase"
import type { ResumeData } from "@/types/resume"

type ResumeEditorToolOutput =
  | Awaited<ReturnType<typeof executeResumeEditorModifyTool>>
  | Awaited<ReturnType<typeof executeResumeEditorReorderTool>>

export function createResumeChatServerTools({
  supabase,
  userId,
  resumeId,
  sessionId,
  assistantMessageId,
  initialResume,
  initialRevision,
  writer
}: {
  supabase: SupabaseClient<Database>
  userId: string
  resumeId: string
  sessionId: string
  assistantMessageId: string
  initialResume: ResumeData
  initialRevision: number
  writer: UIMessageStreamWriter<ChatUIMessage>
}) {
  let currentResume = structuredClone(initialResume) as ResumeData
  let currentRevision = initialRevision
  let executionQueue: Promise<unknown> = Promise.resolve()

  const enqueueToolExecution = <T>(task: () => Promise<T>) => {
    const run = executionQueue.catch(() => undefined).then(task)
    executionQueue = run.catch(() => undefined)
    return run
  }

  const commitToolOperation = async ({
    toolName,
    toolCallId,
    input,
    createOutput
  }: {
    toolName: "resumeEditorModify" | "resumeEditorReorder"
    toolCallId: string
    input: unknown
    createOutput: (resume: ResumeData) => Promise<ResumeEditorToolOutput>
  }) => {
    const observedBaseVersion = currentRevision

    const toolCallEventId = await logChatEvent({
      sessionId,
      messageId: assistantMessageId,
      eventType: "tool_call",
      eventData: {
        toolName,
        toolCallId,
        input,
        baseVersion: observedBaseVersion
      }
    })

    const authoritativeState = await commitResumeOperation({
      supabase,
      actorId: userId,
      resumeId,
      eventId: toolCallEventId,
      operation: async ({ resume }) => {
        const output = await createOutput(resume)

        return {
          nextResume: applyAiResumeEdit(resume, output),
          metadata: output
        }
      }
    })
    const output = authoritativeState.metadata
    const baseVersion = authoritativeState.baseRevision

    currentResume = authoritativeState.resume
    currentRevision = authoritativeState.currentRevision

    const snapshotId = `${resumeId}:${authoritativeState.currentRevision}`

    await logChatEvent({
      sessionId,
      messageId: assistantMessageId,
      eventType: "tool_result",
      eventData: {
        toolName,
        toolCallId,
        output,
        snapshotId,
        baseVersion,
        nextVersion: authoritativeState.currentRevision
      }
    })

    writer.write({
      type: "data-resume-patch",
      id: toolCallId,
      transient: true,
      data: {
        snapshotId,
        messageId: assistantMessageId,
        baseVersion,
        nextVersion: authoritativeState.currentRevision,
        body: {
          output,
          resume: authoritativeState.resume
        }
      }
    })

    return output
  }

  const executeWithFailureEvent = async <T>({
    toolName,
    toolCallId,
    input,
    task
  }: {
    toolName: "resumeEditorModify" | "resumeEditorReorder"
    toolCallId: string
    input: unknown
    task: () => Promise<T>
  }) => {
    try {
      return await task()
    } catch (error) {
      await logChatEvent({
        sessionId,
        messageId: assistantMessageId,
        eventType: "tool_failed",
        eventData: {
          toolName,
          toolCallId,
          input,
          baseVersion: currentRevision,
          error: error instanceof Error ? error.message : String(error)
        }
      }).catch((logError) => {
        console.error("Failed to log tool_failed event:", logError)
      })

      throw error
    }
  }

  return {
    resumeEditorModify: tool({
      description: resumeEditorModifyToolDescription,
      inputSchema: resumeEditorModifyInputSchema,
      outputSchema: resumeEditorModifyOutputSchema,
      strict: true,
      inputExamples: resumeEditorModifyInputExamples,
      execute: async (input, { toolCallId }) =>
        enqueueToolExecution(() =>
          executeWithFailureEvent({
            toolName: "resumeEditorModify",
            toolCallId,
            input,
            task: async () => {
              return commitToolOperation({
                toolName: "resumeEditorModify",
                toolCallId,
                input,
                createOutput: (resume) =>
                  executeResumeEditorModifyTool(
                    input as ResumeEditorModifyInput,
                    resume
                  )
              })
            }
          })
        )
    }),
    resumeEditorReorder: tool({
      description: resumeEditorReorderToolDescription,
      inputSchema: resumeEditorReorderInputSchema,
      outputSchema: resumeEditorReorderOutputSchema,
      strict: true,
      inputExamples: resumeEditorReorderInputExamples,
      execute: async (input, { toolCallId }) =>
        enqueueToolExecution(() =>
          executeWithFailureEvent({
            toolName: "resumeEditorReorder",
            toolCallId,
            input,
            task: async () => {
              return commitToolOperation({
                toolName: "resumeEditorReorder",
                toolCallId,
                input,
                createOutput: (resume) =>
                  executeResumeEditorReorderTool(
                    input as ResumeEditorReorderInput,
                    resume
                  )
              })
            }
          })
        )
    })
  }
}
