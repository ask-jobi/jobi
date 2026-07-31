# Jobi

[English](README.md)

<p align="center">
  <img src="public/jobi-logo/vector/default.svg" alt="Jobi 标志" width="180">
</p>

Jobi 是一个可自行托管的 AI 辅助工作空间，用于管理求职申请和简历。它将求职申请跟踪、PDF 简历导入与结构化编辑、针对具体岗位的简历调整、简历评估和 PDF 导出整合到同一套工作流程中，同时让运营方自行掌控部署环境，以及当前支持的 Supabase、DeepSeek、Stripe、Paddle 和 Umami 集成所使用的账户。

## 预览

### 导入简历

![将现有简历导入 Jobi](public/landing-page/一键导入.png)

### 保持经历真实可信

![在 Jobi 中编辑并改进简历内容](public/landing-page/真实表达.png)

### 针对目标岗位调整简历

![在 Jobi 中根据职位描述调整简历](public/landing-page/岗位定制.png)

## 功能

- 在统一的仪表盘中跟踪求职申请。
- 导入 PDF 简历，或从空白的结构化简历开始。
- 编辑个人信息、教育经历、工作经历、研究经历、项目、出版物、奖项、证书和技能。
- 在每份求职申请中保存职位描述，并通过 AI 辅助对话调整简历内容。
- 生成并刷新评估，对照关联岗位审阅简历。
- 将完成的简历导出为 PDF。
- 在英文和中文界面之间切换。
- 自行托管应用，并连接自己的数据库、身份验证、存储和外部服务账户。

AI 建议和评估仅供审阅参考，不保证求职结果，也不能作为衡量就业能力的客观标准。

## 技术栈

