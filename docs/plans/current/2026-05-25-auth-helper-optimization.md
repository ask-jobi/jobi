# auth-helper 优化计划

> 2026-08-05 更新：Supabase Auth 已由 `2026-08-05-supabase-to-d1-sqlite.md`
> 替换为签名 workspace cookie；本计划中的 Supabase helper/proxy 优化不再适用。

> 2026-07-31 更新：用户可见的注册、登录、登出与认证回跳已被
> `2026-07-31-open-source-loginless-cleanup.md` 取代。服务端 identity/ownership 校验
> 仍保留，但由 proxy 自动建立匿名 Supabase session；本计划中的登录页重定向、
> pricing、Stripe、quota 与 token balance 条目不再执行。

**Date:** 2026-05-25

## 背景

当前 `server/auth-helper.ts` 已经承担了服务端大部分 Supabase 鉴权入口，但默认路径仍以 `supabase.auth.getUser()` 为主，而不是以已验证 claims 为主。这带来几个问题：

- `getUser()` 会频繁联系 Supabase Auth 服务；对只需要 `user.id` 的页面和 API 来说，这比 `getClaims()` 更重
- `getSession()` 不能用于服务端授权决策，而当前 helper 的语义边界还不够清晰，容易让调用方选错入口
- `lib/supabase/proxy.ts` 当前仍使用 `auth.getUser()`，与新版 Supabase SSR 文档推荐的 `auth.getClaims()` 模式不一致
- `proxy.ts` 把几乎所有 `/api/*` 都纳入 proxy，但当前 proxy 在未登录时会直接重定向到 `/auth/login`，这与不少 API / 前端调用方预期的 `401 JSON` 语义冲突
- 部分链路存在重复鉴权：例如 `app/api/resume/upload-and-analyze/route.ts` 先取当前用户，随后 `server/quota.ts` 的 `verifyJobApplicationLimit()` 又再次鉴权
- `getCurrentUser()` 会把“未登录”和“Auth 服务暂时不可用”都折叠成 `null`，使部分真实的 `503` 场景被吞成 `401`
- 当前缺少针对 `server/auth-helper.ts` 与 `lib/supabase/proxy.ts` 的直接测试，后续重构风险偏高

用户已明确给出 Supabase Auth 的两个关键约束，本计划需要围绕它们做结构性收口：

- 服务端授权决策应优先使用经过验证的 claims，而不是直接信任 cookie session
- 同一过期会话下的并发刷新存在一次性 refresh token 竞争，因此要尽量减少不必要的刷新和重复鉴权

相关文档：

- `docs/app-architecture.md`
- `docs/testing-and-i18n.md`
- `CONTEXT.md`
- Supabase SSR / Auth 文档（`getClaims()`、Next.js proxy 模式）

## 目标

- 将服务端鉴权默认路径调整为 claims-first，而不是 `getUser()`-first
- 明确区分“只需要已验证身份”与“确实需要最新 user record”两类 helper
- 让 `lib/supabase/proxy.ts` 对齐 Supabase 当前 SSR 推荐模式
- 修复受保护页面重定向与 API `401 JSON` 语义冲突
- 减少同一请求中的重复鉴权与重复创建 auth context
- 为 auth helper / proxy / 关键 route 补齐测试与高风险回归检查

## 非目标

- 本轮不改 Supabase Auth 提供商、登录方式或 session 生命周期策略
- 本轮不重做数据库 RLS、角色模型或 `app_metadata` 权限体系
- 本轮不重写客户端 `useAuth()` 整体交互模型
- 本轮不统一所有历史 API 的错误格式，只聚焦 auth 相关路径
- 本轮不扩展到完整 observability 平台或大规模埋点改造
- 本轮不处理与 auth 无关的业务逻辑重构

## 代码现状

| 文件 | 当前行为 / 问题 |
|---|---|
| `server/auth-helper.ts` | 只有 `requireAuthenticatedUserIdentity()` 使用 `getClaims()`；其余主入口仍以 `getUser()` 为主 |
| `lib/supabase/proxy.ts` | 使用 `auth.getUser()` 刷新 / 校验会话，未登录时统一重定向登录页 |
| `proxy.ts` | matcher 覆盖 `/dashboard`、`/application`、`/settings`、`/payment`、`/resume-print` 和几乎全部 `/api/*` |
| `lib/supabase/server.ts` | 在 Server Component 内无法写 cookie 时选择静默忽略，依赖 proxy 提前刷新 |
| `app/(protected)/(main)/layout.tsx` | 当前通过 `getCurrentUser()` 判定是否登录 |
| `app/api/resume/create-empty/route.ts` | 只需要 `user.id`，但当前走 `getCurrentUser()` |
| `app/api/resume/upload-and-analyze/route.ts` | 先获取当前用户，随后再调用会再次鉴权的 `verifyJobApplicationLimit()` |
| `server/quota.ts` | `getUserTokenBalance()` 已使用 `requireAuthenticatedUserIdentity()`，但 `verifyJobApplicationLimit()` 仍走 `requireAuthContext()` |
| `app/api/chat-sessions/*`、`app/api/chat/*` | 多个 ownership-only 路由只需要 verified user id，但当前仍使用 `getAuthenticatedUser()` |
| `components/client-components/pricing-card.tsx` 等 | 部分前端 `fetch()` 明确期待后端返回 `401` 后自行跳转登录页 |

