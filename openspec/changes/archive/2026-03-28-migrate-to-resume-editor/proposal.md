# Change: Migrate to resumeEditor Tool

## Why
The `resumeEditorTool` now provides comprehensive block operations (rewrite, delete, add, reorderBlocks, reorderSections). We should consolidate to use only `resumeEditor` tool instead of maintaining both `rewriteBlock` and `resumeEditor`.

## What Changes
- Replace `rewriteBlock` with `resumeEditor` in all consuming code:
  - `app/api/chat/resume/route.ts` - API route tool registration
  - `lib/agent/chat-history.ts` - Tool result handling (tool-rewriteBlock → tool-resumeEditor)
  - `components/agent/chat-interface.tsx` - Tool call handling (rewriteBlock → resumeEditor)
  - `server/ai/prompts/resume-chat.prompt.ts` - Update prompt to use resumeEditor
- Remove `rewriteBlockTool` from `lib/agent/tools.ts`
- Remove `rewriteBlock` tool export from `lib/agent/tools.ts`

## Impact
- Affected specs: `resume-chat`
- Affected code:
  - `app/api/chat/resume/route.ts`
  - `lib/agent/chat-history.ts`
  - `components/agent/chat-interface.tsx`
  - `server/ai/prompts/resume-chat.prompt.ts`
  - `lib/agent/tools.ts`
