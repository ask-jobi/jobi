# AI Chat Risk Remediation

**Date:** 2026-06-03

## 背景

当前 AI Chat 主链路已经完成 AI SDK / assistant-ui 的权威历史切换：`POST /api/chat/resume` 负责模型调用、server-side tools 执行、消息持久化与 token 记录；前端只消费流式消息和 authoritative resume patch。相关单测目前覆盖了 happy path、工具错误持久化、基础 truncate、前端 patch 冲突处理等场景。

本轮审查发现，剩余风险主要集中在 `Application Resume` 数据正确性和状态一致性上：AI edit 的 apply / revert 规则仍分散在不同模块，truncate rollback 在多个真实场景下不能恢复到撤回前状态；resume 写入缺少服务端 revision 乐观锁；canonical chat session 只靠应用层先查再建，缺少数据库唯一约束；流式模型调用缺少硬超时和输出上限。这些问题不一定会在普通聊天中立即显现，但一旦触发，会表现为“聊天看起来成功，简历实际没有变化或撤回后状态错误”。

相关上下文：

- `CONTEXT.md`
- `docs/app-architecture.md`
- `docs/specs/ai-chat-system.md`
- `docs/resume-write-concurrency-and-rollback.md`
- `docs/plans/current/2026-05-20-ai-subsystem-defect-fixes.md`
- `docs/plans/current/2026-05-21-chat-session-application-resume-edit-deepening.md`

## 目标

- 修复 AI Chat truncate / rollback 无法可靠恢复 `Application Resume` 的数据正确性问题
- 支持单独撤回某条 AI 修改的影响，并保留之后发生的其他有效修改
- 统一 AI edit apply / revert / replay 规则，避免 schema 和业务规则继续分叉
- 为 resume 写入增加服务端并发保护，防止 AI tool、手动编辑、撤回互相覆盖
- 为 canonical chat session 增加数据库级唯一性保障
- 为 chat 流式模型调用增加硬超时、输出上限与可观测错误路径
- 补齐高风险场景的单元、组件和针对性 UI 回归覆盖

## 非目标

- 本计划不重做 AI Chat 产品形态，不新增多 session UI
- 本计划不替换 LLM provider，不重写 prompt 策略
- 本计划不重构整个 resume editor 手动编辑流程
- 本计划不引入完整 observability 平台，仅补必要日志、错误传播和测试
- 本计划不处理与 AI Chat 无关的 token pricing 或 payment 流程

## 代码现状

| 文件 | 当前职责 | 主要风险 |
|---|---|---|
| `app/api/chat/resume/route.ts` | Chat API、流式响应、消息持久化、token 记录 | `streamText` 缺少 timeout / max output；session token usage 聚合仍是后台任务 |
| `server/ai/chat/tools/registry.ts` | server-side resume editor tools，提交 authoritative resume patch | 依赖 `commitResumeChange`，但服务端写入还不能按最新 revision rebase operation |
| `lib/resume/mutations.ts` | 将 tool output apply 到 `ResumeData` | `add` 不支持不存在的 section；schema 变化时 revert 不会同步 |
| `app/api/chat/truncate/route.ts` | 截断消息并回滚 resume 数据 | revert 逻辑分叉，缺 personalInfo、逆序、多 step、section 恢复、原始位置支持 |
| `lib/agent/schema.ts` | AI tool input/output schema | `projects` / `research` entry schema 与真实 `types/resume.ts` 不一致 |
| `server/resume/commit.ts` | 持久化 resume 修改和 snapshot | 缺少串行提交 / operation rebase 语义，存在并发覆盖风险 |
| `server/ai/chat/history.ts` | chat session/message 持久化与 summary checkpoint | canonical session 先查再建，缺数据库唯一约束；message count 未过滤 truncated |
| `components/agent/chat/user-message.tsx` | 用户消息撤回入口 | truncate 后 `headId` 可能指向已删除 message |

## 已确认问题

### 1. Rollback 与 Apply 不对称

- `personalInfo` rewrite 在 `applyToolOutputToResume()` 中支持，但 `revertToolOutput()` 只处理带 `entries` 的 section。
- 连续多个 tool output 当前按正序回滚，连续改同一字段时会恢复到错误中间态。
- `delete` 最后一条 entry 后，apply 会移除整个 section；rollback 因 section 不存在而无法恢复。
- `delete` rollback 只把 entry push 到末尾，没有原始 index，无法恢复原顺序。
- `add` rollback 能删除新增 entry，但没有统一处理新增 section 的生命周期。