### 当前调用模式摘要

- `auth.getUser()` 调用位置极少但非常核心：`server/auth-helper.ts`、`lib/supabase/proxy.ts`、客户端 `useAuth()`
- `auth.getClaims()` 当前仅在 `server/auth-helper.ts` 的一个 helper 中使用，未成为默认服务端授权模式
- route 层和 server 层之间存在“上层已鉴权、下层再鉴权”的重复调用
- route tests 大多直接 mock `createClient().auth.getUser()`，重构后需要成批调整

## 已确认决策

- 服务端页面保护、ownership 校验、按 `user_id` 查询业务数据等场景，默认应使用已验证 claims
- 只有在确实需要“最新 user record / 服务端最新会话状态 / 最新邮箱等属性”时，才保留 `getUser()` 路径
- proxy 需要继续承担 session 刷新职责，但对 API 请求不应再一律重定向登录页
- `retryable fetch error` 应保留为 `503` 语义，不能继续在 `getCurrentUser()` 这一层被吞成 `null`
- 高风险改动完成后，需要对受保护导航、创建简历、pricing、chat session 相关主流程做针对性回归

## 建议方案

### 1. 重塑 auth helper 分层

把 helper 明确拆成两条主路径：

1. verified identity 路径（claims-first）
   - 用于 layout 保护、ownership 校验、token balance、job application 归属判断、chat session 归属判断等
   - 返回最小必要身份：`user.id`、可选 `email`
2. fresh user 路径（getUser-first）
   - 仅用于确实依赖最新 Auth 用户信息的少数路径
   - 例如需要保证读取最新邮箱或希望显式向 Auth 服务确认会话仍有效的场景

建议将当前 helper 收敛为语义更明确的一组入口，例如：

- `requireVerifiedUserIdentity()`
- `requireVerifiedAuthContext()`（如确实需要 `supabase + verified identity`）
- `requireFreshUser()` 或 `requireFreshAuthContext()`
- `getOptionalVerifiedIdentity()`（仅在确有匿名分支时使用）

同时评估废弃或收窄以下旧入口：

- `getCurrentUser()`
- `getAuthenticatedUser()`
- `getAuthContext()`

避免调用方在“identity 是否已验证”“user record 是否最新”之间混用。

### 2. 将 proxy 改为 `getClaims()` 驱动

`lib/supabase/proxy.ts` 需要对齐 Supabase 当前 SSR 文档：

- 在 `createServerClient(...)` 之后立即调用 `supabase.auth.getClaims()`
- 保持 cookie / headers 透传逻辑不变，避免破坏刷新后浏览器与服务端 cookie 同步
- 不在 `createServerClient` 与 claims 校验之间插入其他逻辑

在行为上拆分页面请求与 API 请求：

- 受保护页面：未登录时继续重定向 `/auth/login`
- `/api/*`：未登录时不在 proxy 层重定向，直接放行给 route handler 返回 `401 JSON`

必要时补充小的分类 helper，例如：

- `isApiRequest(request)`
- `isProtectedPageRequest(request)`

### 3. 路由按需求迁移到 claims-first

优先迁移仅依赖 `user.id` 的页面与 API：

- `app/(protected)/(main)/layout.tsx`
- `app/api/resume/create-empty/route.ts`
- `app/api/resume/upload-and-analyze/route.ts`
- `app/api/chat-sessions/route.ts`
- `app/api/chat-sessions/[id]/route.ts`
- `app/api/chat-sessions/[id]/messages/route.ts`
- `app/api/chat-sessions/[id]/token-usage/route.ts`
- `app/api/chat/truncate/route.ts`
- `server/quota.ts` 中与余额读取、ownership 校验有关的路径
- `app/api/access-passes/create-free/route.ts`
- `app/api/stripe/checkout-status/route.ts`

对 `app/api/checkout_sessions/route.ts` 单独审查：

- 若只需要用户邮箱且 claim 中可满足，则也迁移为 claims-first
- 若需要最新邮箱 / 更严格的服务端确认，则保留 fresh-user 路径，但在命名上显式表达原因

### 4. 去掉同一请求内的重复鉴权

