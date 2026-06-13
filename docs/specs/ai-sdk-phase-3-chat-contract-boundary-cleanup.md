# AI SDK Phase 3: Chat Contract Boundary Cleanup

**归档日期:** 2026-06-01
**来源计划:** docs/plans/archive/2026-05-23-ai-sdk-phase-3-chat-contract-boundary-cleanup.md

## 实现了什么

将 AI SDK 相关代码的 contract 与模块边界整理到可长期维护的形态。共享 schema 收口到 `lib/agent/schema.ts`，`server-only` agent/chat 模块迁到 `server/ai/chat/*`，移除旧边界残留（`repairToolCall`、前端 tool executor 重导出）。

## 关键文件

| 文件 | 职责 |
|---|---|
| `lib/agent/schema.ts` | 共享 zod schemas：entry schemas、section enums、tool input/output schemas、input examples |
| `lib/agent/tools.ts` | 共享 tool 定义（`tool()` 包装），重新导出 schema.ts 全部内容 |
| `server/ai/model.ts` | 模型实例化（从 `lib/agent/model.ts` 迁入） |
| `server/ai/chat/history.ts` | Chat session / message CRUD（从 `lib/agent/chat-history.ts` 迁入） |
| `server/ai/chat/session-title-generator.ts` | 标题生成（从 `lib/agent/chat-session-title-generator.ts` 迁入） |
| `server/ai/chat/conversation-summary.ts` | 对话摘要（从 `lib/agent/conversation-summary.ts` 迁入） |
| `server/ai/chat/tools/registry.ts` | 服务端 tool registry with `execute`（从 `server/ai/resume-chat-tools.ts` 迁入） |
| `server/ai/chat/tools/registry.test.ts` | 编排逻辑测试 |
| `types/chat.ts` | 公开类型定义，从 `lib/agent/schema` 导入 schemas |
| `components/agent/chat/resume-editor.ts` | 已清理无用的前端 tool executor 重导出 |
| `components/agent/chat/index.ts` | Barrel 导出，已移除 tool executor 条目 |

## 关键行为

- **Schema 单一来源**: `lib/agent/schema.ts` 包含所有 entry schemas、section enums、tool I/O schemas、input examples
- **工具定义分层**: `lib/agent/tools.ts`（共享定义，无 execute）+ `server/ai/chat/tools/registry.ts`（服务端定义，含 execute）
- **模块归属**: 所有 `server-only` 模块迁入 `server/ai/` 命名空间
- **继承关系**: `server/ai/chat/*` → 继承自 `server/ai/model.ts`，不跨层引用
- **`repairToolCall` 移除**: 从 `app/api/chat/resume/route.ts` 和测试中移除

## 数据 / 接口约定

- 导入约定: `lib/agent/schema` (客户端 + 服务端), `lib/agent/tools` (type inference), `server/ai/chat/*` (仅服务端)
- `tools` 从 `lib/agent/tools`: 共享 tool 定义供 `UIMessage<..., InferUITools<typeof tools>>` 类型推断
- `createResumeChatServerTools` 从 `server/ai/chat/tools/registry`: 服务端 runtime registry

## 与计划的差异

无重大偏差。所有 Phase 3A/3B/3C 任务均按计划完成。`applyToolOutputToResume` 保留在 `lib/resume/mutations.ts`，因为被 `server/ai/chat/tools/registry.ts` 服务端调用。

## 未完成 / 后续

- Phase 4: Provider / parser 一致性清理
