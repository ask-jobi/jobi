# AI SDK Phase 1：Resume Revision Foundation

> **已完成** — 归档日期：2026-06-01
>
> **实际落地要点：**
> - `supabase/migrations/20260523000000_add_resume_revisions_and_snapshots.sql` 为 `resumes` 增加 `current_revision`，并引入 `resumes_snapshot`
> - `server/resume/commit.ts` 与 `server/resume/snapshots.ts` 收口 authoritative resume 提交、revision 推进与 snapshot 写入
> - `server/resume.ts`、`lib/store/resume.ts`、`app/api/chat/truncate/route.ts`、`app/(protected)/(individual)/application/[id]/layout.tsx` 已统一承接 authoritative `{ resume, currentRevision }`
> - `server/intake/persist.ts` 在新建 resume 时写入 revision 1 snapshot；rollback 仍通过提交链路把 `evaluation_report_refresh_flag` 置为 `true`
>
> **与计划的差异：**
> - 实际落地时把 uploaded intake 的初始 snapshot 写入也一起并入了 Phase 1，而不只覆盖手动保存与 rollback
> - 本阶段的验收证据以聚焦测试和主流程实测为主，未额外拆出独立的 UI spec

**Date:** 2026-05-23

## 背景

`docs/plans/current/2026-05-23-ai-sdk-integration-deepening.md` 已收敛出新的 authoritative resume 模型：

- 当前态保存在 `resumes.resume_json`
- 当前版本保存在 `resumes.current_revision`
- 历史保存在 `resumes_snapshot`

后续 chat server-authority cutover、rollback 对齐、AI patch 下发都依赖这层基础数据模型先成立。本阶段目标是在**不先切 chat tool 执行权**的前提下，把 resume 当前态/版本/历史链路建立起来，并让应用在本阶段完成后仍可运行。

## 目标

- 为 resume 当前态建立 `current_revision + snapshot` 基础模型
- 让需要参与 authoritative resume 协调的“当前 resume”读路径返回 `resume.current_revision`
- 引入统一的 resume 提交入口，供后续 chat 与手动编辑共用
- 先把手动保存与 rollback 返回值切到 authoritative `{ resume, currentRevision }`

## 非目标

- 本阶段不把 chat tool 执行权从前端切到服务端
- 本阶段不引入 authoritative patch 流
- 本阶段不迁移 server-only agent/chat 模块目录
- 本阶段不处理 `rewrite-entry` 路由
- 本阶段不处理事务/RPC/失败补偿

## 已确认决策

- 项目尚未上线，不保留旧数据兼容层
- `current_revision` 直接存放在 `resumes` 表
- `resumes_snapshot` 使用 `(resume_id, revision)` 唯一约束与 `event_id` 普通索引
- 手动编辑继续提交完整 `nextResume`
- 手动编辑与 rollback 成功后都返回 authoritative `{ resume, currentRevision }`
- 手动编辑继续 last-writer-wins，不做 `expectedRevision` 校验
- committed resume 变化会把 `evaluation_report_refresh_flag` 置为 `true`

## 相关计划

- 总览：`docs/plans/current/2026-05-23-ai-sdk-integration-deepening.md`
- 下一阶段：`docs/plans/current/2026-05-23-ai-sdk-phase-2-chat-server-authority-cutover.md`

## 建议方案

### 1. 先落数据模型，再切读模型

先做数据库与类型层：

- `resumes.current_revision`
- `resumes_snapshot`
- `types/resume.ts` / `types/supabase.ts`

随后扩展需要参与 authoritative resume 协调的读路径，让页面加载、chat 上下文、手动保存返回、rollback 返回都能看到 `currentRevision`；纯渲染读路径继续直接读取最新 `resume_json`。

### 2. 引入统一提交入口，但先只接手手动保存与 rollback

新增：

- `server/resume/commit.ts`
- `server/resume/snapshots.ts`

它们先服务于：

- `saveApplicationResumeChange(...)`
- rollback 相关 resume 恢复路径

这样 Phase 1 完成后，应用已经在“authoritative save response + revisioned snapshot history”上运行，但 chat 仍保留现状执行方式，不会一次性切太多边界。

### 3. 明确本阶段后的运行状态

本阶段完成后：

- 页面与手动编辑仍可正常使用
- rollback 能返回 authoritative current state
- chat 仍可工作，但 tool 执行权尚未迁移到服务端
- 旧数据不兼容，命中时允许按现有运行时错误暴露

## 任务清单

### Phase 1A: 数据库与类型

- [x] 为 `resumes` 增加 `current_revision`
- [x] 新增 `resumes_snapshot` 表
- [x] 为 `resumes_snapshot` 增加 `(resume_id, revision)` 唯一约束
- [x] 为 `resumes_snapshot.event_id` 增加普通索引
- [x] 更新 `types/supabase.ts`
- [x] 更新 `types/resume.ts`，把 `current_revision` 挂到 `JobApplication.resume`

### Phase 1B: 服务端提交基础设施

- [x] 新增 `server/resume/snapshots.ts`
- [x] 新增 `server/resume/commit.ts`
- [x] 在统一提交入口中实现：更新 `resume_json`、推进 `current_revision`、写 snapshot
- [x] no-op 时不推进 revision、不写 snapshot

### Phase 1C: 读路径与调用方切换

- [x] 扩展需要参与 authoritative resume 协调的当前 resume 读路径，返回 `resume.current_revision`
- [x] 更新前端 resume/application store，承接 `current_revision`
- [x] 将 `saveApplicationResumeChange(...)` 改为返回 authoritative `{ resume, currentRevision }`
- [x] 手动编辑成功后以前端覆盖 authoritative 返回值为准
- [x] rollback 接口改为返回 authoritative `{ resume, currentRevision }`
- [x] rollback 后仍置 `evaluation_report_refresh_flag=true`

## 测试计划

### 单元 / 组件测试

- [x] `resume_json` 无变化时不推进 revision / 不写 snapshot
- [x] `saveApplicationResumeChange(...)` 返回 authoritative `{ resume, currentRevision }`
- [x] 前端 store 能承接并更新 `current_revision`

### API / 集成测试

- [x] 需要参与 authoritative resume 协调的读路径返回 `resume.current_revision`
- [x] 手动保存返回 authoritative `{ resume, currentRevision }`
- [x] rollback 返回 authoritative `{ resume, currentRevision }`
- [x] rollback 后 `evaluation_report_refresh_flag=true`

### 回归检查

- [x] 页面正常加载当前 resume
- [x] 手动编辑保存后 UI 正常更新
- [x] rollback 后 resume 能恢复且页面状态正确

## 验收标准

- `resumes.current_revision` 与 `resumes_snapshot` 已成为正式数据模型的一部分
- 需要参与 authoritative resume 协调的当前 resume 读路径都返回 `resume.current_revision`
- 手动保存与 rollback 都返回 authoritative `{ resume, currentRevision }`
- 应用在本阶段完成后仍可正常加载、编辑与回滚 resume

## 完成证据

- 新建 resume 会同步写入 revision 1 snapshot：`server/intake/persist.ts`
- rollback 专项测试已断言提交路径写入 `evaluation_report_refresh_flag=true`：`app/api/chat/truncate/route.rollback-flag.test.ts`
- 聚焦测试：`pnpm exec vitest run server/intake/persist.test.ts server/resume.test.ts app/api/chat/truncate/route.test.ts app/api/chat/truncate/route.rollback-flag.test.ts server/resume/commit.test.ts`
