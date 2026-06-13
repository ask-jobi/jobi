# AI SDK 集成 deepening 与边界收敛

**Date:** 2026-05-23
**Status:** 已完成 — 归档日期：2026-06-01

> **实际落地要点：**
> - 四个实现阶段全部完成并通过 96 file / 503 test
> - `resumes.current_revision + resumes_snapshot` 数据模型建立
> - Chat server-authority cutover：服务端 tool 执行 + transient patch 下发 + 前端消费者切换
> - Contract boundary cleanup：schema 收口到 `lib/agent/schema.ts`，server-only 模块迁入 `server/ai/`
> - Provider/parser consistency：gateway-first 策略落地，parser 死代码清理，token 口径修正
> - 版本冲突检测 + authoritative refetch（主计划补项）
> - `chat_events.event_data` zod schema 校验（主计划补项）
>
> **已知尾项（已记录）：** Playwright E2E 回归由独立计划 `playwright-e2e-coverage-expansion.md` 覆盖
>
> 实际实施按下列 phase plans 推进（均已归档）：
> - `docs/plans/archive/2026-05-23-ai-sdk-phase-1-resume-revision-foundation.md`
> - `docs/plans/archive/2026-05-23-ai-sdk-phase-2-chat-server-authority-cutover.md`
> - `docs/plans/archive/2026-05-23-ai-sdk-phase-3-chat-contract-boundary-cleanup.md`
> - `docs/plans/archive/2026-05-23-ai-sdk-phase-4-provider-parser-consistency.md`

## 背景

本计划用于收敛当前 `ai` / `@ai-sdk/*` 集成中的边界问题，并把前后端、持久化、tool contract、鉴权和模型配置上的决策显式化。

当前系统已经形成两条 AI 主链路：

- `server/ai/*`：简历解析、评估、局部改写等服务端 AI 能力
- `lib/agent/*` + `app/api/chat/resume/route.ts` + `components/agent/*`：基于 AI SDK 的聊天与 tool 调用链路

代码审查结论：

- `server/ai/*` 内聚性整体尚可，职责按“解析 / 评估 / 改写 / prompt / 文档提取”拆分，方向基本合理
- chat / tool 调用链路可以工作，但模块边界不够干净，存在 API 合约失真、鉴权遗漏、状态一致性不足、类型层反向依赖运行时 registry 等问题
- `token` 配额中的“回复超过剩余额度时不扣费”在本项目中视为**产品层面的软上限设计**，不是本计划要修复的缺陷

## 目标

- 明确 AI SDK 聊天链路的权威执行边界（前端执行 / 服务端执行 / 混合执行）
- 修复 chat 与 rewrite 入口上的鉴权和 ownership 缺口
- 让 tool contract 与真实可执行的数据变更能力保持一致
- 收敛 `lib/agent/*`、`types/chat.ts`、`server/ai/*` 之间的职责边界
- 明确模型 provider / 环境变量 / devtools 的配置策略
- 为后续实现形成逐步可执行的决策记录与任务清单

## 非目标

- 不在本计划中直接替换现有 LLM 供应商
- 不在本计划中引入完整的 observability 平台
- 不把软上限 token 策略改为硬拦截策略
- 不重写整个 chat session 数据模型
- 不讨论 prompt 文案质量本身，仅讨论 prompt 的组织方式与边界

## 已确认决策

