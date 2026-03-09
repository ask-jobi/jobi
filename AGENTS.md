<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md - Jobi 项目开发指南

## 常用命令

### 开发
- `pnpm dev` - 启动开发服务器 (Turbopack)
- `pnpm dev:test` - 在 3001 端口启动开发服务器 (用于 E2E 测试)

### 构建
- `pnpm build` - 构建生产环境应用

### 测试
- `pnpm test` - 运行所有 vitest 单元测试
- `pnpm test [filename]` - 运行指定测试文件
- `pnpm test --watch` - 以 watch 模式运行测试
- `pnpm e2e-test` - 运行所有 Playwright E2E 测试
- `pnpm exec playwright test --ui` - 以 UI 模式运行 Playwright 测试

### 代码质量
- `pnpm lint` - 运行 ESLint 检查代码问题
- `pnpm format` - 用 Prettier 格式化所有文件
- `pnpm format:check` - 检查格式化而不修改

## 代码风格指南

### TypeScript
- 所有组件和函数使用 TypeScript
- 禁止使用 `any` - 使用适当的类型定义或 `unknown` + 类型守卫
- 使用 interface 定义 props，避免使用类型别名定义复杂对象
- Supabase 类型变更后必须同步生成 `types/supabase.ts`
- **消息类型：所有与聊天相关的类型（Message、MessagePart 等）必须使用 `@/types/chat` 中的ChatUIMessage, MessagePart类型**

### 组件模式
- 页面组件放在 `app/`，通用 UI 组件放在 `components/ui/`，业务组件放在 `components/client-components/`
- 组件目录命名统一用小写短横线（如 `resume-templates`），文件名与导出组件名保持一致
- 组件内部如有 hooks、types、utils，如果可以复用，建议放在 `lib/hooks/`、`types/`、`lib/utils.ts` 中
- 优先使用命名导出，避免默认导出
- 组件应为纯函数组件，禁止类组件
- Props 通过 TypeScript interface 定义

### 状态管理
- 当需要在多个组件间共享状态时，使用 Jotai 库
- Jotai 创建的 atom state 放在 `lib/store/` 目录下
- 使用 Jotai 完全替换 React Context
- 组件本地状态使用 React state

### 表单与验证
- 所有表单校验必须用 Zod（禁止使用 yup、joi 等其他库）
- 使用 react-hook-form + @hookform/resolvers/zod 组合
- 校验 schema 单独放在 `lib/` 或 `components/client-components/forms/` 下
- 必填字段显示红色星号：`after:content-['*'] after:text-destructive`
- 表单组件必须有错误提示和边界处理

### UI 与样式
- UI 组件优先使用 Shadcn UI 和 Radix 相关库，禁止自造轮子
- 所有样式使用 Tailwind CSS，禁止使用 CSS/SASS/LESS 文件和内联 style
- 响应式设计必须用 Tailwind 的响应式工具类
- 复用样式用 tailwind-merge 合并，避免 class 冲突
- 主题切换统一用 next-themes
- 禁止直接操作 DOM，动画优先用 motion 库

### Next.js 约定
- 仅在需要访问浏览器 API 的组件中加 "use client"，其余全部用服务端组件
- 路由、数据获取、渲染严格遵循 Next.js 官方文档
- URL 状态管理推荐用 nuqs
- 优化 Web Vitals（LCP、CLS、FID），图片用 next/image，避免 layout shift
- API 路由统一放在 `app/api/`，业务逻辑抽离到 `server/`
- SSR/SSG 优先，CSR 仅限必要场景
- 禁止在服务端组件中直接访问 window、document

### 后端与 Supabase
- 所有后端服务（认证、数据库）统一用 Supabase SDK
- 认证流程（登录、注册、登出）必须用 Supabase SDK
- 用户 session、数据管理必须安全，禁止明文存储敏感信息
- API 路由中的业务逻辑必须抽离到 `server/` 目录，`route.ts` 只做参数校验和调用
- Supabase 类型变更后，必须同步生成 `types/supabase.ts`
- 禁止在前端直接操作数据库，所有数据操作通过 API 或 server 层

### 文件结构与命名
- 组件目录：使用小写短横线命名（如 `resume-templates`）
- 文件名与导出的组件名保持一致
- 可复用的 hooks、types、utils 放在 `lib/hooks/`、`types/`、`lib/utils.ts`

### 测试
- 为所有新组件创建单元测试
- 始终为 `route.ts` 创建集成测试，测试使用真实的 Supabase 数据库
- 组件测试使用 testing-library/react
- 测试描述必须使用英文 (English)
- 考虑测试的边界场景和边界条件
- 使用 vitest 作为测试框架（不是 Jest）

### 导入规则
- 分组导入：React/Next.js → 外部库 → 内部组件/utils
- 使用路径别名（`@/` 或 `~//`）
- 避免超过两层的相对导入

### 错误处理
- 使用适当的错误边界和用户反馈
- 所有输入用 Zod schemas 验证
- Webhook 处理器必须验证签名（如 Stripe）
- 正确记录错误但不暴露敏感数据

### 国际化 (i18n)
- **重要：在添加任何新组件时，必须优先考虑 i18n 国际化**
- 在编写组件代码之前，先在 `lib/i18n/translations/en.json` 和 `lib/i18n/translations/zh.json` 中添加所需的翻译 key
- 所有用户可见的文本必须使用 i18n：客户端组件使用 `next-intl/client` 的 `useTranslations`，服务端组件使用 `next-intl/server` 的 `getTranslations`
- 禁止在组件中硬编码显示文本，始终使用翻译 key
- 翻译 key 应具有描述性并遵循现有命名模式（如 `section.subsection.key`）
- 测试所有文本在两种语言中都能正确显示
