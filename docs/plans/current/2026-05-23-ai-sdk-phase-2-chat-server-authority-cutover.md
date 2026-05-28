# AI SDK Phase 2：Chat Server Authority Cutover

**Date:** 2026-05-23

## 背景

在 Phase 1 建立 `resume_json + current_revision + resumes_snapshot` 之后，chat 主链路仍保留现有“前端消费 tool call 并本地修改 resume”的路径。这个边界会继续带来：

- tool contract 与真实 mutation 能力脱节
- chat 期间的本地陈旧快照问题
- 回滚、审计、消息历史三套语义并行

本阶段的目标是把 chat 主链路切到**服务端 authoritative tool execution + transient patch 下发**，并保证完成后应用仍可正常运行。

## 目标

- 将 chat resume tool 执行权切到服务端
- `POST /api/chat/resume` 显式做 ownership 校验
- assistant/user message 持久化切为主路径同步完成
- authoritative patch 通过 `data-resume-patch` transient data 下发给前端
- 前端移除 `onToolCall` 主路径，只消费 AI SDK 流与 patch

## 非目标

- 本阶段不迁移 server-only 模块目录
- 本阶段不重命名 toolName
- 本阶段不处理 `rewrite-entry`
- 本阶段不引入 approval flow
- 本阶段不处理事务原子性与失败补偿

## 已确认决策

- 服务端 authoritative，前端不做 optimistic commit
- `resumeEditorModify` / `resumeEditorReorder` 保持稳定 toolName
- `tool_call` / `tool_result` / `tool_failed` 由自定义 execute/commit 编排落库
- assistant history 使用 AI SDK 原生 tool result / tool-error / error parts
- 错误展示优先复用 AI SDK 原生 `tool-error` / `error` parts
- `DefaultChatTransport.prepareSendMessagesRequest` 继续只发送最新 message + session id
- `stopWhen: stepCountIs(5)` 继续保留
- `pendingPatchCount` 放在现有 chat/thread lifecycle store

## 相关计划

- 前置阶段：`docs/plans/current/2026-05-23-ai-sdk-phase-1-resume-revision-foundation.md`
- 总览：`docs/plans/current/2026-05-23-ai-sdk-integration-deepening.md`
- 后续阶段：`docs/plans/current/2026-05-23-ai-sdk-phase-3-chat-contract-boundary-cleanup.md`

## 建议方案

### 1. 先把 server-side tool execution 串起来

在 server registry 中为 `resumeEditorModify` / `resumeEditorReorder` 提供服务端执行实现：

- 适用性校验
- resume 提交
- snapshot 推进
- `tool_call` / `tool_result` / `tool_failed` 事件记录

### 2. 再切前端为纯消费者

前端移除 `useChat({ onToolCall })` 主路径执行逻辑，改为：

- 渲染 AI SDK 原生 tool parts
- 在 `onData` 中消费 `data-resume-patch`
- 推进本地 `resume_json + current_revision`
- 依据 `pendingPatchCount===0` 释放 AI 锁

### 3. 保持现有渲染体验

- `ResumeEditorToolUI` 继续按 `toolName` 分发
- `output` 继续沿用当前 modify/reorder discriminated union
- reasoning parts 继续保留，先只修正 token 统计口径

## 任务清单

### Phase 2A: 路由与 registry

- [x] 在 `POST /api/chat/resume` 入口显式执行 `verifyOwnership(sessionId, user.id)`
- [x] 将 chat runtime registry 切为服务端执行 tool
- [x] 对 `resumeEditorModify` / `resumeEditorReorder` 启用 `strict: true`
- [x] 为主要操作补 `inputExamples`
- [x] 适用性校验失败时落 `tool_failed`

### Phase 2B: authoritative patch 与消息主路径

- [x] 定义 `data-resume-patch` schema，并加入 `chatDataPartSchemas`
- [x] 通过 transient streaming data 下发 authoritative patch
- [x] patch 至少携带 `snapshotId`、`messageId`、`baseVersion`、`nextVersion`、patch body
- [x] `user message` 持久化改为主路径同步完成
- [x] `assistant` 完成态 message 持久化改为主路径同步完成
- [x] `tool_result` / `tool-error` / `error` parts 随 `resume_chat_messages.parts` 一起持久化

### Phase 2C: 前端消费者切换

- [x] 从 chat 主链路移除 `useChat({ onToolCall })` 执行逻辑
- [x] 从 chat 主链路移除 `applyToolOutputToResume(...)`
- [x] 前端在 `onData` 中消费 authoritative patch 并推进 `current_revision`
- [x] patch apply 成功后本地置 `evaluation_report_refresh_flag=true`
- [x] `pendingPatchCount` 只表示“已收到但尚未完成应用/冲突恢复的 patch 数量”
- [x] AI 运行期间继续保持 UI 级编辑锁

## 测试计划

### 单元 / 组件测试

- [x] `data-resume-patch` schema 类型正确
- [x] authoritative patch apply 后本地 `current_revision` 与 `evaluation_report_refresh_flag` 正确推进
- [ ] `ResumeEditorToolUI` 在 AI SDK 原生 tool result part 下仍能正常渲染

### API / 集成测试

- [x] `POST /api/chat/resume` ownership 校验测试
- [x] 单 tool 成功：写 `tool_call` / `tool_result` / snapshot / patch
- [ ] 多 tool 串行成功：revision 连续推进、patch 连续应用
- [x] 部分成功部分失败：成功有 snapshot/patch，失败写 `tool_failed`
- [x] user/assistant message 主路径同步持久化测试
- [ ] AI SDK 原生 `tool-error` / `error` parts 随消息历史持久化测试

### 回归检查

- [ ] 进入 resume chat，触发 AI 修改，看到 tool 解释与状态落地
- [ ] 同一 session 内多次 AI 修改后 resume 与 revision 正常推进
- [ ] 失败的 tool 在聊天流中以内联错误块形式可见

## 验收标准

- chat 主链路的 tool 执行权已切到服务端
- 前端不再执行 authoritative tool mutation，只消费 AI SDK 流与 patch
- `POST /api/chat/resume` 具备显式 ownership 校验
- user/assistant message 已作为会话权威历史同步持久化
- 应用在本阶段完成后仍可正常聊天、修改 resume，并保持 UI 可用