- `token` 配额中的“超额回复不扣费”保留为软上限产品设计，不按漏洞处理
- 讨论范围聚焦 `ai` / `@ai-sdk/*` 集成边界，不扩大到整个订阅与计费系统
- 任何后续实现都必须先把 plan 中未决设计项逐个定案，再进入代码修改
- Phase 1 明确限定为 chat-only：先做 chat authority / snapshot / patch / rollback / contract；`rewrite-entry` 等非 chat AI 入口后置
- 对会修改 persisted resume 的 chat tool，当前态权威落在服务端；前端不做 optimistic commit，只消费流式结果更新 UI
- chat 中的 tool output 退回“解释/展示层”；真正的 authoritative resume 变化通过 AI SDK streaming data 单独下发
- authoritative patch 采用领域级 typed patch，由服务端 mutation engine 在持久化成功后生成；前端若发现 `baseVersion` 不匹配，则拒绝应用并触发 authoritative refetch
- 当前态仍保存在 `resumes.resume_json`；新增 `resumes_snapshot` 作为 append-only 历史与 revision 来源
- `resumes_snapshot` 记录完整 resume snapshot、revision 与变更元数据；所有 committed persisted resume 变更（AI、手动编辑、回滚）都进入 snapshot 历史
- 项目尚未上线，本轮不保留兼容层；直接切到新链路。当前已有旧 `resumes` 数据不做 backfill，也不保证兼容
- 共享 type 放在 `types/`，共享 zod schema 唯一来源放在 `lib/agent/schemas/`；`types/chat.ts` 不再通过 `InferUITools<typeof tools>` 依赖 runtime registry
- `personalInfo` rewrite 仅允许改写当前 schema 中已存在字段；对不存在 section 的 `add` 正式支持自动建 section，并遵循现有 canonical order / `addSection` 规则落位
- chat 触发的 snapshot 仅关联已成功持久化后的 `tool_result` 事件；`tool_call` / `tool_result` / `tool_failed` / `summary_checkpoint` / `rollback` 构成 chat-only Phase 1 的最小事件集合
- `tool_call.event_data = { toolCallId, toolName, input }`；`tool_result.event_data = { toolCallId, toolName, output }`；`tool_failed` 独立持久化，不关联 snapshot
- `tool_result` 仍进入 assistant message history 作为用户可见的解释记录；authoritative patch 仅通过 transient streaming data 下发，不进入 `message.parts`
- authoritative patch 仅服务 AI tool mutation，至少携带 `baseVersion`、`nextVersion`、`snapshotId`、`messageId` 与 patch body；前端在 `onData` 中同步应用，版本不连续时触发 authoritative refetch
- 前端 persisted resume state 从首次加载起就并列保存 `current_revision`，不把 revision 塞进 `resume_json`；页面重进时只从 authoritative `resume_json + current_revision` 重建，不回放历史 patch
- AI 运行期间继续保持 UI 级编辑锁；只有在 chat 流 finish 且 `pendingPatchCount===0`、没有未完成冲突恢复时才释放
- 对同一 assistant message 内“部分 tool 成功、部分失败”的混合结果正式支持：成功的照常提交 snapshot/patch，失败的写 `tool_failed` 并通过 transient error part 通知前端
- 当前阶段暂不把事务/RPC 与失败补偿纳入 Phase 1；Phase 1 仅覆盖成功路径
- chat 专用 runtime registry 迁到 `server/ai/chat/tools/registry.ts`；`repairToolCall` 先移除；`server-only` agent/chat 模块系统性迁到 `server/ai/chat/*` 等 server 语义目录
- `chat_events.event_data` 在写入前使用 zod schema 校验；相关 schema 暂统一收敛到 `lib/agent/schema.ts`
- authoritative patch 以 `snapshotId` 作为稳定 id；每个成功的 AI resume mutation 单独提交一次 snapshot/revision，并 1:1 下发一个 transient patch
- 前端 authoritative patch 直接复用 `lib/resume/mutations.ts` 上层新增的 patch dispatch；chat 主链路移除 `applyToolOutputToResume(...)` 和前端 tool executor 的主路径角色
- tool targeting 继续使用显式 `entryId` / section key / field key；`field` 改为按 section 做白名单/枚举约束；服务端在提交前做最终适用性校验，校验失败记 `tool_failed`
- 手动编辑 Phase 1 继续提交完整 `nextResume`，不改成命令模型；但保存接口改为返回 authoritative `{ resume, currentRevision }`，前端必须以返回值替换本地 persisted state
- 手动编辑不携带 `expectedRevision`，继续采用 last-writer-wins；检测到并发时，通过提交后返回的 `currentRevision` 跳变来覆盖本地状态并提示已刷新
- `current_revision` 挂在 `JobApplication.resume.current_revision`，所有正式“当前 resume”读路径都要返回它；前端 store 并列保存该值，不公开 `current_snapshot_id`
- `current_revision` 直接存放在 `resumes` 表；`resumes_snapshot` 至少建立 `(resume_id, revision)` 唯一索引和 `event_id` 普通索引
- 手动编辑与 rollback 成功后同样返回 authoritative `{ resume, currentRevision }`；rollback 仍走独立接口，不复用 authoritative patch union，summary 恢复保持纯服务端内部处理
- 任何 committed resume 变化都置 `evaluation_report_refresh_flag=true`；rollback 也不例外
- `resume_json` 无实际变化时不推进 revision、不写 snapshot；no-op 以原始 `ResumeData` 做结构化深比较判定，不做额外 normalize
- 只要产生并执行了 AI resume tool call，就假定一定会导致 `resume_json` 变化；Phase 1 运行时不额外校验这一不变量
- provider 策略定为 gateway-first；文档只承认 gateway-first 为正式路径，手改 `model.ts` 直连 provider 仅视为临时本地调试手段；`@ai-sdk/devtools` 在所有非 production 环境默认启用
- `resume-parser` 删除虚假的 fallback 叙述与死代码，只保留结构化解析真实路径
- 前端错误展示优先复用 AI SDK 原生 `tool-error` / `error` parts；`chat_events.tool_failed` 仅持久化归一化最小结构 `{ toolCallId, toolName, errorCode, message }`，Phase 1 暂不细分 `errorCode`
- `resumeEditorModify` / `resumeEditorReorder` 启用 `strict: true`（provider 支持时生效），并补少量代表性 `inputExamples`
- tool 业务事件不依赖 AI SDK lifecycle callbacks；仍由自定义 server-side execute / commit 编排显式落库
- assistant/tool 历史消息尽量以 AI SDK 完成态消息为主；assistant message history 直接采用 AI SDK 原生 tool result part 形态，`resume_chat_messages.parts` 也尽量原样持久化 AI SDK message parts
- 保留固定 `stopWhen: stepCountIs(5)` 作为 Phase 1 的硬上限
- `abortSignal` 显式贯穿到 tool execute 与可中断的后续链路，至少覆盖长时间运行的外部 IO / tool 执行
- reasoning parts 先保留现状，仅修正 token 统计口径，不顺手改变对话体验
- system prompt 中明确保留 `entryId`，并显式写出 tool contract 边界（已知字段、缺失 section 可自动创建、field 白名单等）
- 多步循环失败行为不额外加 prompt 约束；先完全交给 AI SDK 默认机制与 `stepCountIs(5)` 收敛
- assistant tool result 渲染继续保留现有按 `toolName` 分发的方式；`ResumeEditorToolUI` 继续消费当前 modify/reorder 的结构化 output discriminated union
- `POST /api/chat/resume` 在 route 入口显式执行 `verifyOwnership(sessionId, user.id)`，同时继续依赖 Supabase 用户态/RLS 做底层保护
- 若旧数据缺少 `current_revision`，Phase 1 不额外做 server-side guard，允许在前端 store / 页面初始化处自然失败暴露问题
- Phase 1 不改 prompt 中 `resume` 的现有 `JSON.stringify(resumeData)` 表示方式，只在其基础上继续补 tool contract 说明
- `getEntrySchema` 与各 section entry schema 迁入 `lib/agent/schema.ts`；按 section 的字段白名单/枚举也从同一份 schema 派生，不再手写第二份列表
- 会修改数据的 tool Phase 1 不引入 `needsApproval`；先完成服务端权威提交链
- `tool_failed` 事件 `errorCode` Phase 1 暂统一使用 `internal_error`
- 对应 assistant history 里的错误展示完全复用 AI SDK 原生 `tool-error` / `error` parts，并以内联错误块形式呈现；这些错误 parts 也随 `resume_chat_messages.parts` 一起持久化
- conversation summary 会纳入失败事实，但只压缩为简短失败记录，不把原始错误细节塞进 summary
- truncate/rollback 计算目标 resume revision 时完全忽略 `tool_failed`
- `tool_call`/`tool_result`/`tool_failed` 仍由自定义 server-side execute / commit 编排落库，不依赖 AI SDK lifecycle callbacks
- `useChat({ onToolCall })` 客户端执行逻辑从主链路完全移除；客户端只消费 AI SDK 流与 authoritative patch
- `pendingPatchCount` 放在现有 chat/thread lifecycle store 中，表示“已收到但尚未完成应用/冲突恢复的 patch 数量”
- `DefaultChatTransport.prepareSendMessagesRequest` 继续只发送最新 message + session id；服务端负责重建上下文
- 标题生成、conversation summary、session token usage 聚合等非关键副作用继续异步非阻塞，不并入 authoritative 主路径
- chat 上下文重建继续沿用 `summary checkpoint + 最近消息窗口`，与 `resume snapshot/revision` 保持两条独立压缩链
- `resumeEditorModify` / `resumeEditorReorder` 视为稳定 toolName，Phase 1 不顺手重命名
- authoritative patch 的 transient data part type 名称固定为 `data-resume-patch`
- AI chat patch 成功应用到前端本地状态时，本地立即把 `evaluation_report_refresh_flag` 置为 `true`；保存/rollback/patch 响应不额外携带该 flag，由前端按 committed resume 已变这一规则推断
- `server/resume/commit.ts` 统一要求调用方传入已验证的 user context，并在 commit 层再次校验目标 resume 归属
- `POST /api/chat/resume` 中 user message 持久化改为主路径同步完成；assistant 完成态 message（含文本、tool result、tool-error/error parts）持久化也属于主路径同步完成
- 实施时优先复用当前已存在的稳定实现与渲染方式，只在边界不成立或 contract 失真处做必要替换，不顺手重写整条链路
## Deferred / Follow-up

