# Change: 按套餐分配 Chat Token 限额并拦截超限发送

## Why
当前系统只记录 chat session 的 token 使用量，但没有把 token 用量纳入套餐配额。用户切换不同计划后无法获得差异化的 token 上限，免费用户也无法在达到 100,000 token 后被硬性限制继续发送消息。

## What Changes
- 为 `access_passes` 增加 chat token 配额与已使用量字段，用于承载按套餐的 token 限额
- 为不同计划分配不同的 chat token 配额，其中 `FREE` 为 `100,000`、`LITE` 为 `1,000,000`、`PRO` 为 `100,000,000`
- 在创建免费通行证和 Stripe 购买通行证时写入对应计划的 chat token 配额
- 在 chat 请求发送前校验 access pass 的 token 配额，达到上限后拒绝继续发送消息
- 在 AI 响应结束后，将实际消耗的 token 累加到当前 `access_passes` 的已使用量
- 在订阅/用量接口中返回 chat token 配额信息，供前端展示不同计划的限制

## Impact
- Affected specs: `resume-chat`
- Affected code:
  - `supabase/migrations/` - 扩展 `access_passes` 表结构
  - `types/supabase.ts` - 同步新的 token 配额字段
  - `lib/payment/quota.ts` - 增加按计划的 chat token 配置
  - `app/api/access-passes/create-free/route.ts` - 写入免费计划 token 配额
  - `app/api/stripe/webhook/route.ts` - 写入付费计划 token 配额
  - `server/quota.ts` - 提供 chat token 配额读取与校验能力
  - `app/api/chat/resume/route.ts` - 发送前拦截并在完成后累计 token 用量
  - `app/api/user/subscription/route.ts` - 返回 chat token 用量信息
  - 聊天与订阅相关前端组件 - 展示实际计划限额而不是固定常量
