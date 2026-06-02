# Jobi

Jobi is a Next.js 15 App Router application for job application tracking, resume editing, AI-assisted resume improvement, Stripe-backed access passes, and Supabase Auth/Data/Storage.

## Environments

- Local development: `http://localhost:3000`
- Cloudflare validation: configured with a `workers.dev` URL in Cloudflare Workers Builds
- Production canonical URL: set with `NEXT_PUBLIC_BASE_URL`

## Getting Started

Use the project Node version, install dependencies, then start Next dev:

```bash
nvm use
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudflare Workers deployment

This app deploys to Cloudflare Workers through OpenNext (`@opennextjs/cloudflare`). Local development still uses `pnpm dev`; use Cloudflare preview before deploying validation changes.

```bash
pnpm cf:preview
pnpm cf:deploy
pnpm cf:typegen
```

Required Cloudflare settings:

- Worker Browser Run binding: `MYBROWSER`
- Compatibility flags: `nodejs_compat`, `global_fetch_strictly_public`
- Secrets/variables: Supabase, Stripe, DeepSeek, Umami, and `NEXT_PUBLIC_BASE_URL`
- Supabase Auth redirect allow list must include the Cloudflare validation callback URL
- Stripe test webhook endpoint must point at the Cloudflare validation URL

Local Worker variables can be copied from `.dev.vars.example` to `.dev.vars`. Do not commit `.dev.vars`.

## AI provider

Server-side AI calls use the Vercel AI SDK libraries with the direct DeepSeek provider. Configure:

```bash
DEEPSEEK_API_KEY=<DEEPSEEK_API_KEY>
DEEPSEEK_MODEL_ID=deepseek-v4-flash
```

## Supabase development

If you add tables, columns, constraints, or RLS policies, update `types/supabase.ts` after applying migrations.

```bash
supabase start
supabase migration new <name>
supabase db reset
npx supabase gen types typescript --local --schema public > types/supabase.ts
```

For a linked remote project:

```bash
supabase link --project-ref <project-ref>
supabase db push
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > types/supabase.ts
```

## Quality checks

```bash
pnpm lint
pnpm format:check
pnpm test --run
pnpm build
```

Run Playwright when UI flows are affected:

```bash
pnpm e2e-test-headless
```

## Documentation

- `docs/commands.md` - commands
- `docs/app-architecture.md` - architecture and route conventions
- `docs/testing-and-i18n.md` - test/i18n rules
- `docs/plans/current/` - active implementation plans
