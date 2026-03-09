import { z } from "zod"
import { InferUITools, UIDataTypes, UIMessage } from "ai"
import {
  resumeEditorModifyInputSchema,
  resumeEditorModifyOutputSchema,
  resumeEditorReorderInputSchema,
  resumeEditorReorderOutputSchema,
  tools
} from "@/lib/agent/tools"

export type ResumeEditorModifyOutput = z.infer<
  typeof resumeEditorModifyOutputSchema
>
export type ResumeEditorModifyInput = z.infer<
  typeof resumeEditorModifyInputSchema
>
export type ResumeEditorReorderOutput = z.infer<
  typeof resumeEditorReorderOutputSchema
>
export type ResumeEditorReorderInput = z.infer<
  typeof resumeEditorReorderInputSchema
>

export type ChatUIMessage = UIMessage<
  unknown,
  UIDataTypes,
  InferUITools<typeof tools>
>

export type MessagePart = Pick<ChatUIMessage, "parts">["parts"]
