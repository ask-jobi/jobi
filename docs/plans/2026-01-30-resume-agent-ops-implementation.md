# Resume Agent Ops Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a minimal front-end middle layer to apply backend agent edit operations (add/update/remove blocks) to `ResumeData`.

**Architecture:** Introduce a pure executor in `lib/resume/agent-ops.ts` that applies `ResumeEditOp[]` to `ResumeData` and returns `{ updatedResumeData, appliedOps, errors }`. Optional sections are auto-initialized on `addBlock`. UI will call the executor and then `useResume().updateResumeData` to persist via existing autosave.

**Tech Stack:** TypeScript, Jest, existing `ResumeData` types

### Task 1: Define `ResumeEditOp` types and executor tests

**Files:**
- Create: `lib/resume/agent-ops.test.ts`

**Step 1: Write the failing test**

```ts
import { applyResumeEditOps, type ResumeEditOp } from "@/lib/resume/agent-ops"
import type { ResumeData } from "@/types/resume"

describe("applyResumeEditOps", () => {
  const baseResume: ResumeData = {
    personalInfo: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "123"
    },
    education: { title: "Education", order: 0, blocks: [] },
    employment: { title: "Employment", order: 1, blocks: [] },
    skills: { title: "Skills", order: 2, blocks: [] }
  }

  it("updates an existing block", () => {
    const resume: ResumeData = {
      ...baseResume,
      education: {
        ...baseResume.education,
        blocks: [{ school: "MIT", degree: "BS", start: "2010", end: "2014", content: "Math" }]
      }
    }
    const ops: ResumeEditOp[] = [
      {
        op: "updateBlock",
        section: "education",
        blockIndex: 0,
        payload: { content: "CS" }
      }
    ]

    const result = applyResumeEditOps(resume, ops)

    expect(result.errors).toHaveLength(0)
    expect(result.updatedResumeData.education.blocks[0].content).toBe("CS")
  })

  it("adds a block to optional section and auto-initializes it", () => {
    const ops: ResumeEditOp[] = [
      {
        op: "addBlock",
        section: "projects",
        payload: { title: "ML", content: "Did things" }
      }
    ]

    const result = applyResumeEditOps(baseResume, ops)

    expect(result.errors).toHaveLength(0)
    expect(result.updatedResumeData.projects).toBeTruthy()
    expect(result.updatedResumeData.projects?.blocks).toHaveLength(1)
    expect(result.updatedResumeData.projects?.blocks[0].title).toBe("ML")
  })

  it("removes a block by index", () => {
    const resume: ResumeData = {
      ...baseResume,
      skills: {
        ...baseResume.skills,
        blocks: [{ group: "Lang", content: "TS" }]
      }
    }

    const ops: ResumeEditOp[] = [
      {
        op: "removeBlock",
        section: "skills",
        blockIndex: 0
      }
    ]

    const result = applyResumeEditOps(resume, ops)

    expect(result.errors).toHaveLength(0)
    expect(result.updatedResumeData.skills.blocks).toHaveLength(0)
  })

  it("skips invalid ops and returns errors", () => {
    const ops: ResumeEditOp[] = [
      { op: "updateBlock", section: "education", blockIndex: 99, payload: { content: "X" } }
    ]

    const result = applyResumeEditOps(baseResume, ops)

    expect(result.errors).toHaveLength(1)
    expect(result.updatedResumeData).toEqual(baseResume)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/resume/agent-ops.test.ts`
Expected: FAIL with "Cannot find module" or missing export `applyResumeEditOps`.

**Step 3: Commit**

```bash
git add lib/resume/agent-ops.test.ts
git commit -m "test: add resume agent ops executor tests"
```

### Task 2: Implement `ResumeEditOp` types + executor

**Files:**
- Create: `lib/resume/agent-ops.ts`
- (Optional) Modify: `lib/resume/agent-ops.test.ts`

**Step 1: Write minimal implementation**

