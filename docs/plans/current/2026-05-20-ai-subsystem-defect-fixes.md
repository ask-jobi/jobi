# AI 子系统缺陷修复与改进

**Date:** 2026-05-20

## 背景

对 `server/ai/`、`lib/agent/`、`app/api/chat/` 三个模块进行了全面代码审查，发现了若干影响线上稳定性、安全性和性能的缺陷。这些问题按严重程度分为三个优先级，本轮计划聚焦 P0/P1 级别修复。

### 审查结论

- 主流程（简历解析、评估优化、AI 聊天）功能完整，通过结构化输出和工具调用的模式已经比较成熟
- 但存在 2 个可能导致线上故障的严重缺陷（`repairToolCall` 暂不修复：当前工具调用格式错误概率较低，修复需要深入理解 ai-sdk 内部机制，收益有限）
- 存在 4 个影响健壮性和性能的中等问题
- 代码层面的可维护性、安全性和可观测性也有提升空间

## 目标

- 修复 `Prompt.format` 只替换首个占位符的 bug

- 修复 token 限额竞态条件
- 放宽评估 schema 的 actions 数量约束
- 为 AI 调用增加超时控制和错误传播
- 消除关键路径的 fire-and-forget 无声失败
- 优化 chat session 列表 N+1 查询
- 增加 prompt 注入防护

## 非目标

- 本轮不重构 chat session 模型整体
- 本轮不引入完整可观测性平台（仅打基础）
- 本轮不替换 LLM 供应商
- 本轮不做 resume-ops-from-eval 的功能补全（仅标记为待实现或移除）
- 本轮不调整模型参数（temperature / top_p 等）

## 代码现状

### 核心文件

| 文件 | 职责 |
|---|---|
| `server/ai/prompts/index.ts` | `Prompt` 模板类，含 `format(template, params)` |
| `server/ai/resume-evaluator.ts` | 简历评估，`Output.object({ schema: evaluationSchema })` |
| `server/ai/resume-parser.ts` | 简历解析，主路径 + fallback 文本解析 |
| `lib/agent/tools.ts` | `repairToolCall` 及 resumeEditorModify/Reorder 工具定义 |
| `lib/agent/chat-history.ts` | Chat session/message 持久化、摘要管理、截断回滚 |
| `app/api/chat/resume/route.ts` | 主聊天 API：消息流、token 限额、摘要触发 |
| `app/api/chat/truncate/route.ts` | 消息截断回滚 API |
| `server/quota.ts` | Token 消费与限额管理 |
| `lib/agent/model.ts` | 模型实例化（硬编码 minimax-m2.7） |

### 当前数据流

```
用户消息 → POST /api/chat/resume → 余额检查 → loadContextMessages
  → getJobApplicationByResumeId (resume + JD + evaluation)
  → 拼接 system prompt → validateUIMessages → streamText
  → onFinish: 持久化消息 + 更新 session token + 消费 token + 日志 + 摘要
```

## 建议方案

### 1. Prompt.format 修复

`String.prototype.replace` 替换为全局正则：

```ts
// server/ai/prompts/index.ts
prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), formattedValue)
```

同时需要转义 key 中的特殊正则字符（`$&`, `$'` 等），以及格式化值中的正则替换模式。更稳健的做法是对值做 escape：

```ts
const escapedValue = formattedValue.replace(/\$/g, "$$$$")
prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), escapedValue)
```

### 2. Token 限额竞态修复

将余额检查从请求开始时移到 token 消费前，使用数据库的乐观锁（`used_chat_tokens` 条件更新）已存在，但需要在消费前做最终检查：

```ts
// 在 onFinish 中，先检查限额再消费
if (activeAccessPass) {
  const remaining = chatTokenQuota.limit - chatTokenQuota.used
  if (remaining <= 0) {
    // 已经消耗完了，不执行消费
  } else {
    await consumeChatTokens(activeAccessPass.id, responseUsage.totalTokens)
  }
}
```

同时将 `onFinish` 中的 `void` 改为 `await`（见第 4 点）。

### 3. 关键 fire-and-forget 改为同步

`onFinish` 中以下操作由 `void` 改为 `await`：

