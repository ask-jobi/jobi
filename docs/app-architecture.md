# 应用与后端约定

## UI 与样式

- UI 组件优先使用 Shadcn UI 和 Radix 相关库，禁止重复造轮子
- 所有样式使用 Tailwind CSS，禁止使用 CSS/SASS/LESS 文件和内联 `style`
- 响应式设计必须使用 Tailwind 的响应式工具类
- 复用样式使用 `tailwind-merge` 合并，避免 class 冲突
- 主题切换统一使用 `next-themes`
- 禁止直接操作 DOM，动画优先使用 `motion` 库

## Next.js 约定

- 仅在需要访问浏览器 API 的组件中添加 `"use client"`，其余默认使用服务端组件
- 路由、数据获取、渲染严格遵循 Next.js 官方文档
- URL 状态管理推荐使用 `nuqs`
- 优化 Web Vitals（LCP、CLS、FID），图片使用 `next/image`，避免 layout shift
- API 路由统一放在 `app/api/`，业务逻辑抽离到 `server/`
- SSR/SSG 优先，CSR 仅限必要场景
- 禁止在服务端组件中直接访问 `window`、`document`

## 后端与 Supabase

- 所有后端服务（认证、数据库）统一使用 Supabase SDK
- 登录、注册、登出等认证流程必须使用 Supabase SDK
- 用户 session、数据管理必须安全，禁止明文存储敏感信息
- API 路由中的业务逻辑必须抽离到 `server/` 目录，`route.ts` 只做参数校验和调用
- Supabase 类型变更后必须同步生成 `types/supabase.ts`
- 禁止在前端直接操作数据库，所有数据操作通过 API 或 server 层
- API 路由应使用 `@/server/auth-helpers` 中统一的认证和错误处理函数，避免重复代码

## 文件结构与命名

- 组件目录使用小写短横线命名（如 `resume-templates`）
- 文件名与导出组件名保持一致
- 可复用的 hooks、types、utils 放在 `lib/hooks/`、`types/`、`lib/utils.ts`

## 错误处理

- 使用适当的错误边界和用户反馈
- 所有输入使用 Zod schema 验证
- Webhook 处理器必须验证签名（如 Stripe）
- 正确记录错误，但不要暴露敏感数据
- 所有需要用户认证的 API 必须使用 `@/server/auth-helpers` 中的工具函数
- 使用 `getAuthenticatedUser()` 获取当前用户
- 使用 `verifyOwnership(resourceId, userId)` 验证资源所有权
- 使用 `handleApiError(error)` 统一处理错误响应
- 禁止在 API 路由中重复定义认证逻辑；如需自定义认证逻辑，请抽离到 `@/server/auth-helpers.ts`