### 2. AI Add Section 可能无效

`applyToolOutputToResume()` 对 `add` 操作先读取 `copiedResume[entity]`，若 section 不存在就直接返回原 resume。空白简历或用户删除过 section 后，AI 调用 add 会得到成功型 tool output，但实际 resume 不变。

### 3. Tool Schema 与 Resume 类型不一致

`lib/agent/schema.ts` 中 `ProjectEntrySchema` 和 `ResearchEntrySchema` 使用 `start` / `end` 字段；真实 `types/resume.ts` 和模板渲染使用 `date: { start, end, isCurrent? }`。同时 `EducationEntry` / `EmploymentEntry` 仍直接暴露 `start` / `end`。这会导致 AI 新增或改写日期时产生不一致结构，也让 “Present / 当前仍在进行” 这类语义无法在所有起止时间字段上统一表达。

### 4. 服务端 Resume 写入缺少串行 Rebase 保护

`commitResumeChange()` 根据当前 `current_revision` 算出 `nextRevision`，但更新时只 `.eq("id", resumeId)`。如果 AI tool、手动编辑、truncate rollback 并发写同一 resume，后写可能覆盖先写。目标语义应是：结构化 operation 可以按最新 revision 重新 apply；完整旧 `resume_json` 不能直接覆盖最新 resume。

### 5. Thread Truncate 后 Head 指针错误

前端 truncate 后用 `messages.slice(0, messageIndex)` 删除目标 user message 及之后消息，但 `headId` 被设置为 `messages[messageIndex]?.message?.id`，即刚被删除的目标 message id。应指向保留列表的最后一条消息，或空列表时为 `null`。

### 6. Chat 流式调用缺少硬边界

`streamText()` 只设置 `stopWhen: stepCountIs(5)`，没有 `abortSignal`、固定 timeout 或 max output token。模型卡住、供应商慢响应、异常长输出时会带来资源占用和用户体验风险。

### 7. Canonical Session 缺数据库唯一约束

产品约定每份 `Application Resume` 只有一个 canonical chat session，但 `resume_chat_sessions` 只有普通 index，没有 `(user_id, resume_id)` 或 `resume_id` 唯一约束。并发首次打开同一 resume 时可能创建多个 session。

## 建议方案

### 1. 提炼 AI Resume Edit Module

新建或收敛一个统一模块，拥有以下能力：

- `applyAiResumeEdit(baseResume, output, options)`
- `revertAiResumeEdit(currentResume, output, options)`
- `replayAiResumeEdits(baseResume, outputs)`
- `extractAiResumeEditOutputs(messageParts)`
- 对 `personalInfo`、entry section、section lifecycle、entry index、section order 做显式规则定义

该模块应成为 `server/ai/chat/tools/registry.ts`、`app/api/chat/truncate/route.ts`、后续 replay / snapshot 校验逻辑的共同依赖。

### 2. 扩展 Tool Output 以支持可逆操作

单独撤回的默认机制应是 inverse tool output，而不是把整份 resume 回退到旧 snapshot。对需要可逆的操作补足 metadata：

- `delete`: `originalValue` + `originalIndex` + `originalSectionOrder`
- `add`: `newEntry` + `createdSection` 或 `sectionDidNotExistBefore`
- `rewrite`: 支持 `personalInfo` 和 entry section，并保留 `originalValue`
- `reorderEntries`: 保持完整原始 id 列表和目标 id 列表
- `reorderSections`: 保持完整原始 sectionOrder 和目标 sectionOrder

需要兼容历史消息中的旧 output：对缺少 index / section metadata 的历史 rollback 做 best-effort，并在代码中显式标记兼容路径。

### 3. 区分 Agent Tool Schema 与 Domain Schema

Resume domain / persisted `resume_json` 应统一使用 canonical `DateRange`。但 agent-facing tool input 可以保留 LLM-friendly 的扁平日期输入，例如 `start` / `end` 或 `startDate` / `endDate`，避免要求模型直接生成 `isCurrent`。

服务端 tool execution 负责在 apply 前做归一化：

