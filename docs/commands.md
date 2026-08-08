# 常用命令

## 开发

- Node 版本固定为 `24.15.0`
- 首次进入仓库或切换终端后，先执行 `nvm use`
- `pnpm dev` - 启动本地开发服务器（Turbopack，默认 3000）
- `pnpm dev:test` - 启动 E2E 用开发服务器（3001）
- `pnpm start` - 启动生产构建产物

## 构建

- `pnpm build` - 构建生产环境应用
- `pnpm cf:preview` - 使用 OpenNext 构建并在本地 Cloudflare Workers runtime 预览
- `pnpm cf:deploy` - 使用 OpenNext 构建并部署到 Cloudflare Workers
- `pnpm cf:typegen` - 根据 `wrangler.jsonc` 生成 `cloudflare-env.d.ts`（该文件不提交）

## 代码质量

- `pnpm lint` - 运行 Next/ESLint 检查
- `pnpm format` - 使用 Prettier 格式化仓库文件
- `pnpm format:check` - 仅检查格式，不写回
- 提交代码前，先运行 `pnpm lint` 与 `pnpm format:check`；若格式检查失败，再运行 `pnpm format` 修复后提交

## 单元测试 / 组件测试

- `pnpm test` - 启动 Vitest
- `pnpm test --watch` - watch 模式
- `pnpm test --run` - 单次执行
- `pnpm test server/resume.test.ts` - 运行指定测试文件
- `pnpm test --project server` - 仅跑 Node/server 项目
- `pnpm test --project components` - 仅跑 jsdom/components 项目

## E2E 测试

- `pnpm e2e-test` - 以 Playwright UI 模式启动 `test/e2e/`
- `pnpm exec playwright test` - 无 UI 运行全部 Playwright 测试
- `pnpm exec playwright test test/e2e/dashboard.spec.ts` - 运行指定 E2E 文件
- `pnpm exec playwright test --ui` - 直接打开 Playwright UI
- Playwright global setup 会先执行本地 D1 migration
- E2E 默认以单 worker 运行，优先保证本地 Next dev + D1 环境稳定；如需提速，可临时设置 `PW_E2E_WORKERS=<n>`

## SQLite / Cloudflare D1

- `pnpm db:migrate:local` - 将 `db/migrations/` 应用到本地 D1/SQLite
- `pnpm db:migrations:list` - 查看本地待执行 migration
- `pnpm exec wrangler d1 migrations create jobi-local <name>` - 新建 SQLite migration
- `pnpm exec wrangler d1 execute jobi-local --local --command "<SQL>"` - 查询本地数据库
- `pnpm exec wrangler d1 migrations apply jobi-production --remote --env production` - 迁移生产 D1
- `pnpm exec wrangler d1 migrations apply jobi-staging --remote --env staging` - 迁移 staging D1

## 调试提示

- Playwright 配置默认使用 `http://localhost:3001`
- `pnpm e2e-test` 会自动起一个 `next dev -p 3001 --turbopack` webServer
- Vitest 配置拆成 `server` 和 `components` 两个 project，改动范围明确时优先按 project 跑
- 本地 D1 数据保存在 `.wrangler/`；需要全新数据库时先备份，再删除对应的本地 D1 state 并重新运行 migration
