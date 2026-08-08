# 应用与后端约定

本文档描述当前代码库已经落地的架构形态，重点覆盖 App Router、匿名 workspace identity、resume editor、AI/chat 与 D1/SQLite 分层。

## 技术栈概览

- 前端：Next.js 15 App Router + React 19
- 样式：Tailwind CSS v4 + shadcn/ui + Radix
- 状态：Jotai
- 表单：react-hook-form + Zod
- 国际化：next-intl（`en` / `zh`）
- 数据：Cloudflare D1（SQLite）+ Drizzle ORM
- 匿名身份：服务端签名的 HttpOnly workspace cookie
- AI：Vercel AI SDK 库 + direct DeepSeek API provider + 自定义 `server/ai/*` 与 `lib/agent/*`
- 部署：Cloudflare Workers + OpenNext (`@opennextjs/cloudflare`)
- E2E：Playwright
- 单元/组件测试：Vitest

项目不提供 landing page、账号登录或付费能力。访问者无需输入邮箱和密码；应用自动创建匿名 workspace cookie，用于保持逐浏览器的数据所有权边界。

## 顶层目录

```text
app/                 App Router 页面、layout、template、API routes
components/          UI、表单、resume、agent、应用壳层组件
lib/                 hooks、store、template helpers、i18n、db 与 workspace helpers
server/              服务端业务逻辑、AI、identity helpers、rollback
db/                  D1/SQLite migrations
types/               共享类型定义
CONTEXT.md           简历编辑器领域术语
```

## 路由结构

### 入口与主工作区

- `/`：重定向到 `/dashboard`
- `/dashboard`：Job Application 列表页
- `/settings`：设置页
- `/jobs`：兼容入口，重定向到 `/dashboard`
- `/application/[id]`：申请详情入口
- `/application/[id]/resume`：简历编辑页
- `/application/[id]/jd`：Job Description 编辑页
- `/resume-print/[id]`：打印/导出渲染页

`/pricing`、`/payment/*` 和用户可见的 `/auth/*` 页面不属于当前产品。

## 身份与数据边界

### 匿名 workspace identity

- `middleware.ts` 验证签名 cookie；新浏览器没有有效 cookie 时，创建随机 workspace id。
- workspace id 是所有业务表的 ownership 边界；每条用户数据查询都必须显式带上该 id。
- 页面和 API 仍应校验 identity/ownership，但不应跳转到登录页或暴露登录、注册、登出交互。
- 清除浏览器站点数据会丢失匿名 workspace 的访问凭据；当前不提供跨浏览器恢复或账号绑定。
- 生产环境必须配置高熵 `WORKSPACE_COOKIE_SECRET`，并结合速率限制控制滥用。

### 应用壳层

`app/layout.tsx` 统一挂载：

- `NextIntlClientProvider`
- 自定义 `I18NProvider`
- `Toaster`
- `UmamiScript`
- Geist 字体

middleware 维护匿名 workspace cookie。`app/(protected)/(main)` 目录名是内部路由分组约定，不代表用户需要完成显式登录。

- `app/(protected)/(main)/layout.tsx`：渲染 sidebar shell
- `app/(protected)/(individual)/application/[id]/layout.tsx`：校验资源 ownership、拉取 Job Application 并初始化 Jotai store

## Resume Editor 架构

### 核心领域对象

以 `types/resume.ts` 为准：

- `JobApplication`
- `ResumeData`
- `ResumeJobDescription`
- `sectionOrder`
- `Entry`（`entryId`）

### 当前状态模型

resume editor 使用 **persisted-resume-only**：

- `applicationAtom`：当前 Job Application
- `applicationResumeDataAtom`：当前 persisted application resume
- `resume-editor-state`：仅保存 selection / modal 等 UI 状态
- 编辑流程：打开 modal -> 局部表单编辑 -> save 成功后调用服务端持久化

当前不维护页面级整份 resume draft，也没有独立 autosave 层。

### Section / Template