- `app/api/resume/rewrite-entry/route.ts` 不纳入 chat-only Phase 1；后续是否并入同一条 `resumes + snapshot + revision` 提交链路，留待后续计划再决策
- `resumes.resume_json`、`resumes_snapshot`、`chat_events` 的事务原子性、失败补偿与 RPC 封装后置；当前 Phase 1 明确不保证这部分
- `/api/chat-sessions/[id]/messages` 的 `limit` 假契约本轮不修；继续视为已知后续项
- 手动编辑不向 UI/聊天层发 authoritative patch，但仍要复用同一条 `resumes + snapshot + revision` 提交链路
- 当前已有旧数据若缺少 `current_revision` / snapshot，读路径不做兼容初始化；是否报错由运行时异常自然暴露，自动化测试也不专门覆盖这条失败路径
## 风险

- Phase 1 明确只覆盖成功路径，不保证 `resumes.resume_json`、`resumes_snapshot`、`chat_events` 的事务原子性；真实失败补偿留到后续计划
- 手动编辑继续 last-writer-wins，不做 `expectedRevision` 乐观并发控制；多标签页/多终端并发下只在提交后通过 revision 跳变覆盖本地状态
- 当前已有旧 `resumes` 数据不兼容新链路；命中旧数据时可能在运行时异常处暴露，而不是获得专门迁移体验

