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
- Playwright 启动前会先检查 `NEXT_PUBLIC_SUPABASE_URL/auth/v1/health`；若本地 Supabase 未运行，会直接失败并提示先执行 `supabase start`
- E2E 默认以单 worker 运行，优先保证本地 Next dev + Supabase 环境稳定；如需提速，可临时设置 `PW_E2E_WORKERS=<n>`

## Supabase

- `supabase start` - 启动本地 Supabase
- `supabase link --project-ref <project-ref>` - 关联远程项目
- `supabase migration new <name>` - 创建 migration
- `supabase db reset` - 重建本地数据库并重新执行 migration/seed
- `supabase db push` - 推送本地 migration 到远程
- `supabase db pull` - 拉取远程 schema 差异
- `npx supabase gen types typescript --local --schema public > types/supabase.ts` - 从本地数据库生成类型
- `npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > types/supabase.ts` - 从远程数据库生成类型

## 调试提示

- Playwright 配置默认使用 `http://localhost:3001`
- `pnpm e2e-test` 会自动起一个 `next dev -p 3001 --turbopack` webServer
- Vitest 配置拆成 `server` 和 `components` 两个 project，改动范围明确时优先按 project 跑
- 如果 `supabase start` 卡在健康检查并报 `Error status 502: An invalid response was received from the upstream server`，先执行 `supabase start --ignore-health-check`，再运行 `./scripts/fix-supabase-kong-dns.sh`
- 上述 502 通常是宿主机 DNS search domain 被注入 Docker 容器，导致 Kong 把 `supabase_*` 主机名错误解析到自身。脚本会把 Kong upstream 改写成容器 IP 并 reload；这是临时修复，重启 Supabase 后需要重新执行。长期修复应移除宿主机的 DNS search domain，或切换到不注入该 search domain 的网络
