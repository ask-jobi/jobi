# Open-source README redesign

## Goal

Replace the repository's internal-facing root README with a bilingual,
product-first open-source introduction, while preserving the current operational
content in a dedicated development document.

The result should help a new visitor understand what Jobi does, see the product,
run it locally, understand the self-hosting boundary, and find the contributor
documentation without exposing internal production instructions as the primary
project introduction.

## Audience and language

- `README.md` is the canonical English project homepage.
- `README.zh-CN.md` is a corresponding Simplified Chinese version.
- Each README links to the other near the top.
- The two versions carry the same substantive information, although wording may
  be adapted for natural English and Chinese.

## Root README structure

Both README files use this information hierarchy:

1. Jobi logo and concise product description
2. Language switch
3. Three existing product screenshots from `public/landing-page/`
4. Core capabilities
5. Technology stack
6. Local development quick start
7. Environment configuration
8. Self-hosting and deployment documentation
9. Privacy and data-processing notice
10. Testing and quality checks
11. Contribution guidance
12. License

The root README remains product-first. Detailed Cloudflare dashboard settings,
linked Supabase workflows, production webhook setup, and maintainer-specific
operational notes belong in the development document.

## Product presentation

- Reuse the existing Jobi logo under `public/jobi-logo/`.
- Reuse the three existing screenshots:
  - `public/landing-page/一键导入.png`
  - `public/landing-page/真实表达.png`
  - `public/landing-page/岗位定制.png`
- Present Jobi as a self-hostable AI-assisted workspace for tracking job
  applications, importing and editing resumes, tailoring a resume to a job
  description, evaluating it, and exporting the result.
- Avoid claims about hiring outcomes, objective employability scores, or GDPR
  compliance.
- Do not advertise an official hosted instance unless a verified public URL and
  supported regions are explicitly available in the repository.

## Quick start and configuration

The quick start must reflect the repository's actual commands and prerequisites:

- Node.js `24.15.0`
- pnpm
- Docker-compatible container runtime
- Supabase CLI
- `nvm use`
- `pnpm install`
- copying `.env.example` to `.env.local`
- `supabase start`
- `supabase db reset`
- `pnpm dev`

Environment variables should be described by category and source of credentials,
not duplicated as real values. The README must distinguish:

- required Supabase configuration;
- the configured AI provider;
- payment integrations that are optional for basic local development;
- optional analytics;
- public variables from server-only secrets.

Any uncertainty about whether a service is required must be resolved against the
current code and configuration during implementation rather than guessed.

## Internal development document

Create `docs/development.md` from the useful content of the existing README,
edited into a maintainer/developer guide rather than copied verbatim.

It should cover:

- local and validation environments;
- Cloudflare Workers and OpenNext workflows;
- runtime bindings and deployment variables;
- AI provider configuration;
- local and linked Supabase workflows;
- quality and E2E checks;
- links to the more focused documents already under `docs/`.

All commands must match `package.json`. In particular, obsolete generic
Cloudflare script names must be replaced by the current staging and production
variants. Production deployment commands must be clearly separated from local
development commands.

The root README links to `docs/development.md`, and the existing documentation
index is updated only if the repository already maintains an appropriate index
for developer documents.

## Open-source and privacy boundary

The documentation must clearly distinguish the source code from any hosted
deployment:

- Jobi can be self-hosted.
- A person or organisation operating an instance is responsible for evaluating
  its privacy, security, data-retention, subprocessors, cross-border transfers,
  and local legal obligations.
- Resumes and AI conversations can contain personal or sensitive information.
- Operators should review AI, storage, analytics, and payment providers before
  using real personal data.
- The repository does not claim that a deployment is automatically GDPR
  compliant.

This work does not implement regional blocking, consent management, data export,
data deletion, retention automation, or other compliance functionality.

## License

Add the standard GNU Affero General Public License version 3 text as `LICENSE`.
The READMEs identify the project as AGPL-3.0 licensed and link to that file.

No custom license restrictions, hosted-service exceptions, or additional terms
will be introduced.

## Contribution scope

The READMEs provide a concise contribution path:

- read the development guide and repository agent/project documentation;
- create an issue for substantial changes;
- run the documented quality checks before submitting a pull request.

Creating a full `CONTRIBUTING.md`, `SECURITY.md`, or code of conduct is outside
this change. The README must not link to files that do not exist.

## Verification

Before completion:

- verify every local link and image path resolves;
- verify every documented script exists in `package.json`;
- verify the English and Chinese README structures remain substantively aligned;
- verify no credentials or values from local environment files were copied;
- run the repository formatting check on the changed Markdown files, or the
  closest scoped equivalent supported by the project.

No application runtime or UI regression test is required because this change
only affects repository documentation and the license.
