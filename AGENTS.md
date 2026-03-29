# AGENTS.md - Jobi 项目开发指南

本文件保留项目 AI 协作入口说明，详细开发文档已拆分到 `docs/` 目录中。

## 文档索引

- [docs/commands.md](docs/commands.md) - 开发、构建、测试、代码质量相关命令
- [docs/coding-standards.md](docs/coding-standards.md) - TypeScript、组件、状态管理、表单、导入规范
- [docs/design-style.md](docs/design-style.md) - 当前产品设计风格、视觉语言与界面约束
- [docs/app-architecture.md](docs/app-architecture.md) - UI、Next.js、Supabase、错误处理、目录命名约定
- [docs/testing-and-i18n.md](docs/testing-and-i18n.md) - 测试规范与国际化要求
- [docs/plans/README.md](docs/plans/README.md) - 项目计划文档与 current/archive 使用方式

## 使用约定

- 修改开发流程或命令时，优先更新对应的 `docs/*.md`
- 如需新增规范，优先按主题补充到 `docs/` 下，避免继续膨胀本文件
- 重大功能、破坏性调整或架构演进，优先在 `docs/plans/current/` 中维护对应 plan
- 当修改影响 UI、交互、表单、弹窗、导航或主要页面流程时，完成代码后应参考 `Docs/playwright-session-testing-guide.md` 做一轮 UI 回归检查，确认关键页面和主流程没有受到影响
