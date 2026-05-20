# AGENTS.md - Jobi 项目开发指南

本文件保留项目 AI 协作入口说明，详细开发文档已拆分到 `docs/` 目录中。

## 文档索引

- [docs/commands.md](docs/commands.md) - 开发、构建、测试、代码质量相关命令
- [docs/coding-standards.md](docs/coding-standards.md) - TypeScript、组件、状态管理、表单、导入规范
- [docs/design-style.md](docs/design-style.md) - 当前产品设计风格、视觉语言与界面约束
- [docs/app-architecture.md](docs/app-architecture.md) - UI、Next.js、Supabase、错误处理、目录命名约定
- [docs/web-structure.md](docs/web-structure.md) - 页面结构、主要业务路径与自主测试导航
- [docs/testing-and-i18n.md](docs/testing-and-i18n.md) - 测试规范与国际化要求
- [docs/plans/README.md](docs/plans/README.md) - 项目计划文档与 current/archive 使用方式

## Agent skills

### Issue tracker

Issues are tracked in this repository's GitHub Issues (`ask-jobi/jobi`). See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default triage label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context layout centered on a root `CONTEXT.md` and root `docs/adr/`. See `docs/agents/domain.md`.

## 使用约定

- 修改开发流程或命令时，优先更新对应的 `docs/*.md`
- 提交代码前应先检查代码质量：运行 `pnpm lint` 与 `pnpm format:check`；如格式检查未通过，则执行 `pnpm format` 修复后再提交
- 如需新增规范，优先按主题补充到 `docs/` 下，避免继续膨胀本文件
- 重大功能、破坏性调整或架构演进，优先在 `docs/plans/current/` 中维护对应 plan
- 当修改影响 UI、交互、表单、弹窗、导航或主要页面流程时，完成代码后应参考 `Docs/playwright-session-testing-guide.md` 做一轮 UI 回归检查，确认关键页面和主流程没有受到影响
- 当任务涉及排查 bug、梳理调用链、定位影响范围时，Agent 应优先并行调用适合的辅助 agent 来加速信息收集；例如用 `explorer` 查入口、依赖与影响面
- 当任务已有明确边界，且可以按页面、模块或文件拆分时，Agent 应考虑并行调用 `worker` 执行互不冲突的实现工作，再统一集成结果
- 当修改影响 UI 主流程，尤其是列表页、表单、弹窗、登录流、支付流、导航跳转等高风险路径时，Agent 在完成代码后应优先调用 `playwright_tester` 做一次针对性回归，而不只停留在口头建议
