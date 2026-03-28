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

本文件保留项目 AI 协作入口说明，详细开发文档已拆分到 `docs/` 目录中。

## 文档索引

- [docs/commands.md](docs/commands.md) - 开发、构建、测试、代码质量相关命令
- [docs/coding-standards.md](docs/coding-standards.md) - TypeScript、组件、状态管理、表单、导入规范
- [docs/app-architecture.md](docs/app-architecture.md) - UI、Next.js、Supabase、错误处理、目录命名约定
- [docs/testing-and-i18n.md](docs/testing-and-i18n.md) - 测试规范与国际化要求

## 使用约定

- 修改开发流程或命令时，优先更新对应的 `docs/*.md`
- 如需新增规范，优先按主题补充到 `docs/` 下，避免继续膨胀本文件
- 保留顶部 OpenSpec 受管控区块，避免手动改动
