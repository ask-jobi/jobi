# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root
- **`docs/adr/`** at the repo root for architecture decisions that touch the area you're about to work in

If either of these files or directories doesn't exist, proceed silently. Don't flag the absence and don't suggest creating them upfront.

## File structure

This repository is configured as a single-context repo.

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-example.md
│   └── 0002-example.md
└── src/
```

## Current repo status

At the time this configuration was created:

- No root `CONTEXT.md` was present
- No root `CONTEXT-MAP.md` was present
- No confirmed root `docs/adr/` directory was present

## Use the glossary's vocabulary

When your output names a domain concept, use the term as defined in `CONTEXT.md`. Avoid drifting to new synonyms if the project later documents a preferred term.

## Scope rule

This repo is not configured as a multi-context codebase. Unless a future root `CONTEXT-MAP.md` is added, skills should assume one shared project context.