## 相关计划

- `docs/plans/current/2026-05-20-ai-subsystem-defect-fixes.md`
- `docs/plans/current/2026-05-21-chat-session-application-resume-edit-deepening.md`
- `docs/app-architecture.md`
- `CONTEXT.md`

## 代码现状

### 核心文件

| 文件 | 当前职责 | 主要问题 |
|---|---|---|
| `lib/agent/model.ts` | 模型实例与 devtools 包装 | provider 策略与 `.env.example` 契约漂移 |
| `lib/agent/tools.ts` | tool registry、输入输出 schema、entry schema、repair hook | 运行时 registry 与共享 contract 混杂 |
| `types/chat.ts` | Chat UI message / tool type / data part type | 反向依赖 `lib/agent/tools.ts` |
| `app/api/chat/resume/route.ts` | 聊天主入口、上下文拼接、stream、持久化、token 统计 | ownership 未校验，职责过重 |
| `components/agent/chat-interface.tsx` | `useChat` 接入、tool call 执行、与本地 resume 持久化衔接 | 多 tool call 时可能基于陈旧快照 |
| `components/agent/chat/resume-editor.ts` | 本地执行 tool input → output | 与真正 mutation 能力不完全一致 |
| `lib/resume/mutations.ts` | tool output 应用到 resume 数据 | `personalInfo` rewrite / 空 section add 未完整承接 |
| `app/api/resume/rewrite-entry/route.ts` | 简历局部 AI 改写 API | 缺少统一鉴权 / ownership / schema 约束 |
| `server/ai/resume-parser.ts` | 简历结构化解析 | fallback 叙述与真实实现漂移 |
| `server/ai/resume-evaluator.ts` | 简历评估 | 本身边界较清晰 |
| `server/ai/resume-entry-rewriter.ts` | 单段内容改写 | 本身边界较清晰 |

