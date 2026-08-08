# Development guide

This guide is for maintainers and contributors working on Jobi. It covers the
local application, shared validation environments, service configuration, and
the checks expected before a change is submitted.

## Prerequisites

- Node.js `24.15.0` (pinned in `.nvmrc` and `package.json`)
- [pnpm](https://pnpm.io/)

Use the pinned Node.js version before installing dependencies:

```bash
nvm use
pnpm install
```

## Local development

Create a local environment file, apply the SQLite migrations, then run the
Next.js development server:

```bash
cp .env.example .env.local
pnpm db:migrate:local
pnpm dev
```

The application is available at
[http://localhost:3000](http://localhost:3000). It creates an anonymous
workspace identity automatically; there is no account login or recovery flow, so
clearing browser site data also removes access to that browser's existing
workspace. Local development uses Next.js with Turbopack; it does not require
deploying a Cloudflare Worker.

## Environments

Jobi is maintained across three environment types:

| Environment | Purpose | How it runs |
| --- | --- | --- |
| Local development | Day-to-day development and tests | Next.js on `http://localhost:3000`, with local D1 (SQLite) |
| Cloudflare validation (staging) | Validate the OpenNext/Workers runtime and external callbacks before production | The `staging` Wrangler environment, normally at the configured staging domain or Workers preview URL |
| Production | The live self-hosted deployment | The `production` Wrangler environment and its canonical URL |

Keep staging and production credentials, databases, and analytics sites
separate. Set `NEXT_PUBLIC_BASE_URL` to the externally reachable URL for each
environment. Set `NEXT_PUBLIC_ENVIRONMENT=staging` only in the staging
environment.

## Environment configuration

Copy `.env.example` to `.env.local` for local Next.js development. For local
Cloudflare preview, copy `.dev.vars.example` to `.dev.vars`. Neither local file
should be committed.

Environment values fall into these categories:

- **Workspace identity:** the server-only `WORKSPACE_COOKIE_SECRET` used to sign
  anonymous workspace cookies.
- **Public application configuration:** the base URL and, for staging, the
  environment marker.
- **AI provider configuration:** the server-only DeepSeek API key and model ID.
- **Analytics:** the optional public Umami website ID and script URL.

Variables prefixed with `NEXT_PUBLIC_` are bundled into browser code and must
never contain secrets. Keep API keys, service keys, and webhook secrets in
server-only variables. Obtain values from the relevant service dashboard; do not
copy values between local, staging, and production without confirming that they
are intended for the target environment.

Cloudflare deployments need variables at two stages:

- **Build variables** expose public values needed while Next.js/OpenNext builds
  the application, along with the pinned Node and pnpm versions.
- **Runtime variables and secrets** provide the Worker with public application
  settings plus server-only AI and workspace identity credentials.

Treat `.env.example` as the canonical inventory of application variables. Each
enabled integration requires its complete provider-specific set from that file;
for example, enabling analytics requires the Umami website ID (and script URL if
you override the default).

See [Cloudflare Workers Builds](cloudflare-workers-builds.md) for staging and
production dashboard setup examples. Its variable tables highlight deployment
configuration but do not replace the complete inventory in `.env.example`.

## SQLite / D1 development

Schema changes belong in `db/migrations/`. Apply them before starting a fresh
local environment:

```bash
pnpm db:migrate:local
pnpm db:migrations:list
```

The local database is persisted under `.wrangler/`. Production and staging use
separate D1 databases configured in `wrangler.jsonc`; create those databases,
copy their IDs into the matching environment bindings, then apply migrations
with `--remote` before deployment:

```bash
pnpm exec wrangler d1 migrations apply jobi-production --remote --env production
pnpm exec wrangler d1 migrations apply jobi-staging --remote --env staging
```

Review the migration direction and target database before every remote
application. Do not apply unverified migrations to a production database.

## Cloudflare Workers

The deployed application uses OpenNext (`@opennextjs/cloudflare`) on Cloudflare
Workers. The Worker configuration defines these runtime bindings:

- `ASSETS` for OpenNext static assets
- `WORKER_SELF_REFERENCE` for requests back to the current Worker
- `MYBROWSER` for Browser Rendering used by PDF export
- `DB` for the D1 database

It also enables the `nodejs_compat` and `global_fetch_strictly_public`
compatibility flags and requires the `WORKSPACE_COOKIE_SECRET` secret for
signing anonymous workspace cookies.

Regenerate TypeScript declarations after changing bindings:

```bash
pnpm cf:typegen
```

Validate the Worker runtime locally without deploying:

```bash
pnpm cf:preview
```

Cloudflare Workers Builds should use the environment-specific scripts:

| Target | Build command | Upload command |
| --- | --- | --- |
| Staging validation | `pnpm cf:build:staging` | `pnpm cf:upload:staging` |
| Production | `pnpm cf:build:production` | `pnpm cf:upload:production` |

Direct CLI deployment is an operational action, separate from local
development. Deploy staging first when validating a release:

```bash
pnpm cf:deploy:staging
```

Deploy production only when the change is approved for the live environment:

```bash
pnpm cf:deploy:production
```

After a staging deployment, apply the pending D1 migrations to the staging
database and exercise the affected flows. Production uses its own database and
live credentials.

## AI provider

Server-side AI features use the Vercel AI SDK with the direct DeepSeek provider.
Configure `DEEPSEEK_API_KEY` as a server-only secret and
`DEEPSEEK_MODEL_ID` as the selected model. The example environment files contain
the supported variable names and a development-oriented model default.

AI conversations and resumes may contain personal or sensitive information.
Operators should evaluate the provider, data handling, retention, and applicable
legal requirements before processing real user data.

## Analytics

Umami analytics is optional. Leave its public website ID and script URL unset
when analytics is not needed; use a separate analytics site for staging if
staging traffic must be measured.

## Quality checks

Run linting, formatting, unit/component tests, and a production build before
submitting a general change:

```bash
pnpm lint
pnpm format:check
pnpm test --run
pnpm build
```

Vitest is split into server and component projects. Prefer a targeted check
during development, then run the full suite before submission:

```bash
pnpm test --project server --run
pnpm test --project components --run
pnpm test server/resume.test.ts --run
```

For changes to navigation, forms, dialogs, dashboards, or other primary UI
paths, run a targeted headless Playwright check:

```bash
pnpm e2e-test-headless test/e2e/dashboard.spec.ts
```

Run `pnpm e2e-test-headless` for the complete headless E2E suite when the change
has broad UI impact. Playwright uses the test server on port `3001` and requires
the local D1 database to be migrated.

If `pnpm format:check` reports changes, run `pnpm format`, review the resulting
diff, and repeat the check.

## Further documentation

- [Commands](commands.md) — command reference and troubleshooting
- [Cloudflare Workers Builds](cloudflare-workers-builds.md) — environment-specific
  build, deployment, binding, and callback configuration
- [Application architecture](app-architecture.md) — application layers, routes,
  AI, D1 persistence, and PDF export
- [Testing and internationalization](testing-and-i18n.md) — Vitest, Playwright,
  and bilingual UI conventions
- [Web structure](web-structure.md) — primary routes and product flows
- [Current plans](plans/current/) — active implementation plans
