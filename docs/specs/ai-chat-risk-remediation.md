# AI Chat Risk Remediation

**归档日期:** 2026-06-09
**来源计划:** docs/plans/archive/2026-06-03-ai-chat-risk-remediation.md

## 实现了什么

修复了 AI Chat 在 Application Resume 数据正确性、并发一致性、流式稳定性方面的系统性风险。核心改动：统一 AI edit apply/revert 模块、服务端 operation rebase 并发保护、canonical session 唯一约束、stream timeout/max output、日期归一化层。

## 关键文件

| 文件 | 职责 |
|---|---|
| `lib/resume/ai-edits.ts` | AI edit apply / revert / replay 统一模块 |
| `lib/resume/date-ranges.ts` | Agent 日期输入归一化层 |
| `lib/agent/resume-editor-execution.ts` | Tool execution 中日期归一化与 rollback metadata 持久化 |
| `server/resume/commit.ts` | `commitResumeOperation()` operation rebase 并发写入 |
| `supabase/migrations/20260607140052_canonical_resume_chat_sessions.sql` | Canonical session 唯一约束 |
| `app/api/chat/resume/route.ts` | Stream timeout / maxOutputTokens / 可重试错误文案 |
| `app/api/chat/truncate/route.ts` | Inverse operation rollback + semantic conflict 检测 |
| `server/ai/chat/history.ts` | `extractAiResumeEditOutputs()` / message count 过滤 truncated |

## 关键行为

- AI edit apply/revert: normalize `delete` output 带 `originalIndex`/`originalSectionOrder`，`add` 带 `createdSection`/`sectionDidNotExistBefore`
- Rollback 默认走 inverse tool output，不对整份 snapshot 回退
- 日期输入：agent 可传扁平 `start`/`end`/`date.start`/`date.end`/`isCurrent`，execution 归一化为 canonical；rollback metadata 保存 canonical 格式
- 并发写入分类：operation-rebase-success（自动重放）、stale-json-conflict（完整 JSON 拒绝覆盖）、semantic-conflict（目标冲突返回 409）
- Canonical session：`upsert(..., { onConflict: "user_id,resume_id" })`，迁移处理重复 session
- Stream：120s total / 60s step / 30s chunk timeout，2048 max output tokens，错误映射为可重试文案
- Token usage：message persistence 后 awaited；message count 只统计 `truncated = false`

## 数据 / 接口约定

- Resume domain 起止时间使用扁平 `start?` / `end?` 字段（非 `DateRange` 结构体），归一化由 `lib/resume/date-ranges.ts` 承担
- AI tool output 持久化在 `tool_result` event 和 assistant message parts 中，包含完整 rollback metadata
- Canonical session upsert 保证每 `(user_id, resume_id)` 最多一个 session

## 与计划的差异

- Phase 4 计划将 types/resume.ts 统一为 `DateRange` 结构体，实际以归一化层实现，type 层仍保留扁平字段；行为语义一致
- Phase 8 Playwright 回归发现并修复了额外问题：历史空 parts 过滤、模型认证失败 error 文案、默认标题生成 unhandled rejection、dangling user turn 残留

## 未完成 / 后续

- `pnpm exec tsc --noEmit` 仍有 3 个既有无关测试类型问题（`server/ai/model.test.ts` NODE_ENV、`server/auth-helper.test.ts` ApiError matcher、`server/intake/orchestrator.test.ts` mock type）
- `generateText` timeout 与 `listSessions` N+1 batch query 保留在 `2026-05-20-ai-subsystem-defect-fixes.md` 追踪
