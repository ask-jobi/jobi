# AI SDK Phase 2: Chat Server Authority Cutover

**归档日期:** 2026-06-01
**来源计划:** docs/plans/archive/2026-05-23-ai-sdk-phase-2-chat-server-authority-cutover.md

## 实现了什么

将 chat 主链路的 resume tool 执行权从客户端切到服务端。服务端权威地执行 `resumeEditorModify` / `resumeEditorReorder` tool call，推进 snapshot 与 revision，并通过 `data-resume-patch` 流式数据将结果下发给前端。前端成为纯消费者，不再执行 optimistic mutation。

## 关键文件

| 文件 | 职责 |
|---|---|
| `app/api/chat/resume/route.ts` | API 入口，显式 `verifyOwnership` 校验 |
| `app/api/chat/resume/route.test.ts` | Ownership 校验及工具执行测试 |
| `server/ai/resume-chat-tools.ts` | 服务端 tool registry，串行化执行队列，patch 下发 |
| `server/ai/resume-chat-tools.test.ts` | 编排逻辑测试 |
| `lib/agent/resume-editor-execution.ts` | 服务端 tool 执行实现（modify / reorder） |
| `components/agent/chat-interface.tsx` | 前端消费者，`onData` 消费 patch，移除 `onToolCall` |
| `components/agent/chat/resume-editor-tool.tsx` | AI SDK 原生 tool result part 渲染 |
| `components/agent/chat/resume-editor-tool.test.tsx` | 组件测试 |

## 关键行为

- **请求到达**: `POST /api/chat/resume` 入口调用 `verifyOwnership(sessionId, user.id)`，非 owner 返回 403
- **Tool 执行**: 服务端 `enqueueToolExecution` 按顺序执行 tool call，每次执行后提交 snapshot（`commitResumeChange`），并记录 `tool_call` / `tool_result` / `tool_failed` 事件
- **Patch 下发**: 成功执行后通过 `writer.write({ type: "data-resume-patch", data: { snapshotId, messageId, baseVersion, nextVersion, body } })` 下发给前端
- **前端消费**: `onData` 中匹配 `data-resume-patch`，调用 `adjustPendingChatPatchCount(1)` 后 `replaceAuthoritativeResume()`，完成后 `adjustPendingChatPatchCount(-1)`
- **AI 锁**: `pendingPatchCount === 0` 时释放编辑锁
- **消息持久化**: user/assistant message 随会话过程同步写入 `resume_chat_messages`，含 `tool_result` / `tool-error` / `error` parts

## 数据 / 接口约定

- `data-resume-patch` 流式数据 part type，通过 `chatDataPartSchemas` 注册
- Patch payload: `{ snapshotId: string, messageId: string, baseVersion: number, nextVersion: number, body: { resume: ResumeData } }`
- Tool 执行采用串行队列 (`enqueueToolExecution`)，保证 revision 连续推进
- `strict: true` 对 `resumeEditorModify` / `resumeEditorReorder` 启用
- `DefaultChatTransport.prepareSendMessagesRequest` 只发送最新 message + session id
- `stopWhen: stepCountIs(5)` 保留

## 与计划的差异

无重大偏差。所有 Phase 2A/2B/2C 任务均按计划完成。

## 未完成 / 后续

- Phase 3: Chat contract 与模块边界收口（`docs/plans/archive/2026-05-23-ai-sdk-phase-3-chat-contract-boundary-cleanup.md`）
- Phase 4: Provider / parser 一致性清理（`docs/plans/archive/2026-05-23-ai-sdk-phase-4-provider-parser-consistency.md`）
- `rewrite-entry` tool 迁移未在本阶段处理
