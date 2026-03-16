## Context
需要为 Jobi 的 chat 功能添加 token 消耗追踪功能。当前使用 MiniMax-M2.5-highspeed 模型，通过 Vercel AI SDK 调用。

## Goals / Non-Goals
- Goals:
  - 记录每次消息的 input/output/cached/reasoning tokens
  - 在 session 层面聚合 token 统计
  - 提供 session token 统计查询接口
- Non-Goals:
  - 不修改现有的 chat 核心逻辑
  - 不实现 token 配额控制
  - 不实现前端 token 展示

## Decisions
- 使用 AI SDK 的 `usageMetadata` 获取 token 统计
- 在 message 表中存储细分 token 字段（保留已有 `token_count` 作为总量字段）
- token 计算时机：在 AI 响应完成后（onFinish 回调中）

## Technical Details

### Database Schema
```sql
-- 扩展 message 表添加细分字段
ALTER TABLE resume_chat_messages 
ADD COLUMN IF NOT EXISTS input_tokens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS cached_tokens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reasoning_tokens integer DEFAULT 0;
```

### Token 来源
AI SDK 返回的 `usageMetadata` 结构：
```typescript
{
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
  cacheCreationTokens?: number,
  cacheReadTokens?: number,
  reasoningTokens?: number // 如果模型支持
}
```

实现映射：
- `promptTokens` → `input_tokens`
- `completionTokens` → `output_tokens`
- `cacheReadTokens + cacheCreationTokens` → `cached_tokens`
- `reasoningTokens` → `reasoning_tokens`

### 实现位置
1. `lib/agent/chat-history.ts` - 添加 token 字段到 SaveMessageParams 和 UpdateMessageParams
2. `app/api/chat/resume/route.ts` - 在 onFinish 中提取 usageMetadata 并更新消息
3. `app/api/chat-sessions/[id]/token-usage/route.ts` - 提供 session totals 和消息级 token 明细

## Risks / Trade-offs
- MiniMax 模型可能不支持所有 token 类型 → 先实现基础支持，逐步扩展

## Migration Plan
1. 创建数据库迁移添加新字段
2. 修改 chat-history.ts 类型定义
3. 修改 chat API 路由添加 token 提取逻辑
4. 测试验证