```ts
import type { ResumeData, SectionBlock } from "@/types/resume"

export type ResumeEditOp =
  | {
      op: "addBlock"
      section: keyof ResumeData
      blockIndex?: number
      payload: Record<string, any>
    }
  | {
      op: "updateBlock"
      section: keyof ResumeData
      blockIndex: number
      payload: Record<string, any>
    }
  | {
      op: "removeBlock"
      section: keyof ResumeData
      blockIndex: number
    }

export type ResumeEditError = {
  opIndex: number
  code: "SECTION_MISSING" | "INDEX_OUT_OF_RANGE" | "INVALID_PAYLOAD"
  message: string
}

export type ApplyOpsResult = {
  updatedResumeData: ResumeData
  appliedOps: ResumeEditOp[]
  errors: ResumeEditError[]
}

const DEFAULT_SECTION_TITLES: Partial<Record<keyof ResumeData, string>> = {
  education: "Education",
  employment: "Employment",
  skills: "Skills",
  research: "Research",
  projects: "Projects",
  publications: "Publications",
  awards: "Awards",
  certifications: "Certifications"
}

const isSectionBlock = (value: any): value is SectionBlock =>
  value && typeof value === "object" && Array.isArray(value.blocks)

const ensureSection = (
  data: ResumeData,
  section: keyof ResumeData
): ResumeData => {
  const current = data[section]
  if (isSectionBlock(current)) return data

  const maxOrder = Object.values(data)
    .filter(isSectionBlock)
    .reduce((acc, block) => Math.max(acc, block.order ?? 0), 0)

  return {
    ...data,
    [section]: {
      title: DEFAULT_SECTION_TITLES[section] ?? String(section),
      order: maxOrder + 1,
      blocks: []
    }
  } as ResumeData
}

export function applyResumeEditOps(
  resumeData: ResumeData,
  ops: ResumeEditOp[]
): ApplyOpsResult {
  let updated = resumeData
  const appliedOps: ResumeEditOp[] = []
  const errors: ResumeEditError[] = []

  ops.forEach((op, opIndex) => {
    if (op.op === "addBlock") {
      updated = ensureSection(updated, op.section)
      const section = updated[op.section] as SectionBlock
      if (!op.payload || typeof op.payload !== "object") {
        errors.push({
          opIndex,
          code: "INVALID_PAYLOAD",
          message: "addBlock requires payload"
        })
        return
      }
      const blocks = [...section.blocks]
      if (typeof op.blockIndex === "number") {
        blocks.splice(op.blockIndex, 0, op.payload)
      } else {
        blocks.push(op.payload)
      }
      updated = {
        ...updated,
        [op.section]: { ...section, blocks }
      } as ResumeData
      appliedOps.push(op)
      return
    }

    const section = updated[op.section] as SectionBlock | undefined
    if (!section || !Array.isArray(section.blocks)) {
      errors.push({
        opIndex,
        code: "SECTION_MISSING",
        message: `section ${String(op.section)} missing`
      })
      return
    }

    if (op.blockIndex < 0 || op.blockIndex >= section.blocks.length) {
      errors.push({
        opIndex,
        code: "INDEX_OUT_OF_RANGE",
        message: `blockIndex ${op.blockIndex} out of range`
      })
      return
    }

    if (op.op === "updateBlock") {
      if (!op.payload || typeof op.payload !== "object") {
        errors.push({
          opIndex,
          code: "INVALID_PAYLOAD",
          message: "updateBlock requires payload"
        })
        return
      }
      const blocks = [...section.blocks]
      blocks[op.blockIndex] = { ...blocks[op.blockIndex], ...op.payload }
      updated = {
        ...updated,
        [op.section]: { ...section, blocks }
      } as ResumeData
      appliedOps.push(op)
      return
    }

    if (op.op === "removeBlock") {
      const blocks = section.blocks.filter((_, i) => i !== op.blockIndex)
      updated = {
        ...updated,
        [op.section]: { ...section, blocks }
      } as ResumeData
      appliedOps.push(op)
    }
  })

  return { updatedResumeData: updated, appliedOps, errors }
}
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test lib/resume/agent-ops.test.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add lib/resume/agent-ops.ts lib/resume/agent-ops.test.ts
git commit -m "feat: add resume agent ops executor"
```

### Task 3: (Optional) Add a tiny usage hook or example

**Files:**
- Modify: `components/client-components/evaluation-report.tsx` (or a new UI entry point later)

**Step 1: Add a short usage snippet (comment only) or skip**

```ts
// Example usage:
// const { updatedResumeData, errors } = applyResumeEditOps(resumeData, ops)
// updateResumeData(updatedResumeData)
```

**Step 2: Commit**

```bash
git add components/client-components/evaluation-report.tsx
git commit -m "docs: add example usage for resume agent ops"
```

