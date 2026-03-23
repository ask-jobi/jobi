## 1. Implementation
- [x] 1.1 为 `access_passes` 增加 `quota_chat_tokens` 和 `used_chat_tokens` 字段，并同步 `types/supabase.ts`
- [x] 1.2 扩展计划配置，使不同计划具备 chat token 配额，且 `FREE` 默认值为 `100,000`
- [x] 1.3 更新免费试用与 Stripe webhook 的 access pass 创建逻辑，写入 chat token 配额
- [x] 1.4 在 `server/quota.ts` 中实现 chat token 配额查询、校验与累计方法
- [x] 1.5 在 `app/api/chat/resume/route.ts` 中接入发送前拦截和响应后 token 累加
- [x] 1.6 更新订阅接口与前端展示，返回并显示当前计划的 chat token 用量
- [x] 1.7 为 quota 服务、chat API、subscription API 增加测试，覆盖免费用户达到上限后的拒绝发送场景