### 当前主要缺口

1. Chat 主入口与 rewrite 入口的 trust boundary 不统一
2. Tool schema 声称支持的操作，不等于 mutation 层真实能落地的操作
3. Client tool execution 与 canonical persisted resume 之间缺少明确的权威来源定义
4. 类型层依赖运行时 tool registry，导致 shared contract 不独立
5. provider / env / devtools 策略已定，但代码与文档仍需按新方案收敛
6. `resume-parser` 中存在“宣称 fallback、实际 rethrow”的漂移

## 目标结构

### 1. 模块边界

#### Server-only 模块迁移

- `lib/agent/model.ts` 迁到 `server/ai/model.ts`
- `lib/agent/chat-history.ts`、标题生成、summary 等 `server-only` 模块系统性迁到 `server/ai/chat/*`
- chat 专用 AI SDK runtime registry 迁到 `server/ai/chat/tools/registry.ts`
- `repairToolCall` 先移除，不保留无语义 no-op hook

#### 共享 contract 边界

- 共享 zod schema 先统一收敛到 `lib/agent/schema.ts`
- 公开 type 先继续暴露在 `types/chat.ts`
- `types/chat.ts` 不再通过 `InferUITools<typeof tools>` 反向依赖 runtime registry
- `chat_events.event_data`、tool contract、stream data contract、authoritative patch contract 统一由共享 schema 驱动

### 2. 数据模型变更

#### `resumes` 表

新增：

- `current_revision`

语义：

- 表示当前 authoritative `resume_json` 对应的 revision
- 读取当前 resume 时以 `resumes.resume_json + resumes.current_revision` 作为唯一当前态来源

#### `resumes_snapshot` 表

每条记录保存：

- `resume_id`
- `revision`
- 完整 `resume_json` snapshot
- `event_id`（chat 触发时关联到 `chat_events.id`；非 chat 路径可为空）
- 变更元数据（至少包含 `created_at`；其余由后续实现按已确认决策补齐）

约束与索引：

- `(resume_id, revision)` 唯一
- `revision` 对同一 `resume_id` 单调递增
- `event_id` 普通索引

语义：

- append-only 历史
- 所有 committed persisted resume 变更都写入 snapshot
- 当前项目未上线，不做旧数据 backfill；旧数据不保证兼容

#### `chat_events` taxonomy

Phase 1 最小集合：

- `tool_call`
- `tool_result`
- `tool_failed`
- `summary_checkpoint`
- `rollback`

event_data 形态：

- `tool_call = { toolCallId, toolName, input }`
- `tool_result = { toolCallId, toolName, output }`
- `tool_failed = { toolCallId, toolName, errorCode, message }`
- `rollback` 至少记录 `fromRevision`、`toRevision`（`targetMessageId` 已有）

### 3. API / 读模型 contract 变化

#### 当前 resume 正式读路径

所有返回当前 resume 的正式读路径都扩为返回：

- `resume.resume_json`
- `resume.current_revision`

其中：

- `current_revision` 挂在 `JobApplication.resume.current_revision`
- 不公开 `current_snapshot_id`
- 前端 store 并列保存 `current_revision`，不把 revision 塞进 `resume_json`

