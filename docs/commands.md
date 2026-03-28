# 常用命令

## 开发

- `pnpm dev` - 启动开发服务器 (Turbopack)
- `pnpm dev:test` - 在 3001 端口启动开发服务器 (用于 E2E 测试)

## 构建

- `pnpm build` - 构建生产环境应用

## 测试

- `pnpm test` - 运行所有 vitest 单元测试
- `pnpm test [filename]` - 运行指定测试文件
- `pnpm test --watch` - 以 watch 模式运行测试
- `pnpm e2e-test` - 运行所有 Playwright E2E 测试
- `pnpm exec playwright test --ui` - 以 UI 模式运行 Playwright 测试

## 代码质量

- `pnpm lint` - 运行 ESLint 检查代码问题
- `pnpm format` - 用 Prettier 格式化所有文件
- `pnpm format:check` - 检查格式化而不修改