- 将 `"Present"` / `"current"` / `"now"` / `"至今"` / `"现在"` 等结束时间归一化为 `{ end: "", isCurrent: true }`
- 将普通结束时间归一化为 `{ end, isCurrent: false }`
- 拒绝或修正 `end` 与 `isCurrent` 互相矛盾的结构
- rollback metadata 保存归一化后的 canonical `DateRange`，而不是 agent 原始字符串

### 4. 明确 Snapshot 的角色

`resumes_snapshot` 不作为单独撤回的主机制，因为它表达的是“恢复到某个完整 revision”，会覆盖撤回目标之后发生的其他修改。snapshot 在本计划中的角色是：

- rollback 前校验：判断目标 AI 修改之后是否存在 interleaved manual edit / non-target edit
- rollback 后审计：撤回结果仍通过 `commitResumeChange()` 形成新的 revision 和 snapshot
- 兜底恢复：当旧历史 output metadata 不足以精确撤回时，提供可解释的 fallback 或人工恢复依据

默认流程应为：

1. 从目标 message 之后的成功 tool result 中提取可逆 output。
2. 按逆序对当前 authoritative resume 执行 inverse operation。
3. 用串行提交入口提交撤回后的 resume，生成新的 rollback revision / snapshot。
4. 若发现 interleaved edit 冲突且无法精确撤回，则停止并返回可恢复错误，不静默恢复整份旧 snapshot。

### 5. 服务端写入使用串行 Operation Rebase

目标不是简单地让过期 revision 全部失败，而是让可重放的结构化 operation 按数据库中的最新 resume 顺序消费。当前 AI 修改已经是 operation 模式，适合 rebase；用户手动编辑仍是完整 `resume_json` replacement，短期内应按 stale-json-conflict 保护起来。底层提交入口仍必须防止静默覆盖，但上层应区分完整 `resume_json` 写入和可重放 operation：

- 不依赖 Postgres RPC；在 TypeScript server module 中实现串行提交循环，通过读取最新 resume、条件更新 `current_revision`、失败后重读并 rebase 来防止静默覆盖。
- AI tool / rollback inverse 这类结构化 operation 后到时，应基于最新 resume 重新 apply，生成后续 revision。
- 用户手动编辑等完整 `resume_json` 写入如果基于旧 revision，默认视为 stale-json-conflict，不能直接覆盖最新 resume。
- 如果 operation 目标已被后续修改影响，无法安全 rebase，则返回 semantic-conflict。
- 同一条 AI response 内的多 tool 继续串行执行，revision 按执行顺序连续推进。

建议将并发结果分成三类：

- `operation-rebase-success`: operation 可在最新 resume 上安全重放，自动生成新 revision。
- `stale-json-conflict`: 完整 JSON 基于旧 revision，拒绝提交并要求刷新或三方 merge。
- `semantic-conflict`: operation 与后续修改触碰同一语义目标，无法安全重放或单独撤回。

### 6. Canonical Session 数据库约束

新增 migration：

- 清理现有重复 session 的处理策略：保留最新或最早 active session，其他 session 归档或合并消息。
- 增加唯一约束，建议按当前产品语义选择 `unique(user_id, resume_id)`。
- 将 `getOrCreateCanonicalSessionSummary()` 改为 upsert / insert-on-conflict，而不是先查再建。

### 7. 流式稳定性

- 给 `streamText()` 增加 request abort signal 或固定 timeout。
- 设置 max output token / max generated tokens。
- 发生 stream error 时，通过 AI SDK error part 或统一错误消息让前端进入可恢复状态。
- 保持 user / assistant message 的持久化主路径同步完成。

## 任务清单

### Phase 1: AI Edit Contract 盘点与测试复现

- [x] 盘点当前 `resumeEditorModify` / `resumeEditorReorder` input/output schema 与 `types/resume.ts` 的差异
- [x] 补充失败复现测试：`personalInfo` rewrite 后 truncate 能恢复原字段
- [x] 补充失败复现测试：连续 rewrite 同一字段后 truncate 应逆序恢复
- [x] 补充失败复现测试：delete section 最后一条 entry 后 truncate 应恢复 section 和 entry
- [x] 补充失败复现测试：delete 后恢复 entry 原始位置
- [x] 补充失败复现测试：空白简历上 AI add 不存在 section 应创建 section
- [x] 补充失败复现测试：projects / research 的 date schema 与 UI 渲染一致

Phase 1 盘点记录：

