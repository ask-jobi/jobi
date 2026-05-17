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

## Supabase

- `supabase start` - 启动本地 Supabase 开发环境
- `supabase link --project-ref <project-ref>` - 将当前项目关联到远程 Supabase 项目
- `supabase migration new <name>` - 创建新的 migration SQL 文件
- `supabase db reset` - 重建本地数据库，重新执行全部 migrations，并加载 `supabase/seed.sql`
- `supabase db push` - 将本地 migrations 推送到已 link 的远程数据库
- `supabase db pull` - 将远程 schema 差异拉回本地并生成新的 migration
- `npx supabase gen types typescript --local --schema public > types/supabase.ts` - 从本地数据库生成 TypeScript 类型
- `npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > types/supabase.ts` - 从远程项目生成 TypeScript 类型
