This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Preview Env: [jobi-beta.vercel.app](jobi-beta.vercel.app)

Production Env: [www.hellojobi.com](www.hellojobi.com)


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Install chromium for resume print
```shell
npx puppeteer browsers install chrome
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 开发指南

如果你在 Supabase 中新增了表、字段、约束或 RLS policy，需要同步更新 `types/supabase.ts`。

推荐优先从本地数据库生成类型：
```shell
npx supabase gen types typescript --local --schema public > types/supabase.ts
```

如果你需要直接从远程项目生成，也可以使用：
```shell
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > types/supabase.ts
```

或者访问这个地址手动生成
https://supabase.com/docs/reference/cli/supabase-gen-types

## 本地启动supabase

参考这个链接安装 Supabase CLI 工具
https://supabase.com/docs/guides/local-development/cli/getting-started

连接远程 Supabase 项目：
```shell
supabase link --project-ref antnnixumdyjbmqacvhv
```

启动本地 Supabase 服务。这依赖 Docker，并会在本地启动 PostgreSQL、Studio、Auth 等服务：
```shell
supabase start
```

### 修改数据库

这个项目使用 `supabase/migrations/*.sql` 维护数据库表结构。表、索引、外键、RLS policy、trigger 都应该通过 migration SQL 维护，`types/supabase.ts` 只是从数据库 schema 生成的类型文件，不是表结构真相源。

创建新的 migration 文件：
```shell
supabase migration new {file_name}
```

编写完 SQL 后，重建本地数据库并自动执行 migrations 和 `supabase/seed.sql`：
```shell
supabase db reset
```

如果你已经将本地项目 link 到远程项目，并确认要把本地 migrations 推到远程数据库：
```shell
supabase db push
```

如果远程数据库上已经存在手工改动，需要先把远程 schema 拉回本地生成新的 migration：
```shell
supabase db pull
```

推荐日常流程：
1. `supabase start`
2. `supabase migration new <name>`
3. 编辑 `supabase/migrations/<timestamp>_<name>.sql`
4. `supabase db reset`
5. `npx supabase gen types typescript --local --schema public > types/supabase.ts`

相关文件：
- `supabase/migrations/`：数据库结构变更
- `supabase/seed.sql`：本地 reset 后加载的初始化数据
- `supabase/config.toml`：本地 Supabase 配置
- `types/supabase.ts`：从数据库 schema 生成的 TypeScript 类型

## 测试指南

本项目包含完整的测试套件，包括单元测试和端到端测试。

### 测试架构

```
test/
├── e2e/                    # Playwright E2E测试
│   ├── dashboard.spec.ts   # Dashboard页面测试
│   ├── auth.setup.ts       # 认证设置
│   ├── helpers/            # 测试辅助工具
│   └── .auth/              # 认证状态存储
├── __mocks__/              # Jest模拟文件
│   └── next/               # Next.js模块模拟
├── utils.ts                # 测试工具函数
└── test_pdf.pdf            # 测试用PDF文件

app/api/
└── resume/
    └── upload-and-analyze/
        └── route.test.ts   # API路由集成测试

components/
└── blocks/
    └── editor-00/
        └── diff.test.ts    # 组件单元测试
```

### Jest 单元测试

Jest用于单元测试和API集成测试，使用真实的Supabase数据库。

#### 运行Jest测试

```bash
# 运行所有单元测试
pnpm test

# 运行特定测试文件
pnpm test route.test.ts

# 运行测试并监听文件变化
pnpm test --watch

# 生成测试覆盖率报告
pnpm test --coverage
```

#### 测试配置

- **环境**: Node.js (非浏览器环境)
- **框架**: Jest + ts-jest
- **模拟**: jest-mock-extended
- **路径映射**: `@/` 指向项目根目录
- **排除**: `test/e2e/` 目录

#### 测试类型

1. **API集成测试** (`route.test.ts`)
   - 测试API路由的完整功能
   - 使用真实的Supabase数据库
   - 测试文件上传、数据处理等

2. **组件单元测试** (`*.test.ts`)
   - 测试工具函数和组件逻辑
   - 使用Testing Library进行DOM测试
   - 测试边界场景和错误处理

#### 测试规则

- 测试描述必须使用English
- 为每个`route.ts`创建集成测试
- 组件测试使用`@testing-library/react`
- 考虑测试边界场景和错误情况

### Playwright E2E测试

Playwright用于端到端测试，模拟真实用户操作。

#### 运行E2E测试

```bash
# 运行所有E2E测试
pnpm e2e-test

# 运行特定测试文件
pnpm exec playwright test dashboard.spec.ts

# 以UI模式运行（推荐调试时使用）
pnpm exec playwright test --ui

# 以调试模式运行
pnpm exec playwright test --debug

# 生成测试报告
pnpm exec playwright show-report
```

#### 测试配置

- **浏览器**: Chromium (支持Firefox和WebKit)
- **端口**: 3001 (避免与开发服务器冲突)
- **认证**: 自动认证设置
- **并行**: 支持并行测试执行

#### 认证设置

E2E测试使用自动认证流程：

1. **认证设置** (`auth.setup.ts`)
   - 自动登录测试用户
   - 保存认证状态到`test/e2e/.auth/user.json`
   - 所有测试继承认证状态

2. **测试用户**
   - 邮箱: `mock_normal@mail.com`
   - 密码: `mock_normal`

#### 辅助工具

- **DashboardHelper**: 页面操作辅助方法
  - `navigateToDashboard()`: 导航到dashboard
  - `openCreateResumeDialog()`: 打开创建对话框
  - `fillJobInformationForm()`: 填写表单
  - `getResumeCardCount()`: 获取卡片数量
  - `clickFirstResumeCard()`: 点击简历卡片

### 测试环境要求

#### 前置条件
1. 确保开发服务器正在运行
2. 确保数据库连接正常
3. 确保Supabase服务可用!!

#### 环境变量
```bash
# .env.test (用于真实认证测试)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 测试最佳实践

#### 单元测试
1. **测试隔离**: 每个测试独立运行
2. **模拟外部依赖**: 使用Jest模拟Supabase等外部服务
3. **边界测试**: 测试错误情况和边界条件
4. **描述清晰**: 使用English描述测试目的

#### E2E测试
1. **用户视角**: 从真实用户角度编写测试
2. **等待策略**: 使用适当的等待机制
3. **响应式测试**: 测试不同屏幕尺寸
4. **错误处理**: 测试错误场景和恢复

### 故障排除

#### 常见问题

1. **测试失败 - 页面未加载**
   ```bash
   # 检查开发服务器
   pnpm dev:test
   
   # 检查端口占用
   lsof -i :3001
   ```

2. **认证相关测试失败**
   ```bash
   # 重新运行认证设置
   pnpm exec playwright test auth.setup.ts
   
   # 清除认证状态
   rm -rf test/e2e/.auth/
   ```

3. **Jest测试失败**
   ```bash
   # 清除Jest缓存
   pnpm test --clearCache
   
   # 检查环境变量
   echo $NODE_ENV
   ```

#### 调试技巧

1. **E2E调试**
   ```bash
   # UI模式调试
   pnpm exec playwright test --ui
   
   # 调试特定测试
   pnpm exec playwright test dashboard.spec.ts --debug
   ```

2. **单元测试调试**
   ```bash
   # 监听模式
   pnpm test --watch
   
   # 详细输出
   pnpm test --verbose
   ```

3. **查看测试报告**
   ```bash
   # Playwright报告
   pnpm exec playwright show-report
   
   # Jest覆盖率
   pnpm test --coverage
   ```

### 扩展测试

添加新测试时：

1. **单元测试**: 在相应目录创建`*.test.ts`文件
2. **E2E测试**: 在`test/e2e/`目录创建`*.spec.ts`文件
3. **辅助工具**: 在`test/e2e/helpers/`添加辅助类
4. **更新文档**: 更新本README文件

遵循项目的测试规则和最佳实践，确保测试覆盖率和质量。

## Plans 使用准则
项目计划文档统一维护在 `docs/plans/`。

| 场景 | 是否需要更新 `docs/plans/current` 中对应 plan |
| --- | --- |
| 新增功能或能力 | ✅ 必须 |
| 破坏性变更（API/Schema） | ✅ 必须 |
| 架构或模式调整 | ✅ 必须 |
| Bug 修复（恢复既有行为） | 视影响范围决定 |
| 拼写、格式、注释修正 | ❌ 一般不需要 |
| 非破坏性依赖升级 | ❌ 一般不需要 |