- `types/resume.ts` 中 `projects` / `research` 使用 `date: DateRange`，模板渲染读取 `block.date?.start` / `block.date?.end`；但 `lib/agent/schema.ts` 的 `ProjectEntrySchema` / `ResearchEntrySchema` 仍输出或保留 `start` / `end`，会在 tool output parse 时丢失 canonical `date`。
- `types/resume.ts` 中 `education` / `employment` 仍使用裸 `start` / `end`，与本计划 Phase 4 目标的统一 `DateRange` 尚未对齐。
- `resumeEditorModifyOutputSchema` 的 `delete` output 只保留 `originalValue`，缺少 `originalIndex` / `originalSectionOrder`，无法精确恢复删除位置或被删除的 section 生命周期。
- `resumeEditorModifyOutputSchema` 的 `add` output 只保留 `newEntry`，缺少 `createdSection` 或 `sectionDidNotExistBefore`，无法区分 add revert 后是否应移除新建 section。
- `resumeEditorReorderOutputSchema` 已保存原始和目标顺序，可支持逆向恢复；但回滚实现目前仍在 `app/api/chat/truncate/route.ts` 内私有分叉。

### Phase 2: 统一 AI Resume Edit Module

- [x] 新建统一 AI resume edit module
- [x] 迁入 `applyToolOutputToResume()` 的现有行为
- [x] 明确单独撤回默认走 inverse tool output，不走整份 snapshot 回退
- [x] 实现 `personalInfo` rewrite apply / revert
- [x] 实现 entry rewrite apply / revert
- [x] 实现 add entry 到不存在 section 时自动创建 section
- [x] 实现 add revert 时移除新增 entry，并在必要时移除新建 section
- [x] 实现 delete revert 时按原始 index 恢复 entry，并在必要时恢复 section
- [x] 实现 reorderEntries / reorderSections 的 apply / revert
- [x] 为旧历史 output 缺少 metadata 的情况保留 best-effort fallback
- [x] 为无法精确撤回的旧历史 output 返回明确错误或人工恢复提示

Phase 2 实现记录：

- 新增 `lib/resume/ai-edits.ts`，集中提供 `applyAiResumeEdit()`、`revertAiResumeEdit()`、`replayAiResumeEdits()`、`revertAiResumeEdits()` 和 `AiResumeEditError`。
- `lib/resume/mutations.ts` 的旧入口 `applyToolOutputToResume()` 已改为委托统一 module，保持现有调用方兼容。
- 默认撤回路径按 inverse tool output 执行；旧 output 缺少 `originalIndex` / section metadata 时走 best-effort，`strictRevert` 可返回明确 `AiResumeEditError`。
- Phase 3 前，`app/api/chat/truncate/route.ts` 仍未迁移到统一 module，因此 Phase 1 中的 route 级 rollback 复现仍保持红灯。

### Phase 3: 调整 Chat 调用方

- [x] `server/ai/chat/tools/registry.ts` 改为调用统一 module apply
- [x] `app/api/chat/truncate/route.ts` 改为调用统一 module revert
- [x] `server/ai/chat/history.ts` 收口 tool output 提取逻辑，避免 route 自行解释 message parts
- [x] 确认 `tool_result` event 和 assistant message parts 中保存足够 rollback metadata
- [x] truncate rollback 提交撤回结果时生成新的 revision / snapshot，而不是倒退 `current_revision`
- [x] truncate rollback 发现 interleaved edit 且无法精确撤回时，不静默恢复旧 snapshot
- [x] 修复前端 truncate 后 `headId` 指向已删除消息的问题

Phase 3 实现记录：

- `server/ai/chat/tools/registry.ts` 直接调用 `applyAiResumeEdit()`；`app/api/chat/truncate/route.ts` 调用 `revertAiResumeEdits()`，并在 rollback 保存成功后才截断消息。
- `server/ai/chat/history.ts` 新增 `extractAiResumeEditOutputs()`，旧 `extractToolOriginalValues()` 保留为兼容别名。
- `lib/agent/resume-editor-execution.ts` 为 `delete` 输出 `originalIndex` / `originalSectionOrder`，为 `add` 输出 `createdSection` / `sectionDidNotExistBefore`，并通过 tool result / streamed resume patch 持久化。
- rollback 启用 semantic conflict 检测；当当前 resume 已不匹配待撤回 tool output 时返回 `409`，且不会调用 `truncateMessages()`。
- `components/agent/chat/user-message.tsx` 将 truncate 后 `headId` 指向保留消息列表最后一条，空列表时为 `null`。

