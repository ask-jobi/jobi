# Open-source README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the internal-facing root README with aligned English and Simplified Chinese open-source project pages, preserve maintainer instructions in a development guide, and license Jobi under AGPL-3.0.

**Architecture:** The root documentation is split by audience: the two README files introduce the product and provide a safe self-hosting quick start, while `docs/development.md` holds operational workflows. Existing assets are referenced directly, existing focused documents remain the source of detailed project rules, and the standard license text is kept in a standalone `LICENSE` file.

**Tech Stack:** Markdown, Next.js 15, React 19, Supabase CLI, Cloudflare Workers/OpenNext, pnpm, GNU AGPL-3.0

---

### Task 1: Preserve the internal development guide

**Files:**
- Create: `docs/development.md`
- Reference: `README.md`
- Reference: `package.json`
- Reference: `docs/commands.md`
- Reference: `docs/cloudflare-workers-builds.md`
- Reference: `docs/app-architecture.md`
- Reference: `docs/testing-and-i18n.md`

- [ ] **Step 1: Inventory current commands and operational content**

Compare the current `README.md` with `package.json` and the focused documents
under `docs/`. Mark obsolete generic Cloudflare commands and retain only content
that is still accurate.

Run:

```bash
sed -n '1,180p' README.md
sed -n '1,80p' package.json
sed -n '1,220p' docs/cloudflare-workers-builds.md
```

Expected: the current README content and the authoritative staging/production
script names are visible for comparison.

- [ ] **Step 2: Create the development guide**

Create `docs/development.md` with these sections:

```markdown
# Development guide

## Prerequisites
## Local development
## Environments
## Environment configuration
## Supabase development
## Cloudflare Workers
## AI provider
## Payments and analytics
## Quality checks
## Further documentation
```

Use the current staging and production script names from `package.json`. Keep
production deployment commands visually separate from local setup. Do not copy
credentials, project references, or values from `.env.local` or `.env.test`.
The guide must explicitly cover:

- local development and Cloudflare validation environments;
- required Cloudflare runtime bindings and deployment-variable categories;
- local Supabase reset/type-generation and linked-project migration/type
  workflows;
- unit/component quality checks and targeted headless E2E checks;
- links to the focused Cloudflare, architecture, command, and testing documents.

- [ ] **Step 3: Verify commands and links**

Run:

```bash
rg -o 'pnpm (?:run )?[a-zA-Z0-9:_-]+' docs/development.md
rg '\"(cf:[^\"]+|dev|build|lint|format:check|test|e2e-test-headless)\"' package.json
rg -n '\\]\\([^)]+' docs/development.md
```

Expected: each documented project script exists in `package.json`, and all
relative links point to existing documentation.

- [ ] **Step 4: Commit the development guide**

```bash
git add docs/development.md
git commit -m "docs: add internal development guide"
```

### Task 2: Build the English open-source README

**Files:**
- Modify: `README.md`
- Reference: `public/jobi-logo/vector/default.svg`
- Reference: `public/landing-page/一键导入.png`
- Reference: `public/landing-page/真实表达.png`
- Reference: `public/landing-page/岗位定制.png`
- Reference: `.env.example`
- Reference: `docs/development.md`

- [ ] **Step 1: Verify product claims against the repository**

Check the current route map, architecture description, environment example, and
payment dependencies before writing feature or setup claims.

Run:

```bash
sed -n '1,180p' docs/web-structure.md
sed -n '1,220p' docs/app-architecture.md
sed -n '1,100p' .env.example
rg -n 'paddle|stripe|deepseek|supabase' package.json app lib server
```

Expected: every advertised feature and integration can be traced to current
code or project documentation.

- [ ] **Step 2: Replace the root README**

Write an English product-first `README.md` with this section order:

```markdown
# Jobi
[简体中文](README.zh-CN.md)

[logo]
[one-paragraph positioning]

## Preview
[three existing screenshots]

## Features
## Tech stack
## Getting started
### Prerequisites
### Local setup
## Configuration
## Self-hosting
## Privacy and data responsibility
## Development and testing
## Contributing
## License
```

Requirements:

- Present Jobi as a self-hostable AI-assisted job application and resume
  workspace.
- Name the verified end-to-end workflow: application tracking, resume import and
  editing, job-specific tailoring, evaluation, and export.
- State the exact prerequisites: Node.js `24.15.0`, pnpm, a Docker-compatible
  container runtime, and Supabase CLI.
- Include `nvm use`, `pnpm install`, `cp .env.example .env.local`,
  `supabase start`, `supabase db reset`, and `pnpm dev` in the local setup.
- Do not claim guaranteed hiring outcomes, objective employability scoring, or
  GDPR compliance.
