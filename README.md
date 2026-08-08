# Jobi

[简体中文](README.zh-CN.md)

<p align="center">
  <img src="public/jobi-logo/vector/default.svg" alt="Jobi logo" width="180">
</p>

Jobi is a self-hostable, AI-assisted workspace for managing job applications and resumes. It brings application tracking, PDF resume import and structured editing, job-specific tailoring, resume evaluation, and PDF export into one workflow. Cloudflare D1 provides SQLite persistence, an application-signed cookie provides anonymous workspace identity, and DeepSeek powers the AI-assisted features. Deployment and any external-service accounts remain under the operator's control.

## Features

- Track job applications from a central dashboard.
- Import a PDF resume or start with an empty structured resume.
- Edit personal information, education, employment, research, projects, publications, awards, certifications, and skills.
- Store a job description alongside each application and tailor resume content with AI-assisted chat.
- Generate and refresh an evaluation to review the resume against the associated role.
- Export the finished resume as a PDF.
- Switch the interface between English and Chinese.
- Self-host the application and connect your own database, authentication, storage, and external-service accounts.

AI suggestions and evaluations are aids for review, not guarantees of hiring outcomes or objective measures of employability.

## Tech stack

- [Next.js 15](https://nextjs.org/) App Router and React 19
- TypeScript, Tailwind CSS v4, shadcn/ui, and Radix
- Jotai, React Hook Form, and Zod
- Cloudflare D1 (SQLite) with Drizzle ORM for persistence
- Vercel AI SDK with the direct DeepSeek provider
- OpenNext and Cloudflare Workers for deployment
- Vitest and Playwright for testing

## Getting started

### Prerequisites

- Node.js `24.15.0`
- [pnpm](https://pnpm.io/)

### Local setup

Use the repository's pinned Node.js version and install dependencies:

```bash
nvm use
pnpm install

pnpm db:migrate:local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Analytics are not required for the basic local workflow. AI-assisted features require the DeepSeek settings described below.

The app creates an anonymous workspace identity automatically. There is no account login or recovery flow, so clearing browser site data also removes access to that browser's existing workspace.

For environment-specific workflows and troubleshooting, see the [development guide](docs/development.md).

## Configuration

Copy `.env.example` to `.env.local` and replace placeholders only for the integrations you enable. Remove, comment out, or blank optional analytics entries when that integration is disabled. `.env.example` is the canonical inventory of current variable names, but its placeholders are not valid configuration values.

`NEXT_PUBLIC_BASE_URL` is the public application origin, such as `http://localhost:3000`. `NEXT_PUBLIC_ENVIRONMENT` is an optional public marker used for staging; set it to `staging` only in that environment.

### Required Cloudflare runtime settings

- Worker Browser Run binding: `MYBROWSER`
- D1 binding: `DB`
- Compatibility flags: `nodejs_compat`, `global_fetch_strictly_public`
- Secrets: `WORKSPACE_COOKIE_SECRET` and `DEEPSEEK_API_KEY`
- Variables: DeepSeek model, Umami, and `NEXT_PUBLIC_BASE_URL`

### AI provider

Jobi's configured AI provider is DeepSeek:

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | Server only | DeepSeek API credential |
| `DEEPSEEK_MODEL_ID` | Server only | Model identifier; the example defaults to `deepseek-v4-flash` |

## SQLite / D1 development

SQLite migrations live in `db/migrations/`. Apply them before starting a fresh local environment:

```bash
pnpm db:migrate:local
pnpm db:migrations:list
```

The local database is persisted under `.wrangler/`. Production and staging use separate D1 databases configured in `wrangler.jsonc`; create those databases, copy their IDs into the matching environment bindings, then apply migrations with `--remote` before deployment.

```bash
pnpm exec wrangler d1 migrations apply jobi-production --remote --env production
pnpm exec wrangler d1 migrations apply jobi-staging --remote --env staging
```

### Optional analytics

The current application enables Umami only when this public variable is set:

- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

The runtime currently loads the script from `https://cloud.umami.is/script.js`. Although `.env.example` also lists `NEXT_PUBLIC_UMAMI_SCRIPT_URL`, the current application code does not consume it, so setting it does not change the script URL. Remove, comment out, or leave both Umami entries blank when analytics is disabled.

Variables prefixed with `NEXT_PUBLIC_` are bundled into browser code and can be read by users. Never place secrets in public variables. Keep service keys, API keys, and webhook secrets server-only, and never commit `.env.local` or real credentials.

See [docs/development.md](docs/development.md) for detailed environment, Cloudflare, provider, and migration guidance.

## Self-hosting

Jobi is designed to be operated with your own Cloudflare account and provider accounts. The included deployment path targets Cloudflare Workers through OpenNext. A complete deployment needs:

- environment-specific public variables and server secrets;
- Cloudflare D1 databases (production and staging) with the repository's migrations applied;
- a Cloudflare Worker with the required OpenNext bindings;
- the `MYBROWSER` Browser Rendering binding for PDF export;
- DeepSeek credentials if AI features are enabled;
- Umami credentials only when analytics are enabled.

Keep local, staging, and production credentials, databases, callback URLs, and analytics sites separate. Validate a staging deployment before production. See the [development guide](docs/development.md) and [Cloudflare Workers Builds guide](docs/cloudflare-workers-builds.md) for the maintained deployment details.

## Privacy and data responsibility

Resumes and AI conversations may contain personal or sensitive data. Each operator is responsible for the privacy, security, retention, deletion, subprocessors, cross-border transfers, access controls, and local-law obligations of their deployment.

Before processing real personal data, review the policies and data-handling practices of every enabled AI, storage, and analytics provider. Self-hosting Jobi does not by itself make a deployment compliant with GDPR or any other privacy framework.

## Development and testing

Run the standard quality checks before submitting a general change:

```bash
pnpm lint
pnpm format:check
pnpm test --run
pnpm build
```

Use targeted Vitest projects while developing, and run Playwright for changes that affect primary UI flows:

```bash
pnpm test --project server --run
pnpm test --project components --run
pnpm e2e-test-headless
```

The [development guide](docs/development.md) documents local services, D1 migrations, Cloudflare validation, test selection, and deployment commands.

## Contributing

Contributions are welcome. Before making a substantial change:

1. Read the [development guide](docs/development.md), the root [agent guidance](AGENTS.md), the root [project context](CONTEXT.md), and the relevant [project documentation](docs/).
2. Open an issue to discuss the scope and intended approach.
3. Keep changes focused and include appropriate tests or documentation.
4. Run the quality checks above before opening a pull request.

## License

Jobi is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).
