import { z } from "zod"
import { InferUITools, UIDataTypes, UIMessage } from "ai"
import { tools } from "@/lib/agent/tools"
import {
  resumeEditorModifyOutputSchema,
  resumeEditorReorderInputSchema,
  resumeEditorReorderOutputSchema
} from "@/lib/agent/schema"
import type {
  ResumeData,
  ResumeSectionKey,
  SortableSectionKey
} from "@/types/resume"

export const authoritativeResumePatchSchema = z.object({
  snapshotId: z.string(),
  messageId: z.string(),
  baseVersion: z.number(),
  nextVersion: z.number(),
  body: z.object({
    output: z.union([
      resumeEditorModifyOutputSchema,
      resumeEditorReorderOutputSchema
    ]),
    resume: z.custom<ResumeData>(
      (value) => typeof value === "object" && value !== null
    )
  })
})

export type AuthoritativeResumePatch = z.infer<
  typeof authoritativeResumePatchSchema
>

export interface ChatDataParts {
  sessionTitle: {
    sessionId: string
    title: string
  }
  "resume-patch": AuthoritativeResumePatch
}

export type ChatMessageMetadata = Record<string, never>

export const chatDataPartSchemas = {
  sessionTitle: z.object({
    sessionId: z.string(),
    title: z.string()
  }),
  "resume-patch": authoritativeResumePatchSchema
}

export type ResumeEditorModifyOutput = z.infer<
  typeof resumeEditorModifyOutputSchema
>
export type ResumeEditorModifyInput =
  | {
      operation: "rewrite"
      entity: ResumeSectionKey
      id: string
      field: string
      value: string
    }
  | {
      operation: "delete"
      entity: SortableSectionKey
      id: string
    }
  | {
      operation: "add"
      entity: SortableSectionKey
    }
export type ResumeEditorReorderOutput = z.infer<
  typeof resumeEditorReorderOutputSchema
>
export type ResumeEditorReorderInput = z.infer<
  typeof resumeEditorReorderInputSchema
>

export type ChatUIMessage = UIMessage<
  ChatMessageMetadata,
  ChatDataParts & UIDataTypes,
  InferUITools<typeof tools>
>

export type MessagePart = Pick<ChatUIMessage, "parts">["parts"]
