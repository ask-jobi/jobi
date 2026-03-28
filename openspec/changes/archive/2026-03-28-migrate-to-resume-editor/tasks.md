## 1. Implementation

- [x] 1.1 Update `app/api/chat/resume/route.ts` - replace rewriteBlock with resumeEditor
- [x] 1.2 Update `lib/agent/chat-history.ts` - handle tool-resumeEditor instead of tool-rewriteBlock
- [x] 1.3 Update `components/agent/chat-interface.tsx` - handle resumeEditor tool calls
- [x] 1.4 Update `server/ai/prompts/resume-chat.prompt.ts` - use resumeEditor in prompt
- [x] 1.5 Remove rewriteBlockTool from `lib/agent/tools.ts`

## 2. Testing

- [x] 2.1 Test chat functionality works with new tool
- [x] 2.2 Test block rewrite works correctly
- [x] 2.3 Run existing tests
