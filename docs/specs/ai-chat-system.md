# AI Chat System & Editor Tools

**归档日期:** 2026-05-20
**最近更新:** 2026-06-07
**来源计划:** `docs/plans/archive/resume-chat.md`、`docs/plans/archive/resume-editor-tools.md`

## 实现了什么

每份 `Application Resume` 对应一个 canonical chat session。聊天面板不展示 session 列表/新建入口。右侧工作面板承载 AI Chat 与 Evaluation 两个视图。

Canonical session 由数据库唯一 index `resume_chat_sessions(user_id, resume_id)` 保障。服务端通过 `getOrCreateCanonicalSessionSummary()` 的 upsert / on-conflict 流程获取或创建 session；归档 session 仍是该 resume 的 canonical session，删除后再次获取会创建新的 canonical row。

## 关键文件

| 文件 | 职责 |
|---|---|
| `app/api/chat/resume/route.ts` | Chat API — 额度检查、模型调用、token 记录 |
| `app/api/chat/truncate/route.ts` | 消息截断/撤回 — 通过 inverse operation 恢复 resume 数据 |
| `lib/agent/tools.ts` | AI SDK tool 定义（resumeEditorModify + resumeEditorReorder） |
| `lib/agent/schema.ts` | Agent-facing schema 与 tool output schema |
| `server/ai/chat/history.ts` | Chat history 管理 — 消息过滤、session 维护、token usage 聚合 |
| `server/ai/chat/tools/registry.ts` | Server-side tool runtime — 执行工具并提交 authoritative resume patch |
| `lib/resume/ai-edits.ts` | AI edit apply / invert / rollback metadata 语义 |
| `server/resume/commit.ts` | Resume 写入并发保护 — revision 条件更新、operation rebase、snapshot |
| `lib/store/chat.ts` | 前端 chat 状态管理 — thread 生命周期、AI action 状态 |
| `components/agent/chat-interface.tsx` | Chat UI — 消息渲染、tool output card、input composer |
| `server/quota.ts` | Token 额度查询 — `getActiveAccessPass`、剩余额度 |
| `server/resume.ts` | 手动编辑保存入口 — 完整 `resume_json` replacement |

## Chat 消息

### 消息回溯（撤回）

- 用户消息旁显示"撤回"按钮
- 调用 `POST /api/chat/truncate`
- 服务端将目标消息之后的消息标记为 `truncated = true`
- 含成功 tool output 的消息触发 resume inverse operation
- rollback 通过 `commitResumeOperation()` 在最新 authoritative resume 上重放 inverse operation，成功后生成新的 resume revision / snapshot
- rollback 遇到 `semantic-conflict` 时返回 `409`，不会继续截断消息，避免留下“消息已撤回但 resume 未恢复”的状态
- 接口返回 authoritative `{ resume, currentRevision }` 覆盖前端

### 历史过滤

- 应用层过滤 `truncated = false`（RLS 不负责）
- `has_tools` 字段在消息保存/更新时自动维护
- 截断后恢复 conversation summary 到合适状态
- session summary / canonical list 的 `messageCount` 只统计 `truncated = false` 的消息，与 history / token usage 口径一致

### Token 统计

| 字段 | 说明 |
|---|---|
| `input_tokens` | 输入 token |
| `output_tokens` | 输出 token |
| `cached_tokens` | 缓存 token（当前只记录 `cacheReadTokens`） |
| `reasoning_tokens` | 推理 token |

- Session 级统计基于未截断消息重新聚合
- 成功响应持久化消息后，`updateSessionTokenUsage()` 会被 awaited；失败仅记录日志，不把已完成 assistant 回复变成失败
- token usage 聚合尝试结束后，继续按本次响应 `totalTokens` 扣减 `used_chat_tokens`
- 当 `used_chat_tokens >= quota_chat_tokens` 时拒绝新请求

### Stream 稳定性

- `streamText()` 接入当前 request 的 abort signal
- `streamText()` 使用固定 timeout：`totalMs = 120_000`、`stepMs = 60_000`、`chunkMs = 30_000`
- `streamText()` 设置 `maxOutputTokens = 2048`
- stream error 通过统一 mapper 转成前端可显示的重试文案；timeout / abort 使用超时重试文案，其他 provider / stream error 使用通用重试文案，同时保留服务端日志

### Token 配额

| Plan | 配额 |
|---|---|
| FREE | 100,000 |
| LITE | 1,000,000 |
| PRO | 100,000,000 |

## Thread 生命周期

状态机：`idle → loading-history → syncing-thread → ready → running → error`

- `pending action` 绑定 resumeId，避免切换简历后误执行
- Session 默认标题 `New Chat`，首条用户消息后自动生成

## 评估面板联动

- "一键润色简历"切换到 chat 视图，不走旧的 preview/apply 流程
- 预定义消息在 chat thread ready 后通过 pending action 机制发送
- 该流程不消耗 `fullOptimize` quota，走 resume chat token 额度

## Editor Tools

### resumeEditorModify

| 操作 | 输入 | 说明 |
|---|---|---|
| `rewrite` | `operation, entity, id, field, value` | 改写字段，输出含 rollback metadata |
| `delete` | `operation, entity, id` | 删除 entry（entity ≠ personalInfo），输出含原始 entry、section/index metadata |
| `add` | `operation, entity` | 新 entry 由工具侧生成默认值，输出含新增 entry / section metadata |

`entity` 枚举：`personalInfo, education, employment, research, projects, publications, awards, certifications, skills`

### resumeEditorReorder

| 操作 | 输入 | 说明 |
|---|---|---|
| `reorderEntries` | `operation, entity, orderedEntryIds` | section 内 entry 重排，输出含原始顺序 |
| `reorderSections` | `operation, orderedSectionIds` | section 重排（不含 personalInfo），输出含原始顺序 |

### 通用约束

- 输出语言必须与原始 resume 语言一致
- Agent-facing 日期输入可接受 `start` / `end` / `date.start` / `date.end` 等 LLM-friendly 结构，但 persisted resume domain 统一保存为 canonical `DateRange`
- Tool output 写入 chat 消息 parts，用于回滚与事件记录
- AI tool 和 rollback 这类结构化 operation 通过 `commitResumeOperation()` 提交；如果提交时 revision 已变化，会读取最新 resume 并尝试 rebase operation
- 手动编辑暂时仍是完整 `resume_json` replacement；当 base revision 过期时返回 `stale-json-conflict`，不能静默覆盖最新 resume
- operation 目标被后续修改影响时返回 `semantic-conflict`

## Chat Events

系统写入三类 `chat_events`：

| Type | 说明 |
|---|---|
| `tool_call` | 工具调用事件 |
| `tool_result` | 工具执行结果事件 |
| `tool_failed` | 工具执行失败事件 |
| `summary_checkpoint` | 摘要检查点 |
| `rollback` | 回滚事件 |

当前只实现事件写入，无产品侧查询接口。
