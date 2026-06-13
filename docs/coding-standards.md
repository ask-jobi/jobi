# 开发规范

## TypeScript

- 项目开启 `strict: true`，新增代码默认按严格模式编写
- 优先精确定义类型，避免 `any`；确实需要边界兜底时优先用 `unknown` + 类型守卫
- 共享领域模型集中在 `types/`，其中简历核心类型以 `types/resume.ts` 为准
- 新增 resume 相关代码时，优先使用 `Application Resume / Section / Entry / Job Description` 这套术语，和 `CONTEXT.md` 保持一致
- Supabase schema 变更后，必须同步更新 `types/supabase.ts`

## 目录约定

- `app/`：App Router 页面、布局、路由处理器
- `components/ui/`：基础 UI 组件与 layout primitives
- `components/client-components/`：跨页面客户端壳层组件（如 sidebar、pricing、登录状态相关）
- `components/resumes/`：简历编辑器页面级组件
- `components/resume-templates/`：模板渲染、section action、打印相关视图
- `components/forms/`：各 section/JD/auth 表单
- `components/agent/`：聊天与 AI 工具输出 UI
- `lib/`：前端可复用逻辑、store、hooks、template helpers、i18n、payment helpers
- `server/`：服务端业务逻辑、AI 编排、quota、rollback、auth helpers

## 导出约定

- App Router 入口文件（`page.tsx`、`layout.tsx`、`template.tsx`）使用默认导出
- 共享组件、hooks、store、utils 优先使用命名导出
- 历史代码中存在部分默认导出组件；新增共享模块优先保持命名导出风格

## 组件与客户端边界

- 只在确实需要浏览器 API、事件处理、hooks 的文件中添加 `"use client"`
- 服务端逻辑不要下沉到客户端组件；优先放到 `server/` 或 `app/api/`
- `server-only` / `"use server"` 是当前仓库常见边界标记，新增服务端模块继续沿用

## 状态管理

- 跨组件的产品状态使用 Jotai，store 放在 `lib/store/`
- resume 编辑器当前采用 **persisted-resume-only** 模型：
  - `applicationAtom` 保存当前 Job Application
  - `applicationResumeDataAtom` 保存当前可编辑的 persisted resume
  - `resume-editor-state` 只保存选中项、modal 等 UI 状态
- 不要再引入页面级“整份 resume 的草稿副本”或额外 autosave 状态层
- 局部 UI 协调允许用轻量 Context/Provider 包装，但业务状态源仍以 Jotai 为主

## 表单与编辑

- 表单统一使用 `react-hook-form` + `zodResolver`
- 校验 schema 与表单实现尽量同域放置，常见位置是 `components/forms/` 或 `lib/`
- 简历 section 编辑采用“打开 modal -> 本地表单编辑 -> 点击保存后落库”的模式
- 富文本/Markdown 编辑优先复用现有 Tiptap editor 能力，不重复引入新编辑器栈

## Resume section 约定

- 当前支持的 section id：
  - `personalInfo`
  - `education`
  - `employment`
  - `research`
  - `projects`
  - `publications`
  - `awards`
  - `certifications`
  - `skills`
- 默认起步 section 是 `education` 和 `skills`
- 可选 section 在最后一个 entry 被删除时会从 `sectionOrder` 中移除；starter section 会保留为空 section
- entry 主键统一使用 `entryId`

## 样式

- 样式以 Tailwind CSS 为主
- 允许少量全局/渲染专用 CSS：当前已有 `app/globals.css` 和 `components/resume-templates/default-template.css`
- 新增样式优先落在 Tailwind class，而不是继续扩展零散 CSS 文件
- class 合并优先使用 `cn` / `tailwind-merge`

## 导入规则

- 导入分组顺序：React/Next -> 第三方库 -> 内部模块
- 优先使用 `@/` 路径别名
- 避免跨目录多层相对路径

## 提交前检查

- 提交代码前先运行 `pnpm lint` 与 `pnpm format:check`
- 如果 `pnpm format:check` 未通过，先执行 `pnpm format` 修复，再提交代码

## 测试

- 新增 server 逻辑优先补 `*.test.ts`
- 新增复杂组件优先补 `*.test.tsx`
- 测试描述保持英文，和现有 Vitest/Playwright 测试风格一致