优先采用“上层鉴权、下层接收上下文”的模式，而不是让下层服务重复读取 auth：

- `verifyJobApplicationLimit()` 改为接收 `userId`，必要时接收可复用的 `supabase` client
- 类似 quota / resume / chat-history 的 server helper，如调用方已拿到 verified identity，则优先向下传递
- 若仍有明显重复调用，再评估 request-scope memoization；但首选是显式传参，而不是隐式缓存

### 5. 收紧错误语义与兼容策略

需要把以下几类情况显式区分：

- 未登录 / session 缺失 -> `401`
- ownership 失败 -> `403`
- Auth 服务瞬时不可用、可重试网络错误 -> `503`
- 其他意外错误 -> `500`

重点处理：

- 不再让 `getCurrentUser()` 把 `retryable` 错误吞成匿名用户
- route 层尽量统一复用 `mapAuthErrorToApiError()` 或新的 claims/fresh helper 抛错语义
- 保持前端已有的 `401` 处理分支可继续工作

### 6. 补齐测试与回归覆盖

至少新增 / 更新以下测试：

- `server/auth-helper.ts` 单元测试
- `lib/supabase/proxy.ts` 行为测试
- 关键 route tests 从 `getUser` mock 迁移到 `getClaims` / 新 helper mock
- 受保护页面与 API 的回归验证

## 实施步骤

### Phase 1: 设计与调用点盘点

1. 盘点所有 `server/auth-helper.ts` 调用点，标注其真实需求：
   - 只需 verified identity
   - 需要 fresh user
   - 当前存在重复鉴权
2. 盘点所有经由 proxy 的路径，区分：
   - 受保护页面
   - 期望 `401 JSON` 的 API
   - 可匿名访问 API
3. 产出一份迁移矩阵，避免边改边猜

### Phase 2: helper / proxy 基础重构

1. 在 `server/auth-helper.ts` 引入 claims-first 主入口
2. 收窄旧 helper 语义，必要时标记 deprecated 或逐步替换
3. 将 `lib/supabase/proxy.ts` 切到 `getClaims()`
4. 为 proxy 增加页面 / API 分流逻辑

### Phase 3: 路由迁移与重复鉴权消除

1. 先迁移 protected layout 与 chat session / token balance 等 ownership-only 路由
2. 再迁移 resume intake / access pass / checkout status 等 `user.id` 驱动路由
3. 处理 `verifyJobApplicationLimit()` 等下层重复鉴权点
4. 最后审查是否仍保留少量 fresh-user 路径

### Phase 4: 测试与回归

1. 更新单元与 route tests
2. 补 proxy 行为测试
3. 运行 lint / format / test
4. 对高风险 UI 主流程做 Playwright 定向回归

## 任务清单

### Phase 1: 盘点与设计

- [x] 盘点 `server/auth-helper.ts` 所有调用点，并为每个调用点标注真实需求
  - [x] 只需要 verified identity 的调用点
  - [x] 需要 fresh user record 的调用点
  - [x] 存在重复鉴权的调用点
- [x] 盘点 `proxy.ts` matcher 下的页面与 API 路径
  - [x] 明确哪些页面应未登录即重定向
  - [x] 明确哪些 API 应返回 `401 JSON` 而不是被 proxy 重定向
- [x] 产出 helper 迁移命名方案
  - [x] claims-first helper 命名
  - [x] fresh-user helper 命名
  - [x] 旧 helper 的保留 / 替换 / 废弃策略

### Phase 2: helper 与 proxy 重构

- [x] 重构 `server/auth-helper.ts` 的主入口为 claims-first
  - [x] 抽出 verified identity helper
  - [x] 抽出 fresh user helper
  - [x] 统一 auth error -> `401/403/503` 映射
- [x] 收窄或替换高歧义 helper
  - [x] 处理 `getCurrentUser()`
  - [x] 处理 `getAuthenticatedUser()`
  - [x] 处理 `getAuthContext()`
- [x] 重构 `lib/supabase/proxy.ts`
  - [x] 将 `auth.getUser()` 改为 `auth.getClaims()`
  - [x] 保持 cookie / headers 透传正确
  - [x] 为 API 请求与页面请求增加分流逻辑

### Phase 3: 路由迁移

- [x] 迁移受保护 layout 与 ownership-only 路由到 claims-first
  - [x] `app/(protected)/(main)/layout.tsx`
  - [x] `app/api/chat-sessions/route.ts`
  - [x] `app/api/chat-sessions/[id]/route.ts`
  - [x] `app/api/chat-sessions/[id]/messages/route.ts`
  - [x] `app/api/chat-sessions/[id]/token-usage/route.ts`
  - [x] `app/api/chat/truncate/route.ts`
