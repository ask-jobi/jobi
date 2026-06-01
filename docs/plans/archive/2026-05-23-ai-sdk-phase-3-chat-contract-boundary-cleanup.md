# AI SDK Phase 3：Chat Contract Boundary Cleanup

**Date:** 2026-05-23

> **已完成** — 完成日期：2026-06-01
>
> **实际落地要点：**
> - `lib/agent/schema.ts` 新建，提取所有 entry schema、section enum、tool input/output schemas
> - `lib/agent/tools.ts` 重新导出 schema.ts 全部内容，保留 tool 定义与描述
> - `types/chat.ts` 改为从 `@/lib/agent/schema` 导入 schemas
> - `lib/agent/model.ts` → `server/ai/model.ts`，所有消费者按新路径导入
> - `lib/agent/chat-history.ts` → `server/ai/chat/history.ts`
> - `lib/agent/chat-session-title-generator.ts` → `server/ai/chat/session-title-generator.ts`
> - `lib/agent/conversation-summary.ts` → `server/ai/chat/conversation-summary.ts`
> - `server/ai/resume-chat-tools.ts` → `server/ai/chat/tools/registry.ts`
> - `repairToolCall` 从 `lib/agent/tools.ts` 和 `app/api/chat/resume/route.ts` 移除
> - 前端 `components/agent/chat/resume-editor.ts` / `index.ts` 移除无用的 tool executor 重导出
> - Tests: 96 files / 500 tests pass

## 背景

在 Phase 2 完成 chat server-authority cutover 后，应用应该已经能在新的 authoritative 路径上工作。但代码结构仍会残留旧边界：

- `lib/agent/*` 中混有 `server-only` 模块
- runtime registry、共享 schema、公开 type 仍未完全收口
- section field whitelist、entry schema、tool contract 可能还散落在多处

本阶段目标是在**不改变 Phase 2 对外行为**的前提下，把 contract 与模块边界整理到可长期维护的形态。

## 目标

- 把共享 schema 收口到单一来源
- 迁移 `server-only` chat/agent 模块到 `server/ai/chat/*`
- 清理前端残留的旧 tool execution 角色
- 让 field whitelist / entry schema / tool contract 从同一 schema 派生
- 保持应用在本阶段完成后行为不变且可正常运行

## 非目标

- 本阶段不新增功能
- 本阶段不更改 toolName
- 本阶段不引入 approval flow
- 本阶段不处理 `rewrite-entry`
- 本阶段不处理事务/RPC

## 已确认决策

- 共享 zod schema 统一收敛到 `lib/agent/schema.ts`
- 公开 type 继续先暴露在 `types/chat.ts`
- `getEntrySchema` 与各 section entry schema 迁入 `lib/agent/schema.ts`
- section 字段白名单/枚举从 schema 派生，不手写第二份列表
- chat 专用 runtime registry 放在 `server/ai/chat/tools/registry.ts`
- `repairToolCall` 移除
- 实施时优先复用当前稳定实现与渲染方式，不顺手重写整条链路

## 相关计划

- 前置阶段：`docs/plans/archive/2026-05-23-ai-sdk-phase-2-chat-server-authority-cutover.md`
- 总览：`docs/plans/current/2026-05-23-ai-sdk-integration-deepening.md`
- 后续阶段：`docs/plans/current/2026-05-23-ai-sdk-phase-4-provider-parser-consistency.md`

## 建议方案

### 1. 先收 schema 与 types，再迁模块

优先把“契约单一来源”定下来：

- `lib/agent/schema.ts`
- `types/chat.ts`

然后再迁移 server-only 模块与 registry，这样在迁目录时不会同时搬动 contract 语义。

### 2. 清理旧角色，而不是重做 renderer

- 保留 `ResumeEditorToolUI` 当前渲染方式
- 保留现有按 `toolName` 分发的 renderer
- 删除或彻底退出主链路的旧 client tool execution helper

## 任务清单

### Phase 3A: schema / type 收口

- [x] 新增或完善 `lib/agent/schema.ts`
- [x] 将 tool contract、entry schema、event schema、stream data schema 收口到共享 schema
- [x] 让 `types/chat.ts` 从共享 schema 派生公开类型
- [x] 清理 `InferUITools<typeof tools>` 对 runtime registry 的反向依赖

### Phase 3B: 模块迁移

- [x] 将 `lib/agent/model.ts` 迁到 `server/ai/model.ts`
- [x] 将 `lib/agent/chat-history.ts`、标题生成、summary 等 `server-only` 模块迁到 `server/ai/chat/*`
- [x] 将 chat runtime registry 迁到 `server/ai/chat/tools/registry.ts`
- [x] 删除 `repairToolCall`

### Phase 3C: 旧边界清理

- [x] 删除已无合法用途的前端 tool executor helper
- [x] 删除 chat 主链路已不再需要的旧 apply helper
- [x] 确认 `ResumeEditorToolUI` 继续消费当前 output discriminated union
- [x] 保持现有 renderer 分发方式不变

## 测试计划

### 单元 / 组件测试

- [x] 共享 schema 能派生出既有公开类型
- [x] field whitelist / entry schema 从共享 schema 派生后行为不变
- [x] 既有 tool UI 渲染不因 contract 收口而回归

### API / 集成测试

- [x] registry 迁移后 chat tool 行为不变
- [x] event schema 收口后 `tool_call` / `tool_result` / `tool_failed` 仍可正常写入

### 回归检查

- [x] chat 主流程与手动编辑在迁模块后仍正常运行
- [x] tool 解释卡片渲染无回归

## 验收标准

- 共享 schema 已收口到单一来源
- `server-only` agent/chat 模块已迁到 `server/ai/chat/*` 等 server 语义目录
- 前端不再保留 chat 主链路所需的旧 tool execution 角色
- 行为对外无变化，应用在本阶段完成后仍可正常运行
