## Context
当前 chat token 仅在 `resume_chat_sessions` 层面聚合，前端还使用固定的 `100,000` soft limit 展示。套餐系统真正的授权来源是 `access_passes`，因此按计划分配和限制 chat token 应落在 `access_passes` 上，而不是 session 表。

## Goals / Non-Goals
- Goals:
  - 让 `FREE`、`LITE`、`PRO` 拥有各自的 chat token 上限
  - 将 chat token 用量累计到当前有效的 `access_passes`
  - 在达到 token 上限后阻止继续发送 chat 消息
  - 通过已有订阅接口暴露 chat token 配额与已使用量
- Non-Goals:
  - 不改变现有 full optimize、block optimize、motivation letter 的次数配额语义
  - 不重构 chat token 的 session 级明细追踪逻辑
  - 不改变现有套餐时长与 Stripe 支付流程

## Decisions
- 在 `access_passes` 增加 `quota_chat_tokens` 与 `used_chat_tokens` 两个字段，沿用现有 quota/used 命名模式
- `FREE` 计划的 `quota_chat_tokens` 固定为 `100_000`
- `LITE` 计划的 `quota_chat_tokens` 固定为 `1_000_000`
- `PRO` 计划的 `quota_chat_tokens` 固定为 `100_000_000`
- 各计划的 chat token 上限仍通过统一配置下发，避免把数值散落在路由中
- chat 请求在调用模型前先校验 `used_chat_tokens < quota_chat_tokens`
- AI 响应结束后使用实际返回的 `totalTokens` 累加到 `used_chat_tokens`
- 如果某次响应把用量推到或超过上限，本次响应允许完成，但后续消息必须被拒绝

## Technical Details

### Data Model
- `access_passes.quota_chat_tokens: integer not null default 0`
- `access_passes.used_chat_tokens: integer not null default 0`

### Plan Provisioning
- `lib/payment/quota.ts` 或等效配置模块新增 chat token 配置
- 免费试用创建逻辑写入 `FREE` 的 `quota_chat_tokens = 100_000`
- Stripe webhook 创建 `LITE` / `PRO` access pass 时同步写入对应 `quota_chat_tokens`

### Enforcement Flow
1. Chat API 根据当前登录用户读取有效 `access_pass`
2. 若不存在有效 pass，沿用现有订阅行为处理
3. 若 `used_chat_tokens >= quota_chat_tokens`，直接返回配额超限错误，不保存新消息，也不触发模型调用
4. 若允许发送，继续现有 chat 流程
5. 在 `onFinish` 中拿到该轮 `totalTokens` 后，原子更新 `access_passes.used_chat_tokens`

### Read Models / UI
- 订阅接口返回当前计划的 chat token `total`、`used`、`remaining`
- 聊天用量展示改为使用实际计划上限，而不是固定常量

## Risks / Trade-offs
- 因为 token 总量只能在响应完成后拿到，最后一次成功请求可能会略微超过上限；这是可接受的，系统只保证“达到上限后不可继续发送”
- 需要确保 `used_chat_tokens` 的更新具备并发安全性，避免多次请求覆盖
- 需要兼容历史 `access_passes` 记录，迁移后旧数据应有默认值并在下次发放新 pass 时写入正确配额

## Migration Plan
1. 新增 `access_passes` token 配额字段的数据库迁移
2. 更新 Supabase 类型与计划配置
3. 更新免费试用与 Stripe webhook 的 pass 创建逻辑
4. 在 quota 服务层添加 chat token 校验与累计方法
5. 在 chat API 接入发送前拦截与响应后累计
6. 更新订阅接口和前端展示
7. 增加单元测试与 API 测试覆盖超限场景