#### Chat authoritative patch

仅 AI chat mutation 使用 transient streaming data 下发 authoritative patch。

patch 规则：

- 1 个成功 mutation = 1 个 revision = 1 个 snapshot = 1 个 transient patch
- patch 稳定 id 使用 `snapshotId`
- patch 至少携带：
  - `snapshotId`
  - `messageId`
  - `baseVersion`
  - `nextVersion`
  - patch body

patch body Phase 1 最小集合：

- `rewriteField`
- `addEntry`
- `deleteEntry`
- `reorderEntries`
- `reorderSections`

`rollback` 不复用 patch union，继续走独立接口。

#### 手动编辑保存接口

Phase 1 继续提交完整 `nextResume`，不改成命令模型。

保存成功后必须返回 authoritative：

- `{ resume, currentRevision }`

前端必须：

- 以服务端返回的 `resume` 替换本地 persisted state
- 以服务端返回的 `currentRevision` 更新本地 revision

#### Rollback 接口

rollback 成功后返回 authoritative：

- `{ resume, currentRevision }`

前端直接替换本地 persisted state。
summary 恢复保持纯服务端内部处理，不额外返回给前端。

### 4. 成功路径时序

#### Chat tool 成功路径

1. 模型产出可确认的 tool call
2. 持久化 `chat_events.tool_call`
3. 服务端基于当前 authoritative resume 做适用性校验
4. 执行领域 mutation
5. 更新 `resumes.resume_json`
6. 推进 `resumes.current_revision`
7. 写入 `resumes_snapshot`
8. 持久化 `chat_events.tool_result`
9. 更新 assistant message history 中的 tool result part
10. 通过 transient streaming data 下发 authoritative patch
11. 前端在 `onData` 中同步 apply patch，并把本地 `current_revision` 推进到 `nextVersion`
12. chat 流结束且 `pendingPatchCount===0`、无未完成冲突恢复后，释放 AI 编辑锁

#### Chat tool 失败路径

1. tool call 已产生并落 `tool_call`
2. 服务端适用性校验失败或提交失败
3. 持久化 `chat_events.tool_failed`
4. 不写 snapshot
5. 不下发 authoritative patch
6. 通过 transient error part 通知前端
7. assistant message 不追加成功型 tool result part

#### 手动编辑成功路径

1. 前端生成完整 `nextResume`
2. 提交到服务端保存接口
3. 服务端更新当前 authoritative resume，并推进 revision / snapshot
4. 返回 authoritative `{ resume, currentRevision }`
5. 前端替换本地 persisted state

### 5. 并发与一致性边界

#### Chat 路径

- AI 运行期间保持 UI 级编辑锁
- patch 若发现 `baseVersion` 与本地 `current_revision` 不连续，则拒绝应用并触发 authoritative refetch
- 同一 assistant message 内允许部分 tool 成功、部分失败

#### 手动编辑路径

- 不携带 `expectedRevision`
- 继续 last-writer-wins
- 如果提交后发现返回的 `currentRevision` 相对本地起始 revision 发生跳变，则覆盖本地状态并提示“检测到其他地方的修改，已刷新”

#### no-op 规则

- `resume_json` 无实际变化时不推进 revision、不写 snapshot
- no-op 以原始 `ResumeData` 做结构化深比较判定
- Phase 1 不做额外 normalize
- Phase 1 假定：只要产生并执行了 AI resume tool call，就一定会导致 `resume_json` 变化；运行时不额外校验这一不变量

### 6. 实施步骤

#### Phase 1: 数据模型与读模型

- [x] 为 `resumes` 增加 `current_revision`
- [x] 新增 `resumes_snapshot` 表与必要索引
- [x] 为 `chat_events` 补齐 `tool_call` / `tool_result` / `tool_failed` / `rollback` 所需 schema
- [x] 扩展所有正式“当前 resume”读路径，返回 `resume.current_revision`
- [x] 更新 `types/resume.ts` 与前端 store，承接 `resume.current_revision`

#### Phase 2: 共享 contract 与模块迁移

