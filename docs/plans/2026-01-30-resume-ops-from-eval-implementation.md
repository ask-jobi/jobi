# Resume Ops From Evaluation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a backend function that converts evaluator natural-language actions into structured `ResumeEditOp[]` using an LLM with strict schema output.

**Architecture:** Create `generateResumeEditOpsFromEvaluation` in `server/ai/resume-ops-from-eval.ts`. It builds a prompt from `evaluation.actions` and a section-scoped resume summary, invokes `generateText` with `Output.object(schema)`, then post-validates/normalizes ops. Tests mock the LLM and validate mapping, normalization, and error handling.

**Tech Stack:** TypeScript, Zod, `ai` SDK (`generateText`/`Output`), Jest

### Task 1: Write failing tests for ops generation

**Files:**
- Create: `server/ai/resume-ops-from-eval.test.ts`

**Step 1: Write the failing test**

```ts
import { generateResumeEditOpsFromEvaluation } from "@/server/ai/resume-ops-from-eval"
import type { ResumeData } from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"

jest.mock("ai", () => ({
  generateText: jest.fn(),
  Output: { object: () => ({}) }
}))

const mockGenerateText = jest.requireMock("ai").generateText as jest.Mock

const baseResume: ResumeData = {
  personalInfo: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "123"
  },
  education: { title: "Education", order: 0, blocks: [] },
  employment: {
    title: "Employment",
    order: 1,
    blocks: [
      {
        company: "ACME",
        jobTitle: "Engineer",
        start: "2020",
        end: "2022",
        content: "Did stuff"
      }
    ]
  },
  skills: { title: "Skills", order: 2, blocks: [] }
}

const evaluation: ResumeEvaluationOutput = {
  gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
  gaps: [],
  actions: [
    {
      priority: "1",
      targetSection: "work_experience",
      instruction: "Update the ACME role to emphasize leadership."
    }
  ]
}

describe("generateResumeEditOpsFromEvaluation", () => {
  it("returns ops from model output", async () => {
    mockGenerateText.mockResolvedValue({
      output: {
        ops: [
          {
            op: "updateBlock",
            section: "employment",
            blockIndex: 0,
            payload: { content: "Led team" }
          }
        ]
      }
    })

    const result = await generateResumeEditOpsFromEvaluation(
      evaluation,
      baseResume,
      "en"
    )

    expect(result.errors).toHaveLength(0)
    expect(result.ops[0].section).toBe("employment")
  })

  it("normalizes out-of-range blockIndex", async () => {
    mockGenerateText.mockResolvedValue({
      output: {
        ops: [
          {
            op: "updateBlock",
            section: "employment",
            blockIndex: 99,
            payload: { content: "X" }
          }
        ]
      }
    })

    const result = await generateResumeEditOpsFromEvaluation(
      evaluation,
      baseResume,
      "en"
    )

    expect(result.errors).toHaveLength(1)
    expect(result.ops).toHaveLength(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test server/ai/resume-ops-from-eval.test.ts`
Expected: FAIL with missing module or export.

**Step 3: Commit**

```bash
git add server/ai/resume-ops-from-eval.test.ts
git commit -m "test: add resume ops from eval generator tests"
```

### Task 2: Implement `generateResumeEditOpsFromEvaluation`

**Files:**
- Create: `server/ai/resume-ops-from-eval.ts`
- Create: `server/ai/prompts/resume-ops-from-eval.prompt.ts`

**Step 1: Write minimal implementation**

```ts
import type { ResumeData } from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import { generateText, Output } from "ai"
import { google } from "@ai-sdk/google"
import z from "zod"
import { resumeOpsFromEvalPrompt } from "@/server/ai/prompts/resume-ops-from-eval.prompt"

const resumeEditOpSchema = z.object({
  op: z.enum(["addBlock", "updateBlock", "removeBlock"]),
  section: z.enum([
    "personalInfo",
    "education",
    "employment",
    "skills",
    "research",
    "projects",
    "publications",
    "awards",
    "certifications"
  ]),
  blockIndex: z.number().optional(),
  payload: z.record(z.any()).optional()
})

const outputSchema = z.object({
  ops: z.array(resumeEditOpSchema)
})

export type GenerateOpsResult = {
  ops: Array<z.infer<typeof resumeEditOpSchema>>
  errors: Array<{ actionIndex: number; message: string }>
}

const mapTargetSection = (target: ResumeEvaluationOutput["actions"][number]["targetSection"]) => {
  switch (target) {
    case "work_experience":
      return "employment"
    default:
      return target
  }
}

const buildSectionSummary = (resume: ResumeData, section: keyof ResumeData) => {
  const data = resume[section]
  if (!data || typeof data !== "object" || !Array.isArray((data as any).blocks)) {
    return []
  }
  return (data as any).blocks.map((block: any, index: number) => ({
    index,
    title: block.title || block.company || block.school || block.group || "",
    content: block.content || ""
  }))
}

export async function generateResumeEditOpsFromEvaluation(
  evaluation: ResumeEvaluationOutput,
  resume: ResumeData,
  language: "en" | "zh" = "en"
): Promise<GenerateOpsResult> {
  const actions = evaluation.actions.map((action, index) => ({
    index,
    instruction: action.instruction,
    targetSection: mapTargetSection(action.targetSection)
  }))

  const sectionsSummary = actions.reduce<Record<string, any[]>>((acc, action) => {
    const section = action.targetSection as keyof ResumeData
    acc[section] = buildSectionSummary(resume, section)
    return acc
  }, {})

  const prompt = resumeOpsFromEvalPrompt.format({
    actions,
    sections: sectionsSummary,
    language
  })

  const { output } = await generateText({
    model: google("gemini-2.0-flash-lite"),
    output: Output.object({ schema: outputSchema }),
    prompt,
    temperature: 0.2,
    maxRetries: 2
  })

  const errors: GenerateOpsResult["errors"] = []
  const ops = output.ops.filter((op, idx) => {
    if (op.op !== "addBlock" && typeof op.blockIndex !== "number") {
      errors.push({ actionIndex: idx, message: "missing blockIndex" })
      return false
    }
    return true
  })

  return { ops, errors }
}
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test server/ai/resume-ops-from-eval.test.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add server/ai/resume-ops-from-eval.ts server/ai/prompts/resume-ops-from-eval.prompt.ts server/ai/resume-ops-from-eval.test.ts
git commit -m "feat: generate resume ops from evaluation"
```

