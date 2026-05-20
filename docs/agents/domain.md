# Domain Docs

How engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root
- **`docs/adr/`** at the repo root if it exists and the area you're touching has ADRs

If `docs/adr/` is absent, proceed silently. Do not block on it.

## File structure

This repository is currently a **single-context repo**.

```text
/
├── CONTEXT.md
├── app/
├── components/
├── docs/
│   ├── agents/
│   └── plans/
├── lib/
├── server/
└── types/
```

## Current repo status

At the time of this update:

- Root `CONTEXT.md` **exists** and defines the canonical resume-editor vocabulary
- No confirmed root `CONTEXT-MAP.md` is present
- No confirmed root `docs/adr/` directory is present

## Use the glossary's vocabulary

When naming domain concepts, prefer the terms defined in `CONTEXT.md`:

- Application Resume
- Job Application
- Job Description
- Section
- Entry
- Evaluation Report
- Chat Session

Avoid reintroducing old synonyms such as `block`, `draft resume`, or `JD` as the primary term in summaries and plans.

## Scope rule

Unless a future root `CONTEXT-MAP.md` is added, skills should assume one shared project context across the repo.