- [x] 新增 `lib/agent/schema.ts`，集中共享 zod schema
- [x] 将 `types/chat.ts` 改为从共享 schema 派生公开类型
- [x] 迁移 `server-only` agent/chat 模块到 `server/ai/chat/*`
- [x] 将 chat runtime registry 迁到 `server/ai/chat/tools/registry.ts`
- [x] 移除 `repairToolCall`

#### Phase 3: Chat mutation pipeline

- [x] 新增 `server/resume/commit.ts` 作为 resume 提交编排入口
- [x] 新增 `server/resume/snapshots.ts` 作为 snapshot 底层写入 helper
- [x] 抽出 chat tool execution / applicability validation / commit 流程
- [x] 下发 transient authoritative patch
- [x] 前端在 `onData` 中消费 patch 并推进 `current_revision`
- [x] 从 chat 主链路移除 `applyToolOutputToResume(...)`
- [x] 从 chat 主链路移除前端 tool executor；若无合法剩余用途则删除

#### Phase 4: 手动编辑与 rollback 收口

- [x] 将手动保存接口改为返回 authoritative `{ resume, currentRevision }`
- [x] 手动编辑成功后以前端覆盖 authoritative 返回值为准
- [x] rollback 接口改为返回 authoritative `{ resume, currentRevision }`
- [x] rollback 后仍置 `evaluation_report_refresh_flag=true`

#### Phase 5: 验证与回归

- [x] 补齐单元 / 组件 / API 测试
- [x] 执行 chat/edit/rollback 主流程 Playwright 回归
- [x] 检查 gateway-first 文档与代码路径一致

## 测试计划

### 单元 / 组件测试

- [x] authoritative patch dispatch 复用 `lib/resume/mutations.ts` 的行为测试
- [x] `personalInfo` rewrite 仅允许当前 schema 已知字段
- [x] 空 section `add` 自动创建 section 并按 canonical order 落位
- [x] `chat_events.event_data` schema 校验测试
- [x] `resume_json` 无变化时不推进 revision / 不写 snapshot
- [x] provider 配置仅覆盖 gateway-first 正式路径
- [x] `resume-parser` 仅保留结构化解析路径的测试

### API / 集成测试

- [x] `POST /api/chat/resume` ownership 校验测试
- [x] 单 tool 成功：写 `tool_call` / `tool_result` / snapshot / patch
- [x] 多 tool 串行成功：revision 连续推进、patch 连续应用
- [x] 部分成功部分失败：成功的有 snapshot/patch，失败的写 `tool_failed`
- [x] patch version 冲突触发 authoritative refetch
- [x] 手动保存返回 authoritative `{ resume, currentRevision }`
- [x] rollback 返回 authoritative `{ resume, currentRevision }`
- [x] truncate/rollback 恢复到 baseline 与中间 revision
- [x] 流式错误通过 transient error part 传递

### 回归检查

- [x] 进入 resume chat，触发 AI 修改，看到 tool 解释与状态落地
- [x] 同一 session 内多次 AI 修改后 resume 与 revision 正常推进
- [x] 执行 truncate/rollback 后 resume 与历史恢复正确
- [x] 手动编辑保存后本地状态以 authoritative 返回值为准
- [x] gateway-first 配置在正式路径上可正常工作

## 验收标准

- chat-only Phase 1 的权威执行边界、数据模型与模块边界都被落实到代码结构中
- 所有正式“当前 resume”读路径都返回 `resume.current_revision`
- AI chat mutation 通过 snapshot/revision/event/patch 串成单一成功路径
- 手动编辑与 rollback 都返回 authoritative `{ resume, currentRevision }`
- `tool_call` / `tool_result` / `tool_failed` / `rollback` 事件结构明确且受 schema 约束
- `tool schema` 与真实 mutation 能力不存在声明/实现不一致
- `rewrite-entry` 已明确排除在 chat-only Phase 1 外，不再混入本轮测试与验收
- provider / env / devtools 策略在文档与代码中一致
- `resume-parser` 不再存在“声称 fallback、实际没有”的漂移
- 所有新增与受影响测试通过
