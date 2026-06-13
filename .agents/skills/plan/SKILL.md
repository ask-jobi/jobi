---
name: plan
description: Create a new plan document in docs/plans/current/ with required task checklists. Use when user wants to create a plan, design a feature, or write an implementation plan.
---

# Plan Skill

Create a plan document under `docs/plans/current/` that describes what needs to be done, why, and how — with explicit task checklists for tracking.

## Workflow

### 1. Naming

Use the format `YYYY-MM-DD-<slug>.md`, e.g. `2026-05-20-resume-entry-drag-reorder.md`. The slug should be a short hyphenated description of the topic.

### 2. Required sections

Every plan must include these sections:

| Section | Purpose |
|---|---|
| `## 背景` | Why this plan exists — current state, problems, context |
| `## 目标` | What this plan aims to achieve (bulleted list) |
| `## 非目标` | Explicitly excluded scope to prevent creep |
| `## 任务清单` | **Mandatory** — checkboxes (`- [ ]`) for each deliverable task |
| `## 验收标准` | How to know the plan is done |

### 3. Optional but recommended sections

Add these when they add clarity:

| Section | When to include |
|---|---|
| `## 已确认决策` | When key design decisions are already made |
| `## 代码现状` | When current implementation details matter |
| `## 建议方案` | Technical approach / proposed design |
| `## 实施步骤` | Phased breakdown of tasks |
| `## 测试计划` | Component tests, E2E, regression checks |
| `## 风险` | Known risks and mitigations |
| `## 并行执行建议` | How to split work across agents |

### 4. Task checklist rules

- Every plan **must** have a `## 任务清单` section with checkboxes
- Tasks should be granular enough to verify independently
- Group related tasks under sub-headings (e.g. `### Phase 1: xxx`)
- Use nested checkboxes for task breakdown:

```markdown
## 任务清单

### Phase 1: 数据层

- [ ] 新增 `lib/resume/mutations.ts` 中 `reorderSectionEntries` helper
- [ ] 为 helper 补单元测试
  - [ ] 正常排序
  - [ ] 原位 drop 不触发变更
  - [ ] 越界 index 保持原样

### Phase 2: UI 层

- [ ] 在 `section-entries.tsx` 接入 dnd-kit
- [ ] 增加拖拽手柄组件
```

### 5. Related documents

When the plan relates to existing work, link to:

- Related `docs/plans/current/*.md` plans
- Related `docs/plans/archive/*.md` (for context, not as reference)
- Root `CONTEXT.md` for domain language
- `docs/app-architecture.md` for architectural conventions

### 6. File location

Always write to `docs/plans/current/<filename>.md`. After writing:

1. Update `docs/plans/current/README.md` to include the new plan in the list
2. Confirm the plan file has `- [ ]` task checkboxes present

## Example plan structure

```markdown
# Feature Name

**Date:** YYYY-MM-DD

## 背景

Current state and problem description.

## 目标

- Goal 1
- Goal 2

## 非目标

- Explicitly excluded scope

## 代码现状

Key files and their current behavior:

- `path/to/file.ts` — does X, uses Y

## 建议方案

### 1. Approach A

...

## 任务清单

### Phase 1: Foundation

- [ ] Task description
- [ ] Task description

### Phase 2: Integration

- [ ] Task description
- [ ] Task description

## 测试计划

### 单元 / 组件测试

- [ ] Test scenario
- [ ] Test scenario

### 回归检查

- Scenario to verify manually

## 验收标准

- Criterion 1
- Criterion 2
```