### Phase 4: Schema 与类型对齐

- [x] 制定全局日期模型迁移规则：所有表达起止时间的 resume 字段统一使用 `DateRange`
- [x] 盘点并移除 resume domain 中的裸 `start` / `end`、`start_date` / `end_date`、`startDate` / `endDate` 起止时间字段
- [x] 明确 agent-facing tool input 可以使用扁平日期字段，但 persisted domain 必须使用 canonical `DateRange`
- [x] 在 tool execution 中新增日期归一化层，将 agent 原始日期输入转换为 canonical `DateRange`
- [x] 在 rollback metadata 中保存归一化后的 `DateRange`，避免依赖 agent 原始日期字符串
- [x] 将 `EducationEntry` 从 `start` / `end` 迁移到 `date: DateRange`
- [x] 将 `EmploymentEntry` 从 `start` / `end` 迁移到 `date: DateRange`
- [x] 修正 `lib/agent/schema.ts` 中 `ProjectEntrySchema` 的日期字段结构
- [x] 修正 `lib/agent/schema.ts` 中 `ResearchEntrySchema` 的日期字段结构
- [x] 为历史 `resume_json` 增加兼容迁移或读取归一化：旧 `start` / `end` 映射到 `date`
- [x] 更新 education / employment / projects / research 相关表单、模板、缩略图和 parser，使 `isCurrent` 能统一表达当前仍在读 / 在职 / 仍在进行
- [x] 检查 publications / awards / certifications / skills schema 与 `types/resume.ts` 是否完全一致
- [x] 更新 tool examples，覆盖 personalInfo rewrite、空 section add、projects date
- [x] 更新 prompt 中对工具能力的描述，避免鼓励模型生成不支持字段

Phase 4 实现记录：

- 新增 `lib/resume/date-ranges.ts`，集中处理 legacy `start` / `end` 到 canonical `date: DateRange` 的读取归一化、当前状态解析和渲染格式化。
- `types/resume.ts` 已将 education / employment / projects / research 起止时间统一为完整 `DateRange`；`ProjectEntry.date` 也改为必填 canonical 结构。
- 表单、模板、缩略图、store、server resume 读取、commit 和 parser 均接入日期归一化；轻量 job application 查询缺少 `resume_json` 时保持原返回结构。
- `lib/agent/schema.ts` 的 date-bearing entry schema 改为 canonical `date`，并通过 `.strict()` 避免 union schema 把 project / research 误解析为 education。
- `lib/agent/resume-editor-execution.ts` 接受 agent-facing 的 `start` / `end`、`date.start` / `date.end`、`isCurrent` 等扁平输入，但输出和 rollback metadata 均保存 canonical `DateRange`。
- prompt 和 tool examples 已补充日期输入说明，避免模型生成 persisted domain 不支持的裸日期字段。
- 验证：`pnpm format:check` 通过；生产代码日期残留扫描无 `entry.start` / `entry.end` 等直接消费；改动测试集 28 个文件 / 136 个用例通过。
- `pnpm exec tsc --noEmit` 已清除 Phase 4 DateRange 迁移相关错误；仍剩既有无关测试类型问题：`components/agent/chat/resume-editor-tool.test.tsx` 的 AI SDK tool part mock shape、`server/ai/model.test.ts` 的 readonly `NODE_ENV`、`server/auth-helper.test.ts` 的 `ApiError` matcher、`server/intake/orchestrator.test.ts` 的 mock document / output 类型。

### Phase 5: Resume 写入并发保护

