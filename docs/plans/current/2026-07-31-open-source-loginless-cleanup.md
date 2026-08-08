# Open-source Loginless Cleanup

> 2026-08-05 更新：匿名身份与数据层已由
> `2026-08-05-supabase-to-d1-sqlite.md` 迁移为签名 workspace cookie + D1/SQLite。
> 本计划中 Supabase Auth、Storage 与 RLS 的实现说明仅保留为历史背景。

**Date:** 2026-07-31

## 背景

Jobi 当前同时包含营销 landing page、邮箱密码登录、Stripe token bundle、access pass 配额和聊天 token 统计。项目准备开源并重新设计产品模型，这些能力不再属于当前产品边界。

核心业务数据仍通过 Supabase 持久化，且现有表和 Storage RLS 依赖 `auth.uid()` 隔离数据。直接开放 `anon` 数据访问会暴露不同访问者的数据，因此本次改为自动创建匿名 Supabase workspace identity：用户无需登录，但每个浏览器仍有独立的数据边界。

## 目标

- `/` 不再展示 landing page，直接进入 dashboard。
- 删除邮箱注册、登录、找回密码、更新密码、登出等用户可见认证功能。
- 新访问者自动获得匿名 workspace identity，现有 RLS 隔离继续有效。
- 删除 Stripe、pricing、payment、access pass、quota 和 token 统计链路。
- 删除聊天 session/message 的 token 统计字段，并停止持久化 provider token usage。
- 更新活跃文档、环境变量、测试和 E2E 入口。

## 非目标

- 不在本次重新设计新的商业模型。
- 不把 Supabase 数据层改成本地存储。
- 不提供匿名 workspace 跨浏览器恢复或账号绑定。
- 不重写简历编辑、AI chat、evaluation 和 PDF 导出业务。

## 已确认决策

- 使用 Supabase anonymous sign-in 维持逐浏览器的数据所有权，而不是给 `anon` role 开放所有业务表。
- 保留内部 session identity 与 ownership 校验；删除的是用户可见的登录账号流程。
- conversation summary 继续按消息数量触发，不依赖 token 统计。
- `/dashboard` 保持主工作台路由，`/` 重定向到 `/dashboard`。

## 任务清单

### Phase 1: 入口与身份

- [x] 将 `/` 改为 dashboard 重定向并删除 landing page 专用组件、文案和资源
- [x] 在 Supabase middleware 中自动创建或刷新匿名 workspace session
- [x] 删除 auth pages、auth forms、auth callbacks、登录状态 UI 和 logout
- [x] 更新本地 Supabase 配置与认证相关测试

### Phase 2: 付费与 token

- [x] 删除 pricing、payment success、Stripe API routes 和 payment 组件
- [x] 删除 access pass、subscription、token balance 与 quota API/UI/server 逻辑
- [x] 删除 chat 与 intake 的 token usage 采集、持久化、响应字段和测试
- [x] 移除 Stripe packages、环境变量和部署配置

### Phase 3: 数据与文档

- [x] 新增 migration，删除付费表及 chat token 统计列
- [x] 同步更新 `types/supabase.ts`
- [x] 更新架构、页面结构、测试、设计和部署文档
- [x] 清理失效的 pricing/landing 活跃计划引用

### Phase 4: 验证

- [x] 运行相关单元与组件测试
- [x] 运行 `pnpm lint`
- [x] 运行 `pnpm format:check`
- [x] 运行生产构建
- [x] 按 Playwright 指南回归匿名进入 dashboard、创建简历和 application 主流程

## 测试计划

### 单元 / 组件测试

- 匿名 session 已存在时不会重复创建用户。
- 无 session 时自动 anonymous sign-in，并把 cookie 传给后续页面/API。
- anonymous sign-in 暂时失败时返回明确服务错误。
- chat message/session DTO 不再包含 token 字段。
- resume intake 不再查询或更新 access pass。

### 回归检查

- 打开 `/` 可进入 dashboard，页面上无登录、定价、套餐和 token UI。
- 新浏览器 session 可以创建空白简历，并只看到自己创建的数据。
- application resume、chat、evaluation、导出和删除仍可用。
- `/auth/*`、`/pricing`、`/payment/*` 与已删除付费 API 返回 404。

## 风险

- 匿名用户清除站点数据后无法恢复原 workspace；文档需明确这一限制。
- 托管 Supabase 项目必须启用 anonymous sign-ins，并结合 CAPTCHA/Turnstile 与速率限制控制滥用。
- 删除数据库列和表不可逆；migration 使用 `drop ... if exists`，部署前应备份现有付费与 token 数据。

## 验收标准

- 仓库不再依赖 Stripe packages，也不存在可达的 pricing/payment/auth account 页面。
- 主流程无需邮箱、密码或显式登录即可使用。
- 运行时代码不再读写 access pass、quota 或 token usage。
- 数据库迁移和生成类型与新模型一致。
- lint、format、测试与构建通过，UI 主流程完成针对性回归。

## 实际结果

- `/` 通过 Next.js 15 `middleware.ts` 自动建立匿名 Supabase session 后重定向到 `/dashboard`。
- 新增 `jobs.user_id` 与 owner RLS；上传 bucket 改为 private，当前上传保存 Storage path，避免匿名 workspace 间的数据泄露。
- 数据库 migration 删除 `stripe_checkout_events`、`access_passes`、`user_profiles` 及聊天 token 统计列。
- 全量 Vitest 通过：78 个 test files，404 个 tests。
- TypeScript、Prettier、ESLint 与 Next.js production build 全部通过。
- Playwright 实测通过：首次匿名进入、创建空白简历、application resume、JD 导航；第二个匿名浏览器访问首个 workspace 的 application 返回 404。
- `/auth/*`、`/pricing`、`/payment/*` 及已删除付费/用量 API 均返回 404。
