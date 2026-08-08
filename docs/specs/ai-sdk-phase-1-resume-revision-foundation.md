# AI SDK Phase 1: Resume Revision Foundation

**归档日期:** 2026-06-01
**来源计划:** `docs/plans/archive/2026-05-23-ai-sdk-phase-1-resume-revision-foundation.md`

## 实现了什么

Resume 当前态现在由 `resumes.resume_json + resumes.current_revision` 共同表达，历史通过 `resumes_snapshot` 追加保存。手动保存、uploaded intake 初始创建和 chat rollback 都统一回到 authoritative `{ resume, currentRevision }` 返回值语义。

## 关键文件

| 文件 | 职责 |
|---|---|
| `db/migrations/0001_initial.sql` | 增加 `current_revision`、创建 `resumes_snapshot`、补齐 SQLite 索引 |
| `server/resume/commit.ts` | authoritative resume 提交入口：深比较 no-op、推进 revision、置 `evaluation_report_refresh_flag=true` |
| `server/resume/snapshots.ts` | `resumes_snapshot` 写入 helper |
| `server/resume.ts` | 读取 authoritative current resume；手动保存返回 `{ resume, currentRevision }` |
| `server/intake/persist.ts` | 新建 resume 时写入 revision 1 snapshot |
| `app/api/chat/truncate/route.ts` | rollback 返回 authoritative `{ resume, currentRevision }` |
| `lib/store/resume.ts` | 前端 persisted state 承接 `resume.current_revision` 与 authoritative 覆盖 |
| `app/(protected)/(individual)/application/[id]/layout.tsx` | 页面正式读路径把 `current_revision` 带到前端 |

## 关键行为

- 当 `resume_json` 有实际变化时，提交链路会把 `current_revision` 加一，并写一条对应的 `resumes_snapshot`
- 当 `resume_json` 无变化时，提交链路直接返回现有 authoritative state，不推进 revision、不写 snapshot
- 手动保存成功后，前端以服务端返回的 `{ resume, currentRevision }` 覆盖本地 persisted state
- chat rollback 成功后，同样返回 authoritative `{ resume, currentRevision }`，并把 `evaluation_report_refresh_flag` 置为 `true`
- uploaded intake 创建出的新 resume 会立即拥有 revision 1 snapshot

## 数据 / 接口约定

- `JobApplication.resume.current_revision` 是前端正式读模型的一部分，不把 revision 塞进 `resume_json`
- `resumes_snapshot` 使用 `(resume_id, revision)` 唯一约束，`event_id` 为可空关联索引
- authoritative save/rollback 返回值统一为 `{ resume, currentRevision }`

## 与计划的差异

- uploaded intake 的初始 snapshot 写入一并落在了本阶段，而不是推迟到后续 phase

## 未完成 / 后续

- chat tool execution 的 authoritative cutover 在 `2026-05-23-ai-sdk-phase-2-chat-server-authority-cutover.md`
- contract/schema/module 边界清理继续在 Phase 3、Phase 4 推进