- [x] 设计串行 operation rebase 提交接口：输入 operation / base revision，输出 authoritative resume / current revision
- [x] 明确短期写入分类：AI tool / rollback inverse 走 operation rebase；手动编辑继续完整 `resume_json` replacement
- [x] 不依赖 Postgres RPC；在 TypeScript server module 中实现读取最新 resume、条件更新 `current_revision`、snapshot insert 的提交循环
- [x] 当条件更新因 revision 变化失败时，重读最新 resume 并尝试 rebase 可重放 operation
- [x] 为 update 成功但 snapshot insert 失败的情况设计补偿或错误处理，避免 revision / snapshot 长期不一致
- [x] AI tool 后到时基于最新 resume 重新 apply operation，而不是直接写入旧 base 上生成的完整 JSON
- [x] rollback inverse operation 后到时基于最新 resume 重新 apply inverse，并保留目标之后的其他有效修改
- [x] 手动编辑的完整 `resume_json` replacement 遇到 base revision 过期时返回 `stale-json-conflict`
- [x] operation 目标被后续修改影响时返回 `semantic-conflict`
- [x] 为 `operation-rebase-success`、`stale-json-conflict`、`semantic-conflict` 补单元测试
- [x] 手动编辑保存遇到 `stale-json-conflict` 时 refetch authoritative resume 或提示用户重试
- [x] 记录后续方向：手动编辑若要支持自动 rebase，需要另开计划将表单保存从完整 JSON replacement 改为 operation / patch intent
- [x] truncate rollback 遇到 semantic conflict 时避免继续截断消息后留下 resume 未恢复状态

Phase 5 实现记录：

- `server/resume/commit.ts` 新增 `commitResumeOperation()` 与 `ResumeCommitError`，在 TypeScript server module 中完成 read latest、operation replay、`current_revision` 条件更新、snapshot insert 和最多 3 次重试。
- `commitResumeChange()` 保留给手动编辑的完整 JSON replacement；新增 `baseRevision` 检查，过期时返回 `stale-json-conflict`，避免手动保存覆盖更新后的 authoritative resume。
- 条件更新成功但 snapshot insert 失败时，会 best-effort 将 `resumes.resume_json` / `current_revision` 回滚到上一 revision，并抛出 `snapshot-insert-failed`，避免静默留下长期 revision / snapshot 不一致。
- AI tool 写入改为通过 `commitResumeOperation()` 执行；每次重试都会在最新 authoritative resume 上重新执行 tool intent 并生成 output，因此 rollback metadata 的 `originalValue` 来自实际写入前的最新值。
- truncate rollback 改为通过 `commitResumeOperation()` 在最新 resume 上执行 inverse operation；semantic conflict 会返回 `409`，且不会继续 `truncateMessages()`。
- 手动编辑保存仍走完整 replacement，但 `useApplicationResume()` 会传当前 `application.resume.current_revision` 作为 `baseRevision`；当前 UI 对 stale save 仍显示保存失败 toast，后续若要自动 rebase 手动表单，需要另开计划把表单保存改为 operation / patch intent。
- 验证：`pnpm format:check` 通过；改动回归集 28 个测试文件 / 140 个用例通过，覆盖 operation rebase success、stale-json-conflict、semantic-conflict、AI output metadata rebase、rollback conflict 不截断消息。
- `pnpm exec tsc --noEmit` 没有新增 Phase 5 类型错误；仍剩既有无关测试类型问题：`components/agent/chat/resume-editor-tool.test.tsx` 的 AI SDK tool part mock shape、`server/ai/model.test.ts` 的 readonly `NODE_ENV`、`server/auth-helper.test.ts` 的 `ApiError` matcher、`server/intake/orchestrator.test.ts` 的 mock document / output 类型。

### Phase 6: Canonical Session 唯一性

- [ ] 写 migration 处理已有重复 `resume_chat_sessions`
- [ ] 增加 `unique(user_id, resume_id)` 约束或等价唯一 index
- [ ] 将 `getOrCreateCanonicalSessionSummary()` 改为 upsert / on conflict 流程
- [ ] 补并发创建 canonical session 的测试
- [ ] 确认归档 session / 删除 session 不破坏 canonical session 获取语义

### Phase 7: Stream 稳定性与 Token 统计

- [ ] 为 `streamText()` 增加 request abort signal 或固定 timeout
- [ ] 为 `streamText()` 设置 max output token
- [ ] 将 stream error 映射为前端可显示、可重试的错误消息
- [ ] 评估 `updateSessionTokenUsage()` 是否应从 fire-and-forget 改为 awaited 或重试队列
- [ ] 修复 `/api/chat-sessions/[id]/messages` 忽略 `limit` query 的假契约，或删除前端参数
- [ ] 确认 message count 是否需要过滤 `truncated = false`

### Phase 8: 回归与文档

- [ ] 更新 `docs/specs/ai-chat-system.md` 的 rollback / edit contract 描述
- [ ] 更新相关 current plan 状态，避免重复追踪同一问题
- [ ] 跑 chat 相关 vitest 套件
- [ ] 跑 resume mutation / template schema 相关 vitest 套件
- [ ] 按 `docs/playwright-session-testing-guide.md` 对 AI Chat 主流程做 targeted UI 回归