- Do not advertise an unverified official hosted URL.
- Keep the quick start usable without payment or analytics configuration.
- Group configuration into required Supabase settings, the configured AI
  provider, optional payment integrations, optional analytics, and public versus
  server-only variables.
- Explain that public variables can reach the browser and server secrets must
  never be committed.
- Link operational details to `docs/development.md`.
- Link the license section to `LICENSE`.
- In the privacy section, explain that resumes and AI conversations may contain
  personal or sensitive information and that each operator is responsible for
  assessing privacy, security, retention, subprocessors, cross-border transfers,
  and applicable local law. Require operators to review their AI, storage,
  analytics, and payment providers before processing real personal data.
- In the contributing section, direct contributors to the development guide and
  repository project documentation, ask them to open an issue before substantial
  changes, and require the documented quality checks before a pull request.

- [ ] **Step 3: Validate local assets and links**

Run:

```bash
test -f public/jobi-logo/vector/default.svg
test -f 'public/landing-page/一键导入.png'
test -f 'public/landing-page/真实表达.png'
test -f 'public/landing-page/岗位定制.png'
test -f docs/development.md
rg -n '\\]\\([^)]+' README.md
```

Expected: every referenced local asset and document exists.

- [ ] **Step 4: Commit the English README**

```bash
git add README.md
git commit -m "docs: redesign open-source readme"
```

### Task 3: Add the aligned Chinese README

**Files:**
- Create: `README.zh-CN.md`
- Reference: `README.md`

- [ ] **Step 1: Write the Simplified Chinese counterpart**

Create `README.zh-CN.md` using the same section order, commands, image paths,
links, warnings, and substantive claims as `README.md`. Adapt prose naturally
rather than translating word-for-word. Link back to the English README near the
top.

- [ ] **Step 2: Compare structural alignment**

Run:

```bash
rg '^#{1,3} ' README.md
rg '^#{1,3} ' README.zh-CN.md
rg '^```|^pnpm |^supabase |^cp ' README.md README.zh-CN.md
```

Expected: the heading hierarchy and executable quick-start commands are aligned
between the two files.

- [ ] **Step 3: Validate Chinese README links and assets**

Run:

```bash
rg -n '\\]\\([^)]+' README.zh-CN.md
rg -n 'public/jobi-logo|public/landing-page' README.md README.zh-CN.md
```

Expected: both READMEs use the same existing product assets and valid local
documentation links.

- [ ] **Step 4: Commit the Chinese README**

```bash
git add README.zh-CN.md
git commit -m "docs: add Chinese readme"
```

### Task 4: Add the AGPL-3.0 license and perform final verification

**Files:**
- Create: `LICENSE`
- Modify if needed: `README.md`
- Modify if needed: `README.zh-CN.md`
- Modify if appropriate: `docs/README.md`

- [ ] **Step 1: Add the canonical license text**

Add the unmodified GNU Affero General Public License version 3 text to `LICENSE`.
Use the canonical text published by GNU or SPDX; do not write a summary in place
of the license and do not add custom restrictions.

- [ ] **Step 2: Verify license references**

Run:

```bash
head -5 LICENSE
rg -n 'AGPL|LICENSE' README.md README.zh-CN.md
```

Expected: `LICENSE` identifies GNU Affero General Public License version 3, and
both READMEs link to it.

- [ ] **Step 3: Update an existing documentation index only if appropriate**

If `docs/README.md` is an active index, add `development.md` without otherwise
reorganising it. If no suitable index exists, leave documentation indexes
unchanged.

- [ ] **Step 4: Run documentation verification**

Run:

```bash
pnpm exec prettier --check README.md README.zh-CN.md docs/development.md docs/superpowers/specs/2026-07-31-open-source-readme-design.md docs/superpowers/plans/2026-07-31-open-source-readme.md
git diff --check
git status --short
```

Expected: Prettier reports all checked Markdown files formatted, `git diff
--check` produces no output, and the status contains only the intended
documentation/license changes.

- [ ] **Step 5: Review for secrets and unsupported claims**

Run:

```bash
rg -n '(sk_live|sk_test|service_role|SUPABASE_SECRET_KEY=.+|API_KEY=.+)' README.md README.zh-CN.md docs/development.md LICENSE
rg -ni '(GDPR compliant|guaranteed|guarantee.*job|official hosted)' README.md README.zh-CN.md
```

Expected: no credential-shaped values or prohibited claims are present. Variable
names with placeholders or explanatory prose may appear and should be reviewed
manually.

- [ ] **Step 6: Commit the license and final documentation adjustments**

```bash
git add LICENSE README.md README.zh-CN.md docs/development.md docs/README.md
git commit -m "docs: license Jobi under AGPL-3.0"
```

If `docs/README.md` was not changed, omit it from `git add`. If earlier tasks
already committed all README and development-guide changes, this commit contains
only `LICENSE` and any necessary link corrections.
