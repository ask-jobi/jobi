# AI SDK 集成 Deepening 与边界收敛

**归档日期:** 2026-06-01
**来源计划:** docs/plans/archive/2026-05-23-ai-sdk-integration-deepening.md

## 实现了什么

对 AI SDK (`ai` / `@ai-sdk/*`) 集成做了一次系统性的 deepening，用四个可独立完成的 phase 把 chat authority、revision/snapshot、contract boundary 和 provider consistency 四大问题逐一解决。

## 关键文件

| 文件 | 职责 |
|---|---|
| `supabase/migrations/20260523000000_add_resume_revisions_and_snapshots.sql` | `current_revision` 字段 + `resumes_snapshot` 表 |
| `server/resume/commit.ts` | 统一 resume 提交入口：推进 revision / snapshot |
| `server/resume/snapshots.ts` | Snapshot 底层写入 helper |
| `server/ai/chat/tools/registry.ts` | 服务端 tool runtime registry (含 execute) |
| `lib/agent/schema.ts` | 共享 zod schema 单一来源 (entry + tool + event + chat) |
| `lib/agent/tools.ts` | 共享 tool 定义 (重新导出 schema.ts) |
| `server/ai/chat/history.ts` | Chat session / message CRUD |
| `server/ai/model.ts` | direct DeepSeek provider 模型选择 |
| `components/agent/chat-interface.tsx` | 前端 `onData` 消费 patch + 版本冲突检测 |
| `server/chat-events.ts` | Chat event 持久化 + event_data zod 校验 |

## 关键行为

- **Resume authority**: 所有 committed resume 变更走 `server/resume/commit.ts` → snapshot → revision 推进
- **Chat tool execution**: 服务端执行，`data-resume-patch` 流式下发给前端
- **前端消费者**: `onData` 消费 patch，版本冲突时拒绝应用并触发 authoritative refetch
- **Schema 单一来源**: entry schemas + tool I/O schemas + event data schemas 统一在 `lib/agent/schema.ts`
- **AI provider**: 通过 direct DeepSeek API provider 调用 `DEEPSEEK_MODEL_ID`（默认 `deepseek-v4-flash`）
- **Token 统计**: 信任 provider 总量，reasoning 作为 breakdown 不计入

## 数据 / 接口约定

- `resumes.current_revision` + `resumes_snapshot` (append-only)
- `chat_events` taxonomy: `tool_call` / `tool_result` / `tool_failed` / `summary_checkpoint` / `rollback`
- `POST /api/chat/resume` 要求 `verifyOwnership`，返回 streaming `data-resume-patch`
- `saveApplicationResumeChange` 返回 authoritative `{ resume, currentRevision }`
- `data-resume-patch` transient part type: `{ snapshotId, messageId, baseVersion, nextVersion, body }`

## 与计划的差异

无重大偏差。补项（版本冲突检测 + event_data 校验）已归入实施范围。

## 未完成 / 后续

- Playwright E2E 回归由独立计划 `docs/plans/current/2026-05-23-playwright-e2e-coverage-expansion.md` 覆盖
- `rewrite-entry` 路由仍排除在外
- 事务/RPC/失败补偿后置
