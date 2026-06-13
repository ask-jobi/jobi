# Resume Write Concurrency and Rollback

**Date:** 2026-06-04

## 背景

Jobi 的 `Application Resume` 当前态由 `resumes.resume_json` 与 `resumes.current_revision` 共同表达，历史版本写入 `resumes_snapshot`。所有成功的 committed resume 修改都应该推进 revision，并写入对应 snapshot。

当前写入入口主要集中在：

| 文件 | 职责 |
|---|---|
| `server/resume/commit.ts` | 当前 authoritative resume 提交入口，更新 `resume_json`、推进 `current_revision`、写 snapshot |
| `server/resume.ts` | 手动编辑保存入口，当前提交完整 `resume_json` replacement |
| `server/ai/chat/tools/registry.ts` | AI tool 执行入口，当前已经基于结构化 operation 修改 resume |
| `app/api/chat/truncate/route.ts` | Chat 消息撤回 / rollback 入口，目标是撤销 AI 修改并返回 authoritative resume |

当前风险是：`commitResumeChange()` 读出当前 revision 后，在 TypeScript 中计算 `nextRevision`，再用 `.eq("id", resumeId)` 更新。这会导致并发写入下的 last-writer-wins：后写可能静默覆盖先写。

本文件描述目标并发语义：**AI / rollback 这类 operation 可以按最新 resume 顺序消费；手动编辑在未 operation 化前仍作为完整 JSON replacement，遇到过期 base revision 时必须显式 conflict。**

## 核心目标

- 防止并发 resume 写入静默覆盖
- 允许可重放的 AI operation 后到时基于最新 resume 继续 apply
- 支持单独撤回某条 AI 修改，同时保留之后发生的其他有效修改
- 保持 `current_revision` 单调递增，不倒退 revision
- 每次成功写入都生成新的 snapshot
- 不依赖 Postgres RPC

## 写入类型

### AI Tool Operation

AI Chat 当前已经是 operation 模式。模型调用 tool，服务端执行结构化操作，例如：

```ts
{
  operation: "rewrite",
  entity: "education",
  id: "edu-1",
  field: "school",
  value: "New School"
}
```

这类写入不应该提交一份基于旧 revision 算好的完整 `resume_json`。它应该在服务端读取最新 resume 后，将 operation apply 到最新 resume 上。

### Rollback Inverse Operation

单独撤回 AI 修改时，rollback 不应该把整份 resume 回退到旧 snapshot。它应该根据成功 tool output 中保存的 rollback metadata 生成 inverse operation，并 apply 到当前最新 resume。

例如：

```txt
r1 原始
r2 AI 改 education.school = X
r3 用户手动改 phone = 222
撤回 r2
r4 保留 phone = 222，只撤销 education.school
```

### Manual Resume JSON Replacement

手动编辑当前仍是完整 `resume_json` replacement。也就是说，用户保存时提交的是一整份 resume，而不是“修改 phone 字段”这类 operation。

这类写入如果基于旧 revision，不能自动写入最新 resume，否则会覆盖并发产生的修改。短期策略是返回 `stale-json-conflict`，前端 refetch authoritative resume 并提示用户重试。

后续如果要让手动编辑也支持自动 rebase，需要另开计划，把表单保存从完整 JSON replacement 改成 operation / patch intent。

## 并发结果分类

### operation-rebase-success

结构化 operation 可以在最新 resume 上安全重放。

```txt
r1:
  education.school = Old School
  phone = 111

A operation: rewrite education.school = New School
B operation: rewrite personalInfo.phone = 222

A 先到:
  apply A on r1 -> r2

B 后到:
  read latest r2
  apply B on r2 -> r3
```

结果：A 和 B 都保留。

### stale-json-conflict

完整 `resume_json` replacement 基于旧 revision，不能直接覆盖最新 resume。

```txt
r1:
  education.school = Old School
  phone = 111

A 基于 r1 改 education:
  education.school = New School
  phone = 111

B 基于 r1 手动改 phone，提交完整 JSON:
  education.school = Old School
  phone = 222

A 先写入 r2
B 后到，如果直接写入，会把 education.school 覆盖回 Old School
```

结果：B 必须返回 `stale-json-conflict`，不能静默覆盖。

### semantic-conflict

operation 目标已经被后续修改影响，无法安全 rebase。

```txt
r1:
  education.school = Old School

r2:
  AI 改 education.school = AI School

r3:
  用户手动改 education.school = User School

用户撤回 r2
```

如果 rollback 直接把 `education.school` 改回 `Old School`，会覆盖用户在 r3 的 `User School`。这不是可安全重放，应该返回 `semantic-conflict`。

## 推荐提交流程

不依赖 Postgres RPC。服务端 TypeScript module 负责串行提交循环。

### Operation 提交流程

```txt
input:
  resumeId
  actorId
  operation
  baseRevision
  eventId?

loop:
  1. 读取最新 resume 与 current_revision
  2. 校验 actor 是否拥有 resume
  3. 判断 operation 是否可在最新 resume 上安全 apply
  4. apply operation 得到 nextResume
  5. 如果 nextResume 与当前 resume 深相等，返回当前 authoritative state
  6. nextRevision = current_revision + 1
  7. 条件更新 resumes:
       where id = resumeId
       and current_revision = 读取到的 current_revision
  8. 如果条件更新失败，说明被并发写抢先:
       重读最新 resume，回到第 3 步
  9. update 成功后写 resumes_snapshot
  10. 返回 { resume: nextResume, currentRevision: nextRevision }
```