## 测试计划

### 单元测试

- [ ] AI edit module round-trip: apply -> revert 后深相等
- [ ] 单独撤回 AI 修改时保留后续手动编辑
- [ ] `personalInfo` rewrite round-trip
- [ ] entry rewrite round-trip
- [ ] delete first / middle / last entry round-trip
- [ ] delete 最后一条 entry 后恢复 section round-trip
- [ ] add 到已有 section round-trip
- [ ] add 到不存在 section round-trip
- [ ] reorderEntries / reorderSections round-trip
- [x] education / employment / projects / research 均使用 `DateRange` 作为起止时间模型
- [x] agent-facing 扁平日期输入能 normalize 成 canonical `DateRange`
- [x] projects / research date schema parse 与模板消费一致
- [x] `DateRange.isCurrent` 在 education / employment / projects / research 中能正确解析、编辑、渲染为 Present
- [x] resume 写入覆盖 `operation-rebase-success`、`stale-json-conflict`、`semantic-conflict`
- [ ] canonical session 并发创建

### 组件测试

- [ ] `UserActionBar` truncate 后 thread messages 和 `headId` 一致
- [ ] Chat patch version conflict 后 refetch authoritative resume
- [ ] Chat pending action 在 thread ready 后只消费一次

### API 测试

- [ ] `/api/chat/resume` tool success 持久化完整 rollback metadata
- [ ] `/api/chat/resume` tool failure 持久化 AI SDK error parts
- [ ] `/api/chat/truncate` 对 personalInfo / add / delete / reorder 均返回正确 authoritative resume
- [ ] `/api/chat-sessions/[id]/messages` limit 行为与契约一致

### UI 回归

- [ ] 发送普通聊天消息，assistant 正常回复
- [ ] 让 AI 改写 personalInfo，画布更新，撤回后恢复
- [ ] 让 AI 新增不存在 section，画布出现新 section，撤回后移除
- [ ] 让 AI 删除最后一个 entry，section 消失，撤回后恢复原 section 和顺序
- [ ] 手动编辑与 AI 编辑冲突时，前端不会静默丢数据
- [ ] token 余额更新与 token usage 面板保持一致

## 风险

- 历史 chat message parts 已持久化旧 tool output，rollback metadata 不完整；需要明确 best-effort 兼容边界。
- 旧 snapshot 只能表达完整 revision，不能直接满足单独撤回；误用会覆盖目标修改之后的其他有效编辑。
- 串行 operation rebase 引入后，部分原本静默覆盖的并发写会变成显式 conflict，需要前端提供可理解的恢复路径。
- 数据库唯一约束上线前需要处理重复 session，否则 migration 可能失败。
- AI tool schema 调整可能影响模型工具调用成功率，需要同步更新 prompt examples 和测试 fixture。

## 并行执行建议

- Agent A：负责 AI edit module 和 round-trip 单测。
- Agent B：负责串行 operation rebase / stale-json conflict、canonical session migration 和 API 测试。
- Agent C：负责前端 truncate headId、stream error 展示和组件测试。
- Agent D：负责 Playwright targeted regression，验证 AI Chat 主流程和撤回路径。

## 验收标准

- AI edit apply / revert / replay 由统一模块拥有，truncate route 不再维护独立回滚规则
- 单独撤回某条 AI 修改时，目标修改之后发生的其他有效修改会被保留
- Snapshot 仅用于校验、审计和兜底，不作为默认的整份 resume 回退机制
- personalInfo rewrite、add missing section、delete last entry、reorder 等场景均可 apply -> revert 后恢复原 resume
- 所有起止时间字段统一为 `DateRange`，不再在 resume domain 中新增裸 `start` / `end` 或 `start_date` / `end_date`
- projects / research tool schema 与 `types/resume.ts` 和模板渲染一致
- 并发 resume 写入不会静默覆盖；可安全重放的 operation 会顺序生成后续 revision，无法安全重放时有明确 conflict 和恢复路径
- 每个 user/resume 只能拥有一个 canonical chat session
- Chat stream 有 timeout / output limit，异常时前端可见且可重试
- 相关 vitest 和 targeted UI 回归通过
