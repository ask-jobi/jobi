# Chat Session → Application Resume edit Module Deepening

**Date:** 2026-05-21

## 背景

当前 `Chat Session` 驱动的 `Application Resume` 修改链路已经可用，但同一个 AI edit 概念被拆散在多个浅 Module 中：

- `lib/agent/tools.ts` 定义 tool input/output schema
- `components/agent/chat/resume-editor.ts` 解释并执行 tool call
- `lib/resume/mutations.ts` 将 tool output apply 到 `Application Resume`
- `components/agent/chat-interface.tsx` 负责 local apply + persist
- `lib/agent/chat-history.ts` / `app/api/chat/truncate/route.ts` 负责 persist、truncate、replay、revert

这导致同一个 Interface 被多处重复解释，Seam 明显泄漏。当前还存在真实 contract 裂缝：`resumeEditorModify` 允许对 `personalInfo` 做 `rewrite`，但 apply / revert 实现主要只覆盖带 `entries` 的 `Section`，使 `Personal Information Section` 的行为在 Interface 与 Implementation 之间不一致。

相关上下文：

- `CONTEXT.md`
- `docs/app-architecture.md`
- `docs/plans/current/2026-05-20-ai-subsystem-defect-fixes.md`

## 目标

- 将 Chat 驱动的 `Application Resume` edit 收敛为一个更深的 Module
- 统一 edit intent、edit output、apply、persist、replay、revert 的规则
- 修复 `Personal Information Section` rewrite 等 Interface / Implementation 不一致问题
- 为后续新增 AI edit operation 提供稳定的 Seam 与测试面

## 非目标

- 本计划不重做整个 `Chat Session` 产品形态
- 本计划不改动模型选择、prompt 策略或 token 配额逻辑
- 本计划不引入多 `Chat Session` 语义
- 本计划不顺带重构普通手动编辑流程

## 代码现状

| 文件 | 当前职责 |
|---|---|
| `lib/agent/tools.ts` | tool schema 与 entity/entry schema 映射 |
| `components/agent/chat/resume-editor.ts` | tool input → tool output |
| `lib/resume/mutations.ts` | tool output → `Application Resume` |
| `components/agent/chat-interface.tsx` | tool call 执行、local apply、保存 |
| `app/api/chat/truncate/route.ts` | truncate 后按 tool output 逆向恢复 |
| `lib/agent/chat-history.ts` | chat message persist、tool output 提取、summary checkpoint |

## 已确认决策

- `Application Resume` 是编辑器唯一真实状态源
- 每份 `Application Resume` 只有一个 canonical `Chat Session`
- AI edit 的测试面应落在统一 Interface 上，而不是分散在各 Adapter 上

## 建议方案

### 1. 提炼统一的 AI edit Module

引入单独 Module，统一拥有：

- edit intent 定义
- edit output 定义
- output apply 规则
- output revert / replay 规则
- 对 message parts 的序列化与反序列化约束

### 2. 收口 `Section` 特殊规则

显式定义：

- `Personal Information Section` 的 rewrite 规则
- entry-based `Section` 的 add / delete / reorder 规则
- section reorder 的约束

避免调用方分别使用 `hasEntries()`、`entity === "personalInfo"`、或隐式字段假设。

### 3. 缩窄 Chat Interface Adapter 职责

`chat-interface.tsx` 退化为 UI Adapter，只负责：

- 接收 tool call
- 调用统一 AI edit Module
- 接收结果并刷新 UI

不再自行理解 apply / persist contract。

## 任务清单

### Phase 1: 盘点与收口 contract

- [ ] 盘点 `resumeEditorModify` / `resumeEditorReorder` 的完整 Interface
- [ ] 列出当前 apply / revert / persist 的差异点
- [ ] 补一份 `Personal Information Section` rewrite 的失败复现用例

### Phase 2: 提炼深 Module

- [ ] 新建统一 AI edit Module
- [ ] 收口 edit intent 与 output 类型定义
- [ ] 将 apply 逻辑迁入统一 Module
- [ ] 将 revert / replay 逻辑迁入统一 Module
- [ ] 收口 message part ↔ edit output 映射规则

### Phase 3: 调整调用方

- [ ] `components/agent/chat/resume-editor.ts` 改为调用统一 Module
- [ ] `components/agent/chat-interface.tsx` 移除分散的 apply 解释逻辑
- [ ] `app/api/chat/truncate/route.ts` 改为复用统一 revert Interface
- [ ] `lib/agent/chat-history.ts` 仅保留持久化与 history 职责

### Phase 4: 测试与回归

- [ ] 为统一 Module 增加 round-trip 测试（apply → revert）
- [ ] 覆盖 `Personal Information Section` rewrite
- [ ] 覆盖 entry add / delete / reorder
- [ ] 覆盖 section reorder
- [ ] 覆盖 truncate 后恢复 `Application Resume`

## 测试计划

### 单元 / 组件测试

- [ ] `Personal Information Section` rewrite 可正确 apply
- [ ] `Personal Information Section` rewrite 可正确 revert
- [ ] delete 最后一个 entry 后的 `Section` 移除与恢复
- [ ] reorderEntries 保持 entry 集合不丢失
- [ ] reorderSections 保持 `personalInfo` 固定在首位

### 回归检查

- [ ] `/application/[id]/resume` 中 AI Chat 正常发送消息
- [ ] tool 调用后画布内容同步更新
- [ ] truncate / rollback 后 `Application Resume` 正确恢复

## 风险

- AI edit output 已被现有 message history 持久化，迁移时需要兼容旧数据
- 若 Interface 改动过大，truncate / rollback 容易出现历史消息不兼容
- 若 apply 与 revert 仍然分叉，deepening 只会搬家不会增深

## 验收标准

- AI edit 的 apply / revert / replay 规则由一个统一 Module 拥有
- `Personal Information Section` rewrite 不再存在 Interface / Implementation 裂缝
- 新增一个 edit operation 时，不需要在 4 个以上文件重复补规则
- 关键 round-trip 测试与 AI Chat 回滚回归通过
