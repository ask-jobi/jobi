# AI Chat System & Editor Tools

**归档日期:** 2026-05-20
**来源计划:** `docs/plans/archive/resume-chat.md`、`docs/plans/archive/resume-editor-tools.md`

## 实现了什么

每份 `Application Resume` 对应一个 canonical chat session。聊天面板不展示 session 列表/新建入口。右侧工作面板承载 AI Chat 与 Evaluation 两个视图。

## 关键文件

| 文件 | 职责 |
|---|---|
| `app/api/chat/resume/route.ts` | Chat API — 额度检查、模型调用、token 记录 |
| `app/api/chat/truncate/route.ts` | 消息截断/撤回 — 逆向恢复 resume 数据 |
| `lib/agent/tools.ts` | AI tool schema 定义（resumeEditorModify + resumeEditorReorder） |
| `lib/agent/chat-history.ts` | Chat history 管理 — 消息过滤、tool output 解析、session 维护 |
| `lib/store/chat.ts` | 前端 chat 状态管理 — thread 生命周期、AI action 状态 |
| `components/agent/chat-interface.tsx` | Chat UI — 消息渲染、tool output card、input composer |
| `server/quota.ts` | Token 额度查询 — `getActiveAccessPass`、剩余额度 |
| `server/resume.ts` | Resume 持久化 — AI tool 产出落库 |
| `lib/resume/mutations.ts` | `applyToolOutputToResume()` — tool output → `ResumeData` |

## Chat 消息

### 消息回溯（撤回）

- 用户消息旁显示"撤回"按钮
- 调用 `POST /api/chat/truncate`
- 服务端将目标消息之后的消息标记为 `truncated = true`
- 含 tool output 的消息触发简历数据逆向恢复
- 接口返回最新 resume data 覆盖前端

### 历史过滤

- 应用层过滤 `truncated = false`（RLS 不负责）
- `has_tools` 字段在消息保存/更新时自动维护
- 截断后恢复 conversation summary 到合适状态

### Token 统计

| 字段 | 说明 |
|---|---|
| `input_tokens` | 输入 token |
| `output_tokens` | 输出 token |
| `cached_tokens` | 缓存 token（当前只记录 `cacheReadTokens`） |
| `reasoning_tokens` | 推理 token |

- Session 级统计基于未截断消息重新聚合
- 成功响应后累加 `totalTokens` 到 `used_chat_tokens`
- 当 `used_chat_tokens >= quota_chat_tokens` 时拒绝新请求

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
| `rewrite` | `operation, entity, id, field, value` | 改写字段，输出含 `originalValue` |
| `delete` | `operation, entity, id` | 删除 entry（entity ≠ personalInfo），输出含 `originalValue` |
| `add` | `operation, entity` | 新 entry 由工具侧生成默认值 |

`entity` 枚举：`personalInfo, education, employment, research, projects, publications, awards, certifications, skills`

### resumeEditorReorder

| 操作 | 输入 | 说明 |
|---|---|---|
| `reorderEntries` | `operation, entity, orderedEntryIds` | section 内 entry 重排 |
| `reorderSections` | `operation, orderedSectionIds` | section 重排（不含 personalInfo），输出含 `originalValue` |

### 通用约束

- 输出语言必须与原始 resume 语言一致
- Tool output 写入 chat 消息 parts，用于回滚与事件记录

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