- [Next.js 15](https://nextjs.org/) App Router 和 React 19
- TypeScript、Tailwind CSS v4、shadcn/ui 和 Radix
- Jotai、React Hook Form 和 Zod
- 使用 Supabase 提供身份验证、数据库和存储
- Vercel AI SDK 与直接集成的 DeepSeek 提供方
- 使用 OpenNext 和 Cloudflare Workers 部署
- 使用 Vitest 和 Playwright 测试

## 开始使用

### 前置要求

- Node.js `24.15.0`
- [pnpm](https://pnpm.io/)
- 兼容 Docker 的运行环境
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 本地设置

使用仓库指定的 Node.js 版本并安装依赖：

```bash
nvm use
pnpm install
```

创建本地环境变量文件，启动 Supabase，并查看本地凭据：

```bash
cp .env.example .env.local
supabase start
supabase status
```

使用 `supabase status` 输出的本地值，替换 `.env.local` 中的以下占位符：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<SUBSTITUTE_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<SUPABASE_PUBLISHABLE_KEY>
SUPABASE_SECRET_KEY=<SUPABASE_SECRET_KEY>
```

不要将真实凭据复制到文档中或提交到仓库。如果未启用支付或分析功能，请删除、注释掉 `.env.local` 中对应的占位符条目，或将其留空；占位符字符串不能作为安全的运行时配置。

应用数据库迁移和种子数据，然后启动 Jobi：

```bash
supabase db reset
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。基本的本地工作流程不需要支付和分析功能。AI 辅助功能需要使用下文所述的 DeepSeek 设置。

有关特定环境的工作流程和故障排查，请参阅[开发指南](docs/development.md)。

## 配置

将 `.env.example` 复制为 `.env.local`，并且只为已启用的集成替换占位符。未启用可选的支付和分析集成时，请删除、注释掉相关条目，或将其留空。`.env.example` 是当前环境变量名称的权威清单，但其中的占位符不是有效的配置值。

### 必需的 Supabase 设置

| 变量 | 可见范围 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 公开 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公开 | 可安全用于浏览器的 Supabase publishable key |
| `SUPABASE_SECRET_KEY` | 仅服务端 | 供可信服务端代码使用的 Supabase 特权访问密钥 |

`NEXT_PUBLIC_BASE_URL` 是应用的公开来源地址，例如 `http://localhost:3000`。`NEXT_PUBLIC_ENVIRONMENT` 是用于标记预发布环境的可选公开变量；仅在该环境中将其设为 `staging`。

### AI 提供方

Jobi 当前配置的 AI 提供方是 DeepSeek：

| 变量 | 可见范围 | 用途 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 仅服务端 | DeepSeek API 凭据 |
| `DEEPSEEK_MODEL_ID` | 仅服务端 | 模型标识符；示例默认值为 `deepseek-v4-flash` |

### 可选支付功能

仓库包含 Stripe 和 Paddle 集成。基本的本地开发无需启用它们，但其结账、Webhook 和访问通行证流程需要完整的对应提供方配置。

Stripe 使用以下仅服务端变量：

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_LITE_PASS_PRICE_ID`
- `STRIPE_PRO_PASS_PRICE_ID`

Paddle 使用：

- 仅服务端：`PADDLE_API_KEY`、`PADDLE_WEBHOOK_SECRET`、`PADDLE_LITE_PRICE_ID`、`PADDLE_PRO_PRICE_ID`
- 公开：`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`、`NEXT_PUBLIC_PADDLE_ENV`、`NEXT_PUBLIC_PADDLE_LITE_PRICE_ID`、`NEXT_PUBLIC_PADDLE_PRO_PRICE_ID`

在生产环境之外，请使用测试或沙盒凭据。

### 可选分析功能

当前应用仅在设置以下公开变量时启用 Umami：

- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

运行时目前从 `https://cloud.umami.is/script.js` 加载脚本。尽管 `.env.example` 还列出了 `NEXT_PUBLIC_UMAMI_SCRIPT_URL`，当前应用代码并未使用它，因此设置该变量不会改变脚本 URL。未启用分析功能时，请删除、注释掉这两个 Umami 条目，或将其留空。

以 `NEXT_PUBLIC_` 开头的变量会被打包到浏览器代码中，用户可以读取这些变量。切勿将密钥放入公开变量中。服务密钥、API 密钥和 Webhook 密钥必须仅保留在服务端；切勿提交 `.env.local` 或真实凭据。

有关环境、Cloudflare、提供方和迁移的详细说明，请参阅 [docs/development.md](docs/development.md)。

## 自行托管

Jobi 的设计目标是配合你自己的 Supabase 项目和服务提供方账户运行。仓库内置的部署路径通过 OpenNext 部署到 Cloudflare Workers。完整部署需要：

- 按环境配置的公开变量和服务端密钥；
- 已应用仓库迁移且正确配置身份验证重定向的 Supabase 项目；
- 配有所需 OpenNext 绑定的 Cloudflare Worker；
- 用于 PDF 导出的 `MYBROWSER` Browser Rendering 绑定；
- 启用 AI 功能时所需的 DeepSeek 凭据；
- 仅在启用支付功能时配置对应提供方的 Webhook 和结账流程。

请将本地、预发布和生产环境的凭据、数据库、回调 URL、支付模式和分析站点相互隔离。在部署到生产环境之前，先验证预发布部署。有关持续维护的部署详情，请参阅[开发指南](docs/development.md)和 [Cloudflare Workers Builds 指南](docs/cloudflare-workers-builds.md)。

## 隐私与数据责任

简历和 AI 对话可能包含个人数据或敏感数据。每位运营方都应对其部署环境中的隐私、安全、数据保留、数据删除、子处理方、跨境传输、访问控制和当地法律义务负责。

在处理真实个人数据之前，请审查每个已启用的 AI、存储、分析和支付提供方的政策及数据处理方式。自行托管 Jobi 并不意味着部署本身就符合 GDPR 或任何其他隐私框架。

## 开发与测试

提交常规变更前，请运行标准质量检查：

```bash
pnpm lint
pnpm format:check
pnpm test --run
pnpm build
```

开发过程中可运行有针对性的 Vitest 项目；若变更影响主要 UI 流程，请运行 Playwright：

```bash
pnpm test --project server --run
pnpm test --project components --run
pnpm e2e-test-headless
```

[开发指南](docs/development.md)记录了本地服务、Supabase 迁移、Cloudflare 验证、测试选择和部署命令。

## 参与贡献

欢迎参与贡献。在进行重大变更之前：

1. 阅读[开发指南](docs/development.md)和 [`docs/`](docs/) 中的相关文档。
2. 创建 issue，讨论变更范围和计划采用的方法。
3. 保持变更聚焦，并补充适当的测试或文档。
4. 创建 pull request 前，运行上述质量检查。

## 许可证

Jobi 采用 [GNU Affero General Public License v3.0（AGPL-3.0）](LICENSE)许可。
