# Resume Ops API + Frontend Apply Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename `/api/resume/full-suggestion` to `/api/resume/ops-from-evaluation`, return edit ops, and update one frontend button to call it and apply ops via `applyResumeEditOps`.

**Architecture:** Add a new API route that returns `{ ops, errors }` from `generateResumeEditOpsFromEvaluation`. Update `EvaluationReport` "one-click optimize" button to call the new route and apply ops to form state. Leave old route in place (not deleted) for minimal change.

**Tech Stack:** Next.js App Router, TypeScript, React Hook Form, Jest

### Task 1: Add new API route tests (ops-from-evaluation)

**Files:**
- Create: `app/api/resume/ops-from-evaluation/route.test.ts`

**Step 1: Write the failing test**

```ts
import { GET } from "./route"
import { getJobApplication } from "@/server/resume"
import { generateResumeEditOpsFromEvaluation } from "@/server/ai/resume-ops-from-eval"
import { NextRequest } from "next/server"
import type { ResumeData } from "@/types/resume"
import { Locale } from "@/lib/i18n/config"

jest.mock("@/server/resume", () => ({
  getJobApplication: jest.fn()
}))

jest.mock("@/server/ai/resume-ops-from-eval", () => ({
  generateResumeEditOpsFromEvaluation: jest.fn()
}))

const mockGetJobApplication = getJobApplication as jest.MockedFunction<
  typeof getJobApplication
>
const mockGenerateOps = generateResumeEditOpsFromEvaluation as jest.MockedFunction<
  typeof generateResumeEditOpsFromEvaluation
>

const mockResumeData: ResumeData = {
  personalInfo: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890"
  },
  education: { title: "Education", order: 1, blocks: [] },
  employment: { title: "Employment", order: 2, blocks: [] },
  skills: { title: "Skills", order: 3, blocks: [] }
}

const mockJobApplication = {
  id: "job-app-123",
  resumes: {
    id: "resume-123",
    language: "en" as Locale,
    resume_json: mockResumeData,
    evaluation_report: {
      gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
      gaps: [],
      actions: []
    }
  },
  jobs: {
    id: "job-123",
    name: "Frontend Developer",
    company: "Tech Corp",
    description: "We are looking..."
  }
}

const createMockRequest = (jobApplicationId?: string) => {
  const url = new URL("http://localhost:3000/api/resume/ops-from-evaluation")
  if (jobApplicationId) url.searchParams.set("jobApplicationId", jobApplicationId)
  return new NextRequest(url.toString(), { method: "GET" })
}

describe("GET /api/resume/ops-from-evaluation", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns ops payload", async () => {
    mockGetJobApplication.mockResolvedValue(mockJobApplication as any)
    mockGenerateOps.mockResolvedValue({ ops: [], errors: [] })

    const response = await GET(createMockRequest("job-app-123"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ ops: [], errors: [] })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/api/resume/ops-from-evaluation/route.test.ts`
Expected: FAIL with missing module or export.

**Step 3: Commit**

```bash
git add app/api/resume/ops-from-evaluation/route.test.ts
git commit -m "test: add ops-from-evaluation route"
```

### Task 2: Implement new API route

**Files:**
- Create: `app/api/resume/ops-from-evaluation/route.ts`

**Step 1: Implement minimal route**

```ts
import { NextRequest } from "next/server"
import { getJobApplication } from "@/server/resume"
import { consumeQuota } from "@/server/quota"
import type { ResumeData } from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import { generateResumeEditOpsFromEvaluation } from "@/server/ai/resume-ops-from-eval"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const jobApplicationId = request.nextUrl.searchParams.get("jobApplicationId")
    if (!jobApplicationId) {
      return Response.json({ error: "缺少 jobApplicationId 参数" }, { status: 400 })
    }

    const jobApplication = await getJobApplication(jobApplicationId)
    if (!jobApplication) {
      return Response.json({ error: "未找到对应的简历" }, { status: 404 })
    }

    const resumeData = jobApplication.resumes.resume_json as ResumeData
    const evaluationReport = jobApplication.resumes
      .evaluation_report as ResumeEvaluationOutput

    const result = await generateResumeEditOpsFromEvaluation(
      evaluationReport,
      resumeData,
      jobApplication.resumes.language
    )

    await consumeQuota("fullOptimize")

    return Response.json(result)
  } catch (error: any) {
    console.error("生成简历编辑操作失败:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test app/api/resume/ops-from-evaluation/route.test.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add app/api/resume/ops-from-evaluation/route.ts app/api/resume/ops-from-evaluation/route.test.ts
git commit -m "feat: add ops-from-evaluation api"
```

### Task 3: Update one frontend button to use new API + apply ops

**Files:**
- Modify: `components/client-components/evaluation-report.tsx`

**Step 1: Write failing test (skip - no frontend test harness)**

**Step 2: Implement minimal change**

```ts
import { applyResumeEditOps } from "@/lib/resume/agent-ops"

// inside handleFullResumeOptimizing
const response = await fetch(
  `/api/resume/ops-from-evaluation?jobApplicationId=${application.id}`
)
if (!response.ok) throw new Error(await response.text())
const { ops, errors } = await response.json()
const current = getValues()
const { updatedResumeData } = applyResumeEditOps(current, ops)

Object.entries(updatedResumeData).forEach(([key, value]) => {
  setValue(key as keyof ResumeData, value as any, {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true
  })
})

if (errors?.length) toast.error(`部分操作未应用: ${errors.length}`)
```

**Step 3: Commit**

```bash
git add components/client-components/evaluation-report.tsx
git commit -m "feat: apply resume ops from evaluation on optimize"
```