- 默认起步 section：`education`、`skills`
- 可选 section：`employment`、`research`、`projects`、`publications`、`awards`、`certifications`
- 模板注册表在 `lib/templates/registry.ts`
- 当前已注册 `default` 与 `modern` 两套模板
- 当前编辑页默认使用 `default` 模板；模板切换能力已预留，但还不是一等产品流程

### 编辑交互

- 画布组件：`components/resumes/resume-editor.tsx`
- section/entry hover 操作：`components/resume-templates/*`
- 本地编辑 modal：`components/resumes/resume-section-edit-modal.tsx`
- 纯数据变更集中在 `lib/resume/mutations.ts`

## AI / Chat 架构

### 入口

- 右侧面板：`components/resumes/resume-right-panel.tsx`
- 聊天 UI：`components/agent/chat-interface.tsx`
- Chat API：`app/api/chat/resume/route.ts`

### 会话模型

- 每份 Application Resume 对应一个 canonical chat session
- session 与 messages 读写集中在 `lib/agent/chat-history.ts`
- 对话达到消息数量阈值后生成 summary checkpoint，用于缩短上下文与支持 truncate/rollback
- 应用不采集、持久化或展示 provider token usage，也不按 token 配额阻止请求

### Tool 调用

- tool schema 与 repair 在 `lib/agent/tools.ts`
- resume mutation 最终通过 `lib/resume/mutations.ts` 应用到 persisted resume
- `/api/chat/truncate` 会按消息回滚 AI 改动并恢复 resume 内容

## 数据与服务端分层

### D1 / SQLite

- `lib/db/client.ts` 从 Cloudflare runtime context 获取 `DB` binding
- `lib/db/schema.ts` 定义 Drizzle SQLite schema；SQL migration 位于 `db/migrations/`
- `lib/workspace/session.ts` 负责 workspace cookie 的签名、验证与读取
- 原始上传 PDF 只用于当前解析请求，不落入持久化 Storage；结构化结果写入 D1

### `server/` 层职责

当前 `server/` 主要承接：

- `server/resume.ts`：Job Application / Resume 读写、上传、删除、JD 更新
- `server/evaluation.ts`：评估生成与保存
- `server/job-application-limit.ts`：每个匿名 workspace 的 Job Application 数量上限
- `server/auth-helper.ts`：内部 identity/ownership 校验与 API 错误映射
- `server/ai/*`：解析、评估、重写、prompt、工具能力
- `server/rollback.ts`：上传/创建流程的补偿回滚

### API Route 约定

当前主流模式是：

1. `route.ts` 做参数解析、identity/ownership 校验和响应封装
2. 业务逻辑下沉到 `server/*` 或 `lib/agent/*`

“无需登录”不等于绕过数据所有权校验。所有用户数据 API 都必须使用当前匿名 identity，并验证目标资源属于该 identity。

固定的 Job Application 数量上限用于控制单个匿名 workspace 的资源占用，不是套餐、付费或 token 配额。

## 导出与缩略图

- `/resume-print/[id]`：服务端读取 resume 数据并渲染打印页
- `/api/resume/print?id=...`：通过 Cloudflare Browser Run binding (`MYBROWSER`) 和 `@cloudflare/puppeteer` 访问打印页并导出 PDF
- `/api/resume/thumbnail?resume_id=...`：服务端实时生成 SVG dashboard 缩略图

## 错误处理

- 表单输入统一优先走 Zod 校验
- 通用 API 错误返回优先走 `handleApiError`
- workspace cookie 校验或 D1 binding 获取失败时应返回明确的服务错误，不能降级为跨用户共享数据
- 高风险多步骤流程（如上传 + parse + 创建记录）通过 rollback 机制补偿失败中间态
- 用户可见的前端错误反馈统一优先用 toast / inline error 展示

## 当前文件命名与样式约束

- 目录命名以小写短横线为主
- 样式以 Tailwind 为主
- 允许少量渲染专用 CSS（如 `app/globals.css`、`components/resume-templates/default-template.css`）
