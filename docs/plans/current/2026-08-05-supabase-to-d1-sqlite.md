# Supabase to D1 SQLite Migration

**Date:** 2026-08-05

## 背景

开源免登录改造原本依赖 Supabase anonymous sign-in 建立逐浏览器 workspace，但托管项目未启用匿名登录时，所有页面会在 middleware 阶段返回 `Unable to initialize an anonymous workspace`。当前数据库、匿名身份和上传文件仍与 Supabase 耦合，导致项目无法在未配置 Supabase 的环境直接运行。

项目部署目标是 Cloudflare Workers，普通本地 SQLite 文件不能作为线上持久化存储，因此本次使用 Cloudflare D1：本地开发运行 SQLite 模拟数据库，线上使用 D1 binding。

相关文档：

- [Open-source Loginless Cleanup](./2026-07-31-open-source-loginless-cleanup.md)
- [应用与后端约定](../../app-architecture.md)

## 目标

- 完全移除运行时与开发依赖中的 Supabase SDK。
- 用 D1/SQLite 持久化 Job Application、Resume、Chat、Event 和 Snapshot 数据。
- 用应用签名的匿名 workspace cookie 替代 Supabase Auth，继续隔离浏览器 workspace。
- 移除 Supabase Storage；上传 PDF 只用于当前解析请求，不再持久化原始文件。
- 提供 SQLite migration、本地初始化命令、测试和部署说明。

## 非目标

- 不迁移已有远程 Supabase 数据到 D1。
- 不新增账号登录、跨浏览器同步或 workspace 恢复能力。
- 不引入原始 PDF 的 R2 持久化。
- 不改变简历编辑、AI chat、evaluation 和 PDF 导出的产品流程。

## 已确认决策

- SQLite 运行时采用 Cloudflare D1，以兼容当前 Workers/OpenNext 部署目标。
- workspace id 使用高熵随机值并通过 HMAC cookie 签名，不依赖外部认证服务。
- 所有查询在服务端显式带 workspace id 做 ownership 过滤，不依赖 RLS。
- JSON 字段以 SQLite `TEXT` 保存，并在数据访问层统一序列化/反序列化。
- 原始上传 PDF 不持久化；解析完成后只保存结构化 Resume 数据。

## 任务清单

### Phase 1: 基础设施

- [x] 新增 D1 binding、SQLite schema migration 和本地迁移命令
- [x] 新增 typed database schema/client 与 JSON 编解码边界
- [x] 新增签名匿名 workspace cookie，并移除 Supabase proxy/session middleware

### Phase 2: 数据访问迁移

- [x] 迁移 Job Application、Resume、Evaluation 和 intake persistence
- [x] 迁移 Resume revision/snapshot 提交逻辑
- [x] 迁移 Chat Session、Message、Event、truncate/rollback 数据访问
- [x] 移除 Supabase Storage 上传与删除路径

### Phase 3: 依赖与文档清理

- [x] 移除 Supabase packages、client helpers、generated types 与运行时配置
- [x] 更新环境变量、开发命令、部署文档和架构说明
- [x] 更新相关 active plan 中已失效的 Supabase 假设

### Phase 4: 验证

- [x] SQLite migration 可在本地成功应用并执行测试查询
- [x] 相关单元、组件与 API 测试通过
- [x] `pnpm lint` 与 `pnpm format:check` 通过
- [x] production/OpenNext build 通过
- [x] 按 Playwright 指南回归 dashboard、创建简历、application 与 workspace 隔离主流程

## 测试计划

### 单元 / 集成测试

- workspace cookie 首次创建、验签、篡改拒绝。
- workspace 只能读取、更新和删除自己的 application/resume/chat 数据。
- JSON、boolean、timestamp 字段在 SQLite round-trip 后保持业务类型。
- resume revision 冲突、snapshot、chat truncate/rollback 行为保持不变。

### 回归检查

- 无 Supabase 环境变量时打开 `/` 可直接进入 dashboard。
- 创建空白简历与上传解析简历均可完成。
- application resume、JD、evaluation、chat、thumbnail、打印与删除仍可用。
- 新浏览器 context 无法访问另一个 workspace 的数据。

## 风险

- D1 不提供 Postgres RLS，ownership 必须在每条用户数据查询中显式约束。
- D1/SQLite 不提供原生 JSON、boolean 和 timestamptz 类型，转换遗漏会造成运行时类型错误。
- D1 不支持通用交互式事务 API，跨语句原子操作应使用 `batch()` 或条件更新。
- 不保存原始 PDF 后无法重新下载或二次解析原文件；当前产品没有该入口。

## 验收标准

- 运行时代码和 package lock 中不存在 `@supabase/*`。
- 应用在没有任何 Supabase 配置时可完成核心流程。
- 所有持久化数据通过 D1/SQLite 访问，所有用户数据查询受 workspace ownership 约束。
- 本地迁移、测试、代码质量检查和构建均通过。

## 实施结果

- 运行时改为 Cloudflare D1/SQLite + Drizzle ORM，七张业务表由单一 baseline migration 创建。
- Supabase anonymous auth 改为 HMAC 签名的 `jobi_workspace` HttpOnly cookie；生产环境强制配置 `WORKSPACE_COOKIE_SECRET`。
- 所有正式数据读写显式带 workspace id；两个独立浏览器 context 的 UI 回归确认数据互不可见。
- 原始 PDF 不再持久化，上传请求完成后只保存结构化 Resume 数据。
- `@supabase/*`、运行时 client/proxy 与 generated types 已移除。仓库中的 `supabase/` 目录作为旧 PostgreSQL migration 历史保留，不参与构建、启动或部署。
- 验证通过：361 个 Vitest、TypeScript、lint、format check、本地 D1 migration/query、production OpenNext build 和针对性 Playwright 回归。
