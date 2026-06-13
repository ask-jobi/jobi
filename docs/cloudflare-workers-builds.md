# Cloudflare Workers Builds 配置

本项目使用 Cloudflare Workers + OpenNext 部署，分为 **production** 和 **staging** 两个 Worker，分别通过 Workers Builds 从 Git 仓库自动构建。

## Worker 与域名

| 环境 | Worker 名 | 域名 |
|---|---|---|
| Production | `jobi` | `hellojobi.com` |
| Staging | `jobi-staging` | `staging.hellojobi.com`（或 workers.dev 预览 URL） |

## Production Worker (`jobi`)

在 Cloudflare Dashboard 中：

1. 进入 **Workers & Pages** > `jobi`。
2. 进入 **Settings -> Builds**。
3. 连接 GitHub 仓库 `ask-jobi/jobi`。
4. 生产分支选择 `main`。

### Build settings

| 配置项 | 值 |
|---|---|
| Build command | `pnpm run cf:build:production` |
| Deploy command | `pnpm run cf:upload:production` |
| Root directory | 留空 / repository root |

### Build variables

| 变量 | 值 |
|---|---|
| `NODE_VERSION` | `24.15.0` |
| `PNPM_VERSION` | `10.9.0` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production Supabase publishable key |
| `NEXT_PUBLIC_BASE_URL` | `https://hellojobi.com` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Production Umami site ID |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami script URL |

### Runtime variables and secrets

在 **Settings -> Variables & Secrets** 中配置：

| 变量 | 类型 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Variable |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Variable |
| `NEXT_PUBLIC_BASE_URL` | Variable |
| `SUPABASE_SECRET_KEY` | Secret（production key） |
| `DEEPSEEK_API_KEY` | Secret |
| `DEEPSEEK_MODEL_ID` | Variable，`deepseek-v4-flash` |
| `STRIPE_SECRET_KEY` | Secret（production/live key） |
| `STRIPE_WEBHOOK_SECRET` | Secret（production webhook secret） |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Variable |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Variable |

### 外部服务回调

- Supabase Auth redirect allow list: `https://hellojobi.com/**`
- Stripe webhook endpoint: `https://hellojobi.com/api/stripe/webhook`

---

## Staging Worker (`jobi-staging`)

1. 在 Cloudflare Dashboard 中 **创建新 Worker**，命名为 `jobi-staging`。
2. 进入 **Settings -> Builds**。
3. 连接 GitHub 仓库 `ask-jobi/jobi`。
4. 生产分支选择 `main`（或 `staging` 分支）。

### Build settings

| 配置项 | 值 |
|---|---|
| Build command | `pnpm run cf:build:staging` |
| Deploy command | `pnpm run cf:upload:staging` |
| Root directory | 留空 / repository root |

### Build variables

| 变量 | 值 |
|---|---|
| `NODE_VERSION` | `24.15.0` |
| `PNPM_VERSION` | `10.9.0` |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Staging Supabase publishable key |
| `NEXT_PUBLIC_BASE_URL` | `https://staging.hellojobi.com` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Staging Umami site ID |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami script URL |

### Runtime variables and secrets

在 **Settings -> Variables & Secrets** 中配置（**staging 专用值**）：

| 变量 | 类型 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Variable（staging Supabase） |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Variable（staging key） |
| `NEXT_PUBLIC_BASE_URL` | Variable，`https://staging.hellojobi.com` |
| `SUPABASE_SECRET_KEY` | Secret（staging Supabase service key） |
| `DEEPSEEK_API_KEY` | Secret（可共用 production key） |
| `DEEPSEEK_MODEL_ID` | Variable，`deepseek-v4-flash` |
| `STRIPE_SECRET_KEY` | Secret（Stripe test key） |
| `STRIPE_WEBHOOK_SECRET` | Secret（Stripe test webhook secret） |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Variable |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Variable |

### Bindings

打开 `jobi-staging` Worker 的 **Settings -> Bindings**，添加：

- **Browser Rendering** binding: `MYBROWSER`

> `WORKER_SELF_REFERENCE` 由 `wrangler.jsonc` 中 `env.staging.services` 自动配置，无需手动添加。

### 外部服务回调

- Supabase Auth（staging 项目）redirect allow list: `https://staging.hellojobi.com/**`
- Stripe test webhook endpoint: `https://staging.hellojobi.com/api/stripe/webhook`

---

## 本地 CLI 部署

```bash
# 部署到 staging（环境变量从当前 shell 继承）
pnpm cf:deploy:staging

# 部署到 production
pnpm cf:deploy:production

# 本地预览（不部署线上）
pnpm cf:preview
```

## Wrangler 环境配置

`wrangler.jsonc` 中定义了 `production`（默认）和 `staging` 两个环境。本地部署时 Wrangler 会根据 `--env` 标志选择对应的 Worker 名称和 service binding。

## 验证

保存 Builds 设置后，推送一次 commit 到绑定分支。成功后检查：

- `https://hellojobi.com` 可访问（production）
- `https://staging.hellojobi.com` 可访问（staging）
