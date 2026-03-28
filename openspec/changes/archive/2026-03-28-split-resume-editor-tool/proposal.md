# Change: split-resume-editor-tool

## Why

当前 `resumeEditor` 工具支持 5 种操作 (rewrite, delete, add, reorderBlocks, reorderSections)，功能过于复杂。拆分为两个独立工具可以：
- 工具职责更清晰
- AI 模型调用更精确
- 便于独立演进

## What Changes

- 新增 `resumeEditorModify` 工具，处理 `rewrite`, `delete`, `add` 操作
- 新增 `resumeEditorReorder` 工具，处理 `reorderBlocks`, `reorderSections` 操作
- **BREAKING**: 移除原 `resumeEditor` 工具

## Impact

- 类型定义: `types/chat.ts`
- 工具定义: `lib/agent/tools.ts`
- 工具执行: `components/agent/chat/resume-editor.ts`
- UI 组件: `components/agent/chat/resume-editor-tool.tsx`
- 消费方: `chat-interface.tsx`, `truncate/route.ts`, `resume.ts`, `chat-history.ts`, `resume-action-output-card.tsx`
- Prompt: `server/ai/prompts/resume-chat.prompt.ts`
