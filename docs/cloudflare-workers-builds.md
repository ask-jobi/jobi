# Cloudflare Workers Builds 配置

本项目使用 Cloudflare Workers + OpenNext 部署，Workers Builds 负责从 Git 仓库自动构建并发布现有 `jobi` Worker。

## 连接仓库

在 Cloudflare Dashboard 中：

1. 进入 **Workers & Pages**。
2. 打开现有 Worker：`jobi`。
3. 进入 **Settings -> Builds**。
4. 点击 **Connect**，选择 GitHub 仓库 `ask-jobi/jobi`。
5. 生产分支选择 `main`。
6. Root directory 留空，表示仓库根目录。

## Build settings

| 配置项 | 值 |
|---|---|
| Build command | `pnpm run cf:build` |
| Deploy command | `pnpm run cf:upload` |
| Non-production branch deploy command | `pnpm run cf:upload-preview` |
| Root directory | 留空 / repository root |

说明：

- `cf:build` 生成 `.open-next/worker.js` 与 `.open-next/assets`。
- `cf:upload` 只上传已生成的 `.open-next/` 产物，避免在 deploy step 中重复构建。
- `cf:upload-preview` 用于非生产分支，只上传 preview version，不提升为当前生产部署。
- 两个 upload 脚本都带 `--keep-vars`，避免 Wrangler 在部署时删除 Dashboard 中配置的 runtime variables。

## Build variables

Workers Builds 的 build variables 只在构建时可见，不等同于 Worker 运行时变量。Next.js 的 `NEXT_PUBLIC_*` 会被打进客户端 bundle，因此需要在 build variables 中配置：

| 变量 | 建议值 |
|---|---|
| `NODE_VERSION` | `24.15.0`（也可由 `.nvmrc` 自动识别） |
| `PNPM_VERSION` | `10.9.0` |
| `NEXT_PUBLIC_SUPABASE_URL` | Cloudflare validation 使用的 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_BASE_URL` | `https://jobi.ytdgoreturn764.workers.dev` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | 如启用 Umami 则填写 |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | 如启用 Umami 则填写 |

## Runtime variables and secrets

在 Worker 的 **Settings -> Variables & Secrets** 中配置运行时变量。`NEXT_PUBLIC_*` 若服务端 runtime 也会读取，应同时放在 runtime variables 中。

| 变量 | 类型 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Variable |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Variable |
| `NEXT_PUBLIC_BASE_URL` | Variable |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Variable，可选 |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Variable，可选 |
| `SUPABASE_SECRET_KEY` | Secret |
| `DEEPSEEK_API_KEY` | Secret |
| `DEEPSEEK_MODEL_ID` | Variable，默认 `deepseek-v4-flash` |
| `STRIPE_SECRET_KEY` | Secret |
| `STRIPE_WEBHOOK_SECRET` | Secret |

## Bindings

`wrangler.jsonc` 已声明：

- Assets binding: `ASSETS`
- Service binding: `WORKER_SELF_REFERENCE` -> `jobi`
- Browser Run binding: `MYBROWSER`

确认 Worker 设置中 Browser Run binding 名称为 `MYBROWSER`。

## 外部服务回调

- Supabase Auth redirect allow list 增加：`https://jobi.ytdgoreturn764.workers.dev/auth/callback`
- Stripe 测试 webhook endpoint 指向：`https://jobi.ytdgoreturn764.workers.dev/api/stripe/webhook`

## 验证

保存 Builds 设置后，推送一次 commit 到 `main` 或在 Dashboard 手动触发构建。成功后检查：

- Build step 成功执行 `pnpm run cf:build`
- Deploy step 成功执行 `pnpm run cf:upload`
- Worker URL 可访问：`https://jobi.ytdgoreturn764.workers.dev`
- Dashboard 的 Version History 出现新版本
