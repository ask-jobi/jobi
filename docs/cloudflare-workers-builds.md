# Cloudflare Workers Builds 配置

本项目使用 Cloudflare Workers + OpenNext 部署，production 和 staging 使用各自独立的 Worker 与 D1 数据库。

## Worker 与域名

| 环境 | Worker 名 | 域名 |
| --- | --- | --- |
| Production | `jobi` | `hellojobi.com` |
| Staging | `jobi-staging` | `staging.hellojobi.com`（或 workers.dev 预览 URL） |

## 首次创建 D1 数据库

分别创建 production 和 staging 数据库，并把 Wrangler 返回的 `database_id` 写入 `wrangler.jsonc` 对应的 `d1_databases` 配置。两个环境不能共用数据库。

```bash
pnpm exec wrangler d1 create jobi-production
pnpm exec wrangler d1 create jobi-staging
```

数据库 binding 名固定为 `DB`。部署前执行远端 migration：

```bash
pnpm exec wrangler d1 migrations apply jobi-production --remote --env production
pnpm exec wrangler d1 migrations apply jobi-staging --remote --env staging
```

本地开发使用 Wrangler 管理的本地 SQLite 数据库：

```bash
pnpm db:migrate:local
pnpm dev
```

## Production Worker (`jobi`)

在 Cloudflare Dashboard 的 **Workers & Pages -> jobi -> Settings -> Builds** 连接 `ask-jobi/jobi`，生产分支选择 `main`。

| 配置项 | 值 |
| --- | --- |
| Build command | `pnpm run cf:build:production` |
| Deploy command | `pnpm run cf:upload:production` |
| Root directory | 留空 / repository root |

Build variables：

| 变量 | 值 |
| --- | --- |
| `NODE_VERSION` | `24.15.0` |
| `PNPM_VERSION` | `10.9.0` |
| `NEXT_PUBLIC_BASE_URL` | `https://hellojobi.com` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Production Umami site ID |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami script URL |

Runtime variables and secrets：

| 变量 | 类型 |
| --- | --- |
| `WORKSPACE_COOKIE_SECRET` | Secret，至少 32 字节随机值 |
| `NEXT_PUBLIC_BASE_URL` | Variable |
| `DEEPSEEK_API_KEY` | Secret |
| `DEEPSEEK_MODEL_ID` | Variable，当前为 `deepseek-v4-flash` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Variable |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Variable |

## Staging Worker (`jobi-staging`)

staging 使用相同的 Builds 配置结构，但命令和变量改为：

| 配置项 | 值 |
| --- | --- |
| Build command | `pnpm run cf:build:staging` |
| Deploy command | `pnpm run cf:upload:staging` |
| `NEXT_PUBLIC_BASE_URL` | `https://staging.hellojobi.com` |
| `NEXT_PUBLIC_ENVIRONMENT` | `staging` |

staging 必须使用独立的 `WORKSPACE_COOKIE_SECRET`、D1 数据库和分析配置。`WORKER_SELF_REFERENCE` 由 `wrangler.jsonc` 自动配置。

## Bindings

每个 Worker 都需要以下 bindings：

- D1 database binding：`DB`
- Browser Rendering binding：`MYBROWSER`

`wrangler.jsonc` 是 binding 的版本化来源；Dashboard 中应与其保持一致。

## 本地 CLI 部署

```bash
pnpm cf:deploy:staging
pnpm cf:deploy:production
pnpm cf:preview
```

## 验证

部署后检查：

- production 与 staging 均可进入 `/dashboard`
- 新 browser context 会获得独立的 `jobi_workspace` cookie
- 两个 browser context 创建的数据互不可见
- 清除站点 cookie 后无法再访问原 workspace 的数据
