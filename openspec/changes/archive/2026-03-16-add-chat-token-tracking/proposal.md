# Change: Chat Token 消耗追踪

## Why
当前 chat 功能虽然数据库已设计了 token_count 和 cost 字段，但从未实际记录 token 消耗。用户无法看到每次对话的 token 使用量，也无法基于使用量进行配额控制。

## What Changes
- 在消息保存和更新时，从 AI SDK 获取 token 使用元数据
- 支持区分 input tokens、output tokens、cached tokens、reasoning tokens
- 在 message 和 session 表中存储详细的 token 统计
- 提供 API 获取 session token 消耗统计及消息明细

## Impact
- Affected specs: resume-chat
- Affected code: 
  - `lib/agent/chat-history.ts` - 更新消息保存逻辑
  - `app/api/chat/resume/route.ts` - 添加 token 统计
  - `app/api/chat-sessions/[id]/token-usage/route.ts` - 提供 token 统计 API
  - `supabase/migrations/` - 扩展表结构
