import "server-only"
import { tool } from "ai"
import {
  resumeEditorModifyInputSchema,
  resumeEditorReorderInputSchema
} from "@/types/chat"

export const tools = {
  resumeEditorModify: tool({
    description:
      "Tool to modify resume blocks: rewrite fields, delete blocks, or add new blocks. " +
      "Supports: " +
      "1) Rewrite block fields - modify any field in a block; " +
      "2) Delete a block - remove a block from a section; " +
      "3) Add a new block - insert a new block into a section. " +
      "The output language MUST remain consistent with the original resume language.",
    inputSchema: resumeEditorModifyInputSchema
  }),
  resumeEditorReorder: tool({
    description:
      "Tool to reorder resume blocks and sections. " +
      "Supports: " +
      "1) Reorder blocks - change order of blocks within a section; " +
      "2) Reorder sections - change order of sections (personalInfo is always first). " +
      "The output language MUST remain consistent with the original resume language.",
    inputSchema: resumeEditorReorderInputSchema
  })
}
