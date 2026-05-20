---
name: archive-plan
description: "Archive a completed plan: verify completion against code, update plan with actual results, write final spec to docs/specs/, move to archive, and update READMEs. Use when user says 'archive this plan', '归档这个计划', or wants to record a plan's final outcome."
---

# Archive Plan Skill

Archive a completed plan from `docs/plans/current/` to `docs/plans/archive/`, updating it with actual results and writing a final spec to `docs/specs/`.

## Workflow

### 1. Determine which plan to archive

**If user specifies a plan name or file:**
Use that specific plan.

**If user says nothing specific (default behavior):**
Find the plan with the **latest date prefix** in `docs/plans/current/`:

```bash
ls docs/plans/current/*.md | grep -E '^docs/plans/current/[0-9]{4}-[0-9]{2}-[0-9]{2}-' | sort -r | head -1
```

Then check its completion status before proceeding.

### 2. Verify completion against code

Cross-reference the plan's task checklist with actual code. For each task:

- Search for the relevant functions, components, or files
- Confirm they exist and match the intended behavior
- Check for corresponding tests

Key verification steps:

```bash
# Check if key functions exist
grep -r "<function-name>" lib/ components/ --include="*.ts" --include="*.tsx"

# Check test coverage
find . -path "*/__tests__/*" -name "*.test.*" | xargs grep -l "<feature-name>"

# Compare checklist against code
# For each `- [ ]` item, determine: implemented? tested? docs updated?
```

### 3. Assess completion

| Status | Action |
|---|---|
| All tasks done, code matches | Proceed with full archive |
| All tasks done but some code differs from plan | Update plan to reflect reality, then archive |
| Some tasks incomplete | Update plan noting what was actually completed, then archive |
| Barely started / abandoned | Add `⚠️ 已过期` banner, archive as abandoned |

### 4. Update the plan document

Before moving, update the plan to reflect **what actually happened**. Add a completion block at the top:

```markdown
# Plan Title

> **已完成** — 归档日期：YYYY-MM-DD
>
> **实际落地要点：**
> - Feature X implemented in `path/to/file.ts`
> - Feature Y uses approach Z (differs from original plan by ...)
> - Tests: N tests covering paths A, B, C
>
> **与计划的差异：**
> - Decision D was reversed: ...
> - Scope E was deferred: ...

## 背景

... (original plan content follows)
```

If the plan was superseded (its work absorbed by another plan):

```markdown
> **已过期（superseded）** — 本计划的工作已被 [replacement-plan.md] 覆盖。...
```

### 5. Write final spec to `docs/specs/`

Create a concise spec document that captures the **final state**:

```bash
mkdir -p docs/specs
```

File: `docs/specs/<plan-slug>.md`

The spec should be a clean reference, not a verbose narrative. Use this template:

```markdown
# <Feature Name>

**归档日期:** YYYY-MM-DD
**来源计划:** docs/plans/archive/<plan-file>.md

## 实现了什么

Brief 2-3 sentence summary of what was built.

## 关键文件

| 文件 | 职责 |
|---|---|
| `path/to/file.ts` | What it does |

## 关键行为

- Behavior 1: when X, then Y
- Behavior 2: when A, then B

## 数据 / 接口约定

- Convention or contract that was established

## 与计划的差异

- Difference 1 (if any)

## 未完成 / 后续

- Deferred item (if any)
```

### 6. Move to archive

```bash
mv docs/plans/current/<plan-file>.md docs/plans/archive/
```

### 7. Update READMEs

#### `docs/plans/current/README.md`

Remove the archived plan from the list.

#### `docs/plans/archive/README.md`

Add the plan to the appropriate table:
- `### 已完整落地` for fully completed plans
- `### 已过期（superseded）` for superseded plans

If `docs/plans/archive/README.md` doesn't exist, create it with:

```markdown
# Archived Plans

已完成的 plan。这些是**历史记录**，不再作为活跃参考源。

## 归档规则

- 已完整落地 → 更新为结果记录
- 已被后续 plan 取代 → 标注 `已过期（superseded）`
- 被放弃 → 标注失效原因和日期

## 文件索引

### 已完整落地
| 文件 | 内容 |
|---|---|
| ... | ... |

### 已过期（superseded）
| 文件 | 取代者 |
|---|---|
| ... | ... |
```

### 8. Final validation

```bash
# Verify the plan moved
ls docs/plans/archive/<plan-file>.md

# Verify the spec was created
ls docs/specs/<plan-slug>.md

# Quick sanity: check README is consistent
cat docs/plans/current/README.md
```

## Example session

```
User: "归档这个计划"

Agent:
1. Finds latest plan: 2026-05-20-resume-section-manual-reorder.md
2. Verifies completion: grep for moveSectionInResume, moveSectionAndPersist,
   ResumeSectionReorderControls, normalizeSectionOrder, modern template changes
3. Updates plan with completion banner + actual code paths
4. Writes docs/specs/resume-section-manual-reorder.md
5. Moves to archive/
6. Updates current/README.md and archive/README.md
```

## Edge cases

- **Plan has no date prefix**: use the plan's filename slug as the spec filename
- **Spec directory missing**: create `docs/specs/` with `mkdir -p`
- **Archive README missing**: create one with the template above
- **Plan is already in archive**: warn user, skip
- **Multiple plans share same date**: ask user which one to archive
- **Plan references are stale**: when writing the spec, verify code paths are current, not just copy-paste from the plan text
