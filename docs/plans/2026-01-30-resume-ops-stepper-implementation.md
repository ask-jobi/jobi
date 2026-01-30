# Resume Ops Stepper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace tour-based suggestions with a right-panel stepper that lets users review and apply ops one-by-one.

**Architecture:** `/api/resume/ops-from-evaluation` returns `opPreviews` (op + before/after + text). Frontend `EvaluationReport` switches to a stepper view that shows diffs and Apply/Skip per op. Applying uses `applyResumeEditOps` for a single op and updates form state.

**Tech Stack:** Next.js App Router, React Hook Form, TypeScript, diff

### Task 1: Define backend response type and tests

**Files:**
- Create: `app/api/resume/ops-from-evaluation/route.test.ts` (update or add new tests)
- Modify: `app/api/resume/ops-from-evaluation/route.ts`

**Step 1: Write failing test**

```ts
import { GET } from "./route"
import { getJobApplication } from "@/server/resume"
import { generateResumeEditOpsFromEvaluation } from "@/server/ai/resume-ops-from-eval"
import { NextRequest } from "next/server"

jest.mock("@/server/resume", () => ({ getJobApplication: jest.fn() }))
jest.mock("@/server/ai/resume-ops-from-eval", () => ({
  generateResumeEditOpsFromEvaluation: jest.fn()
}))

const mockGetJobApplication = getJobApplication as jest.MockedFunction<typeof getJobApplication>
const mockGenerateOps = generateResumeEditOpsFromEvaluation as jest.MockedFunction<typeof generateResumeEditOpsFromEvaluation>

const createRequest = () =>
  new NextRequest("http://localhost:3000/api/resume/ops-from-evaluation?jobApplicationId=job-app-123")

describe("GET /api/resume/ops-from-evaluation", () => {
  it("returns opPreviews", async () => {
    mockGetJobApplication.mockResolvedValue({
      resumes: { resume_json: { personalInfo: {}, education: { title: "", order: 0, blocks: [] }, employment: { title: "", order: 1, blocks: [] }, skills: { title: "", order: 2, blocks: [] } }, evaluation_report: { gates: { ats: "pass", hr: "pass", hiringManager: "pass" }, gaps: [], actions: [] }, language: "en" },
      jobs: { description: "" }
    } as any)
    mockGenerateOps.mockResolvedValue({ ops: [], errors: [] })

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.opPreviews).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/api/resume/ops-from-evaluation/route.test.ts`
Expected: FAIL with missing `opPreviews` shape.

**Step 3: Commit**

```bash
git add app/api/resume/ops-from-evaluation/route.test.ts
 git commit -m "test: expect op previews from ops api"
```

### Task 2: Implement opPreviews generation in API

**Files:**
- Modify: `app/api/resume/ops-from-evaluation/route.ts`

**Step 1: Implement minimal previews**

```ts
const opPreviews = ops.map((op, index) => {
  const sectionData = resumeData[op.section]
  const block = sectionData?.blocks?.[op.blockIndex ?? -1]
  const before = block?.content ?? ""
  const after = op.op === "updateBlock" ? op.payload?.content ?? before : before
  return {
    opId: `${op.section}-${op.blockIndex ?? "new"}-${index}`,
    op,
    title: `${op.op} ${op.section} #${op.blockIndex ?? "new"}`,
    description: "",
    before,
    after
  }
})
```

Return `{ opPreviews, errors }`.

**Step 2: Run test**

Run: `pnpm test app/api/resume/ops-from-evaluation/route.test.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add app/api/resume/ops-from-evaluation/route.ts
 git commit -m "feat: return op previews from ops api"
```

### Task 3: Add stepper UI in EvaluationReport

**Files:**
- Modify: `components/client-components/evaluation-report.tsx`

**Step 1: Implement stepper UI**
- Add local state: `opPreviews`, `currentIndex`, `statusMap`
- Add render path for stepper when `opPreviews.length > 0`
- Show diff using `diff` package for `before/after`
- Apply uses `applyResumeEditOps(current, [currentOp])`

**Step 2: Commit**

```bash
git add components/client-components/evaluation-report.tsx
 git commit -m "feat: add ops stepper in evaluation report"
```

