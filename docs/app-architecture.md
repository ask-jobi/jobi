# 应用与后端约定

本文档描述当前代码库已经落地的架构形态，重点覆盖 App Router、resume editor、AI/chat、支付与 Supabase 分层。

## 技术栈概览

- 前端：Next.js 15 App Router + React 19
- 样式：Tailwind CSS v4 + shadcn/ui + Radix
- 状态：Jotai
- 表单：react-hook-form + Zod
- 国际化：next-intl（`en` / `zh`）
- 数据与认证：Supabase
- AI：Vercel AI SDK + 自定义 `server/ai/*` 与 `lib/agent/*`
- 支付：Stripe Checkout + access pass token 额度模型
- E2E：Playwright
- 单元/组件测试：Vitest

## 顶层目录

```text
app/                 App Router 页面、layout、template、API routes
components/          UI、表单、resume、agent、应用壳层组件
lib/                 hooks、store、template helpers、i18n、payment、supabase client
server/              服务端业务逻辑、AI、quota、auth helpers、rollback
supabase/            migration 与本地开发资源
types/               共享类型定义
CONTEXT.md           简历编辑器领域术语
```

## 路由结构

### 公开路由

- `/` landing page
- `/pricing`
- `/payment/success`
- `/resume-print/[id]` 打印/导出渲染页

### 认证路由

- `/auth/login`
- `/auth/sign-up`
- `/auth/sign-up-success`
- `/auth/forgot-password`
- `/auth/update-password`
- `/auth/error`
- `/auth/confirm`（邮件确认回调 route）

### 受保护路由

项目通过路由组拆成两块：

- `app/(protected)/(main)`：主工作台
  - `/dashboard`
  - `/settings`
  - `/jobs`（重定向到 `/dashboard`）
- `app/(protected)/(individual)`：单个申请工作区
  - `/application/[id]`
  - `/application/[id]/resume`
  - `/application/[id]/jd`

## 应用壳层

### Root Layout

`app/layout.tsx` 当前统一挂载：

- `NextIntlClientProvider`
- 自定义 `I18NProvider`
- `Toaster`
- `UmamiScript`
- Geist 字体

### Middleware

`middleware.ts` 只负责调用 `lib/supabase/middleware.ts` 更新 Supabase session。

### 受保护布局

- `app/(protected)/(main)/layout.tsx`：校验登录态，渲染 sidebar shell
- `app/(protected)/(individual)/application/[id]/layout.tsx`：拉取单个 Job Application，并初始化 Jotai store

## Resume Editor 架构

### 核心领域对象

以 `types/resume.ts` 为准：

- `JobApplication`
- `ResumeData`
- `ResumeJobDescription`
- `sectionOrder`
- `Entry`（`entryId`）

### 当前状态模型

resume editor 已切到 **persisted-resume-only**：

- `applicationAtom`：当前 Job Application
- `applicationResumeDataAtom`：当前 persisted application resume
- `resume-editor-state`：仅保存 selection / modal 等 UI 状态
- 编辑流程：打开 modal -> 局部表单编辑 -> save 成功后调用服务端持久化

当前不再维护页面级整份 resume draft，也没有独立 autosave 层。

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
- session / messages / token usage 读写集中在 `lib/agent/chat-history.ts`
- 对话达到阈值后会生成 summary checkpoint，用于缩短上下文与支持 truncate/rollback

### Tool 调用

- tool schema 与 repair 在 `lib/agent/tools.ts`
- resume mutation 最终通过 `lib/resume/mutations.ts` 应用到 persisted resume
- `/api/chat/truncate` 会按消息回滚 AI 改动并恢复 resume 内容

## 数据与服务端分层

### Supabase

- `lib/supabase/server.ts` / `client.ts` 提供服务端与客户端实例
- 认证、存储、数据库都走 Supabase
- 本地 schema/migration 在 `supabase/`

### `server/` 层职责

当前 `server/` 主要承接：

- `server/resume.ts`：Job Application / Resume 读写、上传、删除、JD 更新
- `server/evaluation.ts`：评估生成与保存
- `server/quota.ts`：token 额度、active access pass、额度消耗
- `server/auth-helpers.ts`：通用 API 认证与错误返回
- `server/ai/*`：解析、评估、重写、prompt、工具能力
- `server/rollback.ts`：上传/创建流程的补偿回滚

### API Route 约定

当前主流模式是：

1. `route.ts` 做参数解析/鉴权/响应封装
2. 业务逻辑下沉到 `server/*` 或 `lib/agent/*`

但支付、quota、少数旧路由里仍有直接访问 Supabase 的实现，属于当前代码库仍在收口的区域。

## 支付与配额

### 模型

当前不是“订阅时长”模型，而是 **access pass token bundle**：

- `FREE`
- `LITE`
- `PRO`

核心含义是聊天 token 总额度与已使用额度。

### 主要路径

- `/pricing`：公开定价页
- `/api/access-passes/create-free`：首次免费额度发放
- `/api/checkout_sessions`：创建 Stripe Checkout Session
- `/api/stripe/webhook`：支付完成后的发放/更新
- `/api/user/token-balance`：前端 token 余额展示

### UI 触点

- sidebar footer 的 `CompactPlanDisplay`
- application header 的 `ApplicationTokenUsage`
- pricing page 的 plan cards

## 导出与缩略图

- `/resume-print/[id]`：服务端读取 resume 数据并渲染打印页
- `/api/resume/print?id=...`：用 Puppeteer 访问打印页并导出 PDF
- `/api/resume/thumbnail?resume_id=...`：用 `ImageResponse` 生成 dashboard 缩略图

## 错误处理

- 表单输入统一优先走 Zod 校验
- 通用 API 错误返回优先走 `handleApiError`
- 高风险多步骤流程（如上传 + parse + 创建记录）通过 rollback 机制补偿失败中间态
- 用户可见的前端错误反馈统一优先用 toast / inline error 展示

## 当前文件命名与样式约束

- 目录命名以小写短横线为主
- 样式以 Tailwind 为主
- 允许少量渲染专用 CSS（如 `app/globals.css`、`components/resume-templates/default-template.css`）