- [x] 迁移只依赖 `user.id` 的业务 route / server helper
  - [x] `app/api/resume/create-empty/route.ts`
  - [x] `app/api/resume/upload-and-analyze/route.ts`
  - [x] `app/api/access-passes/create-free/route.ts`
  - [x] `app/api/stripe/checkout-status/route.ts`
  - [x] `server/quota.ts` 中的 claims-first 场景
- [x] 单独审查 `app/api/checkout_sessions/route.ts`
  - [x] 确认 claim email 是否足够
  - [x] 如不足，保留 fresh-user 并记录原因

### Phase 4: 重复鉴权消除

- [x] 改造 `verifyJobApplicationLimit()` 避免下层重复鉴权
  - [x] 改为接收 `userId`
  - [x] 必要时支持复用上层 `supabase` client
- [x] 盘点其他 server helper 是否仍有“上层已鉴权、下层再鉴权”问题
- [x] 仅在显式传参仍不足时，再评估 request-scope memoization

### Phase 5: 测试与回归

- [x] 为 `server/auth-helper.ts` 增加直接测试
  - [x] verified identity 成功路径
  - [x] session missing -> `401`
  - [x] retryable auth error -> `503`
  - [x] fresh-user 路径与 claims-first 路径区分
- [x] 为 `lib/supabase/proxy.ts` 增加行为测试
  - [x] 页面未登录时重定向登录页
  - [x] API 未登录时不被 proxy 重定向
  - [x] claims 刷新时 cookie / headers 透传正确
- [x] 更新受影响 route tests
  - [x] `getUser` mock 迁移为 `getClaims` 或新 helper mock
  - [x] 保留 `401/403/503` 断言
- [x] 执行质量检查
  - [x] `pnpm lint`
  - [x] `pnpm format:check`
  - [x] 如需要，执行 `pnpm format`
  - [x] `pnpm test`
- [ ] 执行高风险 UI 回归
  - [x] 受保护页面导航
  - [ ] Pricing 登录跳转与付费入口
  - [x] Create Empty Resume / Upload Resume 主流程
  - [x] Chat session 相关页面访问

## 测试计划

### 单元 / route 测试

- [x] helper 层覆盖 claims-first 与 fresh-user 两条路径
- [x] proxy 层覆盖页面请求与 API 请求的不同未登录行为
- [x] route 层覆盖 `401`、`403`、`503` 三类关键返回
- [x] 重复鉴权改造后，新增测试确认下层 helper 不再自行重新鉴权

### Playwright 定向回归

- [x] 未登录访问 `/dashboard`、`/application/[id]`、`/settings` 时行为正确
- [x] 登录后进入 dashboard、创建 resume、进入 application 主流程正常
- [ ] pricing 页面未登录 / 已登录分支行为正常
- [x] chat session 读取、truncate、token balance 展示未被 auth 改造破坏

## 风险

- `getClaims()` 与 `getUser()` 的语义差异会暴露历史上对“最新 user record”的隐式依赖
- proxy 是脆弱路径，cookie 透传稍有偏差就可能引入随机登出问题
- `/api/*` 未登录行为变化可能影响部分历史前端分支或测试断言
- 大量 route tests 当前基于 `getUser` mock，迁移期可能出现连锁失败
- claims 中的数据新鲜度不等同于 `getUser()`，需要避免把需要最新属性的路径误迁移

## 并行执行建议

- [ ] 先用 `explorer` 并行盘点 auth helper 调用点、proxy 影响面、前端 `401` 依赖点
- [ ] 实现阶段可拆成两个 `worker` 并行子任务
  - [ ] Worker A：`server/auth-helper.ts`、`lib/supabase/proxy.ts`、`proxy.ts`
  - [ ] Worker B：route 迁移、`server/quota.ts`、受影响 tests
- [ ] 合并后用 `playwright_tester` 做受保护导航、pricing、create resume、chat session 定向回归

## 验收标准

- 服务端大多数仅依赖身份验证的页面与 API 默认走 claims-first，而不是 `getUser()`
- `lib/supabase/proxy.ts` 已切换为 `auth.getClaims()`，并保持 cookie 刷新链路正常
- 未登录访问受保护页面仍会被正确重定向；未登录调用受保护 API 不再被 proxy 强制重定向，而是返回 route 自身的 `401 JSON`
- `getCurrentUser()` 一类会吞掉 `503` 的旧语义已被收窄、替换或显式标注
- `app/api/resume/upload-and-analyze/route.ts`、`server/quota.ts` 等链路中的重复鉴权已被消除或显著减少
- `server/auth-helper.ts`、`lib/supabase/proxy.ts`、关键 route 的测试已补齐并通过
- 完成 `pnpm lint`、`pnpm format:check`、`pnpm test`，并通过针对 auth 主流程的 Playwright 回归