- `saveMessage` / `updateMessage`
- `updateSessionTokenUsage`
- `consumeChatTokens`

标题生成和摘要生成保持异步（非关键路径）。

### 4. 评估 schema 放宽

`evaluationSchema` 的 `actions` 从 `.length(3)` 改为 `.max(3).min(1)`，允许 1-3 个 action。

### 5. N+1 查询优化

`listSessions` 用一个 batch query 获取 message counts：

```ts
const { data: counts } = await supabase
  .from("resume_chat_messages")
  .select("session_id, count")
  .in("session_id", sessions.map(s => s.id))
  .eq("truncated", false)
```

或者用 Supabase RPC / raw SQL 的 `GROUP BY`。

## 任务清单

### Phase 1: P0 严重缺陷修复

- [x] 修复 `server/ai/prompts/index.ts` 中 `Prompt.format` 仅替换首个占位符
  - [x] 改用全局正则替换 `{{key}}`
  - [x] 对替换值做 `$` 转义
  - [x] 补充/更新单元测试（同占位符多次出现）

- [x] 修复 `app/api/chat/resume/route.ts` token 限额竞态
  - [x] 在 `onFinish` 消费前再次做余额检查
  - [x] 将 `consumeChatTokens` 从 `void` 改为 `await`

### Phase 2: P1 健壮性与性能

- [x] 放宽 `server/ai/resume-evaluator.ts` 的 `evaluationSchema` actions 约束
  - [x] `.length(3)` → `.max(3).min(1)`
  - [x] 更新测试用例（少于 3 个 action 的场景）
- [ ] 为 AI 调用增加超时控制
  - [ ] `generateText` 调用增加 `abortSignal`（从 `request.signal` 传入或设置固定超时）
  - [ ] `streamText` 增加 `maxTokens` 防止无限生成
- [ ] 将 `onFinish` 中关键持久化操作从 fire-and-forget 改为同步
  - [ ] `saveMessage` / `updateMessage` → `await`
  - [ ] `updateSessionTokenUsage` → `await`
  - [ ] `consumeChatTokens` → `await`
- [ ] 优化 `lib/agent/chat-history.ts` 中 `listSessions` 的 N+1 查询
  - [ ] 单次 batch query 获取所有 session 的 message count

### Phase 3: P2 安全与可维护性

- [ ] Prompt 注入防护
  - [ ] 在 system prompt 中对用户简历数据做基本 sanitization
  - [ ] 或将用户数据从 system 消息移至 user 消息
- [ ] Model 配置支持环境变量覆盖
  - [ ] `lib/agent/model.ts` 从 `process.env.AI_MODEL` 读取，fallback 到当前值
- [ ] 清理死代码
  - [ ] 确认 `server/ai/prompts/resume-ops-from-eval.prompt.ts` 是否可删除
  - [ ] 如需要保留，标记 `@deprecated` 或补充 TODO
- [ ] 流式错误传播
  - [ ] `POST /api/chat/resume` 中 `streamText` 失败时通过 `dataStream` 发送 error part

## 测试计划

### 单元 / 组件测试

- [ ] `Prompt.format` 同占位符多次出现测试
- [ ] `Prompt.format` 值含 `$` 符号测试
- [ ] `evaluationSchema` 接受 1-2 个 actions

- [ ] `listSessions` batch query 覆盖

### 回归检查

- [ ] 简历解析：上传 PDF 正常解析，中文/英文简历均可
- [ ] 简历评估：点击评估按钮正常返回结果，少于 3 个 action 不报错
- [ ] AI 聊天：发送消息正常回复、工具调用正常执行、token 正常扣减
- [ ] Token 限额：额度用尽后收到友好提示
- [ ] 截断回滚：历史消息可回滚，简历状态正确恢复
- [ ] Chat session 列表：正常加载、消息计数正确

## 验收标准

- `Prompt.format("{{name}} is {{name}}", { name: "Test" })` 返回 `"Test is Test"`

- 并发请求不会绕过 token 限额
- 评估结果即使只有 1 个 action 也能正常返回
- AI 聊天消息发送后 token 统计和消费不再使用 fire-and-forget
- chat session 列表页不再出现 N+1 查询
- 所有现有测试通过
