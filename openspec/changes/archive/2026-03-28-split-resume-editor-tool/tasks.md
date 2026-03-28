# Tasks: split-resume-editor-tool

## 1. 拆分类型定义

- [x] 1.1 在 `types/chat.ts` 中创建 `resumeEditorModifyInputSchema`（包含 rewrite, delete, add 操作）
- [x] 1.2 在 `types/chat.ts` 中创建 `resumeEditorModifyOutputSchema`
- [x] 1.3 在 `types/chat.ts` 中创建 `resumeEditorReorderInputSchema`（包含 reorderBlocks, reorderSections 操作）
- [x] 1.4 在 `types/chat.ts` 中创建 `resumeEditorReorderOutputSchema`
- [x] 1.5 导出新的类型别名

## 2. 拆分工具定义

- [x] 2.1 在 `lib/agent/tools.ts` 中创建 `resumeEditorModify` 工具
- [x] 2.2 在 `lib/agent/tools.ts` 中创建 `resumeEditorReorder` 工具
- [x] 2.3 移除原 `resumeEditor` 工具

## 3. 拆分工具执行逻辑

- [x] 3.1 在 `components/agent/chat/resume-editor.ts` 中创建 `executeResumeEditorModifyTool` 函数
- [x] 3.2 在 `components/agent/chat/resume-editor.ts` 中创建 `executeResumeEditorReorderTool` 函数
- [x] 3.3 移除原 `executeResumeEditorTool` 函数

## 4. 更新 UI 组件

- [x] 4.1 在 `components/agent/chat/resume-editor-tool.tsx` 中添加对新工具的支持
- [x] 4.2 在 `components/agent/chat/index.ts` 中导出新函数

## 5. 更新消费方

- [x] 5.1 更新 `components/agent/chat-interface.tsx` 支持两个工具
- [x] 5.2 更新 `app/api/chat/truncate/route.ts` 处理两种工具输出
- [x] 5.3 更新 `lib/store/resume.ts` 状态更新逻辑
- [x] 5.4 更新 `lib/agent/chat-history.ts` 历史记录处理

## 6. 更新 Prompt

- [x] 6.1 在 `server/ai/prompts/resume-chat.prompt.ts` 中更新工具使用说明

## 7. 测试

- [x] 7.1 验证原功能不受影响
- [x] 7.2 运行 lint 和 typecheck
