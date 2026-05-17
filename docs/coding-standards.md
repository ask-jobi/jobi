# 开发规范

## TypeScript

- 所有组件和函数使用 TypeScript
- 禁止使用 `any`，应使用适当的类型定义，或 `unknown` 配合类型守卫
- 使用 `interface` 定义 props，避免使用类型别名定义复杂对象
- Supabase 类型变更后必须同步生成 `types/supabase.ts`
- 所有与聊天相关的类型（`Message`、`MessagePart` 等）必须使用 `@/types/chat` 中的 `ChatUIMessage`、`MessagePart`

## 组件模式

- 页面组件放在 `app/`，通用 UI 组件放在 `components/ui/`，业务组件放在 `components/client-components/`
- 组件目录命名统一用小写短横线（如 `resume-templates`），文件名与导出组件名保持一致
- 组件内部如有可复用的 hooks、types、utils，建议放在 `lib/hooks/`、`types/`、`lib/utils.ts`
- 优先使用命名导出，避免默认导出
- 组件应为纯函数组件，禁止类组件
- Props 通过 TypeScript `interface` 定义

## 状态管理

- 当需要在多个组件间共享状态时，使用 Jotai
- Jotai 的 atom state 放在 `lib/store/` 目录下
- 使用 Jotai 完全替换 React Context
- 组件本地状态使用 React state

## 表单与验证

- 所有表单校验必须使用 Zod，禁止使用 yup、joi 等其他库
- 使用 `react-hook-form` + `@hookform/resolvers/zod`
- 校验 schema 单独放在 `lib/` 或 `components/client-components/forms/` 下
- 必填字段显示红色星号：`after:content-['*'] after:text-destructive`
- 表单组件必须有错误提示和边界处理

## 导入规则

- 分组导入顺序：React/Next.js -> 外部库 -> 内部组件或 utils
- 使用路径别名（`@/` 或 `~//`）
- 避免超过两层的相对导入
