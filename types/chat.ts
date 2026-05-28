import { z } from "zod"
import { InferUITools, UIDataTypes, UIMessage } from "ai"
import {
  resumeEditorModifyOutputSchema,
  resumeEditorReorderInputSchema,
  resumeEditorReorderOutputSchema,
  tools
} from "@/lib/agent/tools"
import type { ResumeSectionKey, SortableSectionKey } from "@/types/resume"

export interface ChatTokenUsage {
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
  totalTokens: number
}

export interface ChatDataParts {
  sessionTitle: {
    sessionId: string
    title: string
  }
}

export interface ChatMessageMetadata {
  tokenUsage?: ChatTokenUsage
}

export const chatDataPartSchemas = {
  sessionTitle: z.object({
    sessionId: z.string(),
    title: z.string()
  })
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