需要限制 retry 次数，避免高并发下无限循环。超过上限返回可重试错误。

### JSON Replacement 提交流程

```txt
input:
  resumeId
  actorId
  nextResume
  baseRevision

flow:
  1. 读取最新 current_revision
  2. 如果 current_revision !== baseRevision:
       返回 stale-json-conflict
  3. 否则按条件更新 current_revision 提交
  4. 写 snapshot
```

完整 JSON replacement 不做自动 rebase。

## Snapshot 语义

Snapshot 是审计和兜底，不是单独撤回的主机制。

### 应该做

- 每次成功写入生成新的 snapshot
- rollback 成功后也生成新的 rollback revision / snapshot
- 用 snapshot 辅助诊断旧历史 output metadata 不完整的问题
- 用 snapshot 支持人工恢复或整份 resume 恢复

### 不应该做

- 不倒退 `current_revision`
- 不把当前 resume 直接重置到旧 snapshot 来实现单独撤回
- 不用旧 snapshot 覆盖目标 AI 修改之后的其他有效修改

正确模型：

```txt
r1 原始
r2 AI 修改
r3 用户手动修改
r4 rollback 结果，内容可能部分接近 r1，但 revision 是新的
```

## Rollback 策略

### 输入来源

Rollback 应从 chat history 中提取成功 tool output，并依赖其中的 rollback metadata：

- operation type
- target entity / entry id / field
- originalValue
- normalized value
- originalIndex
- originalSectionOrder
- createdSection / removedSection
- baseVersion / nextVersion

### 执行顺序

对需要撤回的 tool outputs 按逆序执行 inverse operation。

```txt
AI 同一轮中:
  op1: rewrite A
  op2: rewrite B

rollback:
  revert op2
  revert op1
```

### 冲突判断

Rollback 不能只看 target id 是否存在，还要判断目标当前值是否仍是可撤销状态。

例子：

```txt
r1 school = Old
r2 AI 改 school = AI
r3 用户改 school = User
撤回 r2
```

当前值已经不是 AI 写入值，说明目标字段被后续修改影响。应返回 `semantic-conflict`，不能覆盖为 Old。

另一个例子：

```txt
r1 school = Old, phone = 111
r2 AI 改 school = AI
r3 用户改 phone = 222
撤回 r2
```

目标字段仍是 AI 写入值，phone 修改不相关。可以撤回 school，同时保留 phone。

## Snapshot Insert 失败处理

当前 `commitResumeChange()` 是先 update `resumes`，再 insert `resumes_snapshot`。如果 update 成功但 snapshot insert 失败，会出现 current revision 已推进但 snapshot 缺失的问题。

本计划不依赖 RPC，但仍需要处理这个边界：

- 首选：让提交函数在 snapshot insert 失败时抛出高严重错误，并记录足够上下文
- 增加后台修复脚本或管理命令，根据 `resumes.current_revision` 和当前 `resume_json` 补缺失 snapshot
- 测试覆盖 update 成功但 snapshot insert 失败的错误路径

如果后续平台能力允许数据库事务封装，可以再评估更强的原子性方案；当前约束是不依赖 RPC。

## 前端行为

### AI Chat

- AI tool 成功后，前端收到 authoritative patch，并推进本地 `current_revision`
- 如果 patch baseVersion 与本地 revision 不匹配，前端拒绝 patch 并 refetch authoritative resume

### Manual Edit

- 手动保存时应携带 base revision
- 遇到 `stale-json-conflict` 时，前端 refetch authoritative resume
- UI 提示用户当前简历已被其他操作更新，需要重新应用本次修改

### Rollback

- rollback 成功返回 authoritative `{ resume, currentRevision }`
- rollback semantic conflict 时，不应截断消息后留下 resume 未恢复状态
- 前端应显示可理解错误，并建议刷新后重试

## 测试清单

### 单元测试

- AI operation 基于 r1 生成，提交时当前为 r2，能 rebase 成 r3
- 两个 AI operation 修改不同字段，后到者保留先到者修改
- 两个 operation 修改同一字段时，按产品语义明确后到覆盖或 semantic conflict
- 手动完整 JSON replacement 基于旧 revision 时返回 `stale-json-conflict`
- rollback inverse operation 保留后续不相关手动修改
- rollback inverse operation 遇到同字段后续修改时返回 `semantic-conflict`
- 条件更新失败后重读并 retry
- retry 超限返回可重试错误
- update 成功但 snapshot insert 失败时抛出明确错误

### API / 集成测试

- `/api/chat/resume` 多 tool 串行成功，revision 连续推进
- `/api/chat/resume` operation rebase 后仍写入正确 snapshot
- `/api/chat/truncate` 单独撤回 AI 修改，不覆盖后续手动编辑
- 手动编辑保存遇到过期 base revision 时返回 conflict，而不是覆盖

### UI 回归

- AI 修改后手动编辑其他字段，再撤回 AI 修改，手动编辑保留
- 手动编辑保存时若简历已被 AI 更新，出现可理解提示并刷新 authoritative state
- 多标签页编辑不会静默丢失先保存的内容

## 与当前计划的关系

本文件支撑 `docs/plans/current/2026-06-03-ai-chat-risk-remediation.md` 中的 Phase 5：Resume 写入并发保护，以及 rollback 相关任务。实现完成后，应将最终事实同步到 `docs/specs/` 中的正式规格文档。
