import { NextRequest } from "next/server"
import { getJobApplication } from "@/server/resume"
import { consumeQuota } from "@/server/quota"
import type { ResumeData } from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import { generateResumeEditOpsFromEvaluation } from "@/server/ai/resume-ops-from-eval"
import { applyResumeEditOps } from "@/lib/resume/agent-ops"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ALLOWED_PAYLOAD_FIELDS: Record<string, string[]> = {
  education: [
    "content",
    "school",
    "degree",
    "start",
    "end",
    "date",
    "isCurrent"
  ],
  employment: [
    "content",
    "company",
    "jobTitle",
    "start",
    "end",
    "date",
    "isCurrent"
  ],
  skills: ["group", "content"],
  research: ["title", "role", "content", "start", "end", "date", "isCurrent"],
  projects: ["title", "role", "content", "start", "end", "date", "isCurrent"],
  publications: ["title", "date", "description"],
  awards: ["title", "issuer", "date", "description"],
  certifications: ["name", "issuer", "date"]
}

const sanitizePayload = (
  section: string,
  payload: Record<string, any> | undefined
) => {
  if (!payload || typeof payload !== "object") return null
  const allowList = ALLOWED_PAYLOAD_FIELDS[section] ?? []
  const entries = Object.entries(payload).filter(([key]) =>
    allowList.includes(key)
  )
  if (!entries.length) return null
  return Object.fromEntries(entries)
}

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const summarizeBlock = (block: any) => {
  if (!block || typeof block !== "object") return ""
  const parts = [
    block.title ? `Title: ${stringifyValue(block.title)}` : "",
    block.name ? `Name: ${stringifyValue(block.name)}` : "",
    block.company ? `Company: ${stringifyValue(block.company)}` : "",
    block.jobTitle ? `Role: ${stringifyValue(block.jobTitle)}` : "",
    block.school ? `School: ${stringifyValue(block.school)}` : "",
    block.degree ? `Degree: ${stringifyValue(block.degree)}` : "",
    block.group ? `Group: ${stringifyValue(block.group)}` : "",
    block.issuer ? `Issuer: ${stringifyValue(block.issuer)}` : "",
    block.start ? `Start: ${stringifyValue(block.start)}` : "",
    block.end ? `End: ${stringifyValue(block.end)}` : "",
    block.date ? `Date: ${stringifyValue(block.date)}` : "",
    block.isCurrent ? `Current: ${stringifyValue(block.isCurrent)}` : "",
    block.description
      ? `Description: ${stringifyValue(block.description)}`
      : "",
    block.content ? `Content: ${stringifyValue(block.content)}` : ""
  ].filter(Boolean)

  if (!parts.length) {
    return stringifyValue(block)
  }

  return parts.join(" | ")
}

export async function GET(request: NextRequest) {
  try {
    const jobApplicationId =
      request.nextUrl.searchParams.get("jobApplicationId")
    if (!jobApplicationId) {
      return Response.json(
        { error: "缺少 jobApplicationId 参数" },
        { status: 400 }
      )
    }

    const jobApplication = await getJobApplication(jobApplicationId)
    if (!jobApplication) {
      return Response.json({ error: "未找到对应的简历" }, { status: 404 })
    }

    const resumeData = jobApplication.resumes.resume_json as ResumeData
    const evaluationReport = jobApplication.resumes
      .evaluation_report as ResumeEvaluationOutput

    const { ops, errors } = await generateResumeEditOpsFromEvaluation(
      evaluationReport,
      resumeData,
      jobApplication.resumes.language
    )

    const previewErrors = [...errors]
    const opPreviews = ops.flatMap((op, index) => {
      const sanitizedPayload =
        op.op === "addBlock" || op.op === "updateBlock"
          ? sanitizePayload(op.section, op.payload)
          : undefined

      if (
        (op.op === "addBlock" || op.op === "updateBlock") &&
        !sanitizedPayload
      ) {
        previewErrors.push({
          opIndex: index,
          message: "payload has no valid fields"
        })
        return []
      }

      const normalizedOp = {
        ...op,
        ...(sanitizedPayload ? { payload: sanitizedPayload } : {})
      }

      const sectionData = (resumeData as any)[op.section]
      const block =
        typeof op.blockIndex === "number"
          ? sectionData?.blocks?.[op.blockIndex]
          : null
      const before = summarizeBlock(block)
      const afterData = applyResumeEditOps(resumeData, [
        normalizedOp as any
      ]).updatedResumeData
      const afterSection = (afterData as any)[op.section]
      const afterBlock =
        typeof op.blockIndex === "number"
          ? afterSection?.blocks?.[op.blockIndex]
          : normalizedOp.op === "addBlock"
            ? afterSection?.blocks?.[
                typeof normalizedOp.blockIndex === "number"
                  ? normalizedOp.blockIndex
                  : (afterSection?.blocks?.length ?? 1) - 1
              ]
            : null
      const after =
        normalizedOp.op === "removeBlock" ? "" : summarizeBlock(afterBlock)

      if (normalizedOp.op === "updateBlock" && before === after) {
        previewErrors.push({
          opIndex: index,
          message: "no changes detected"
        })
        return []
      }

      return {
        opId: `${op.section}-${op.blockIndex ?? "new"}-${index}`,
        op: normalizedOp,
        title: `${op.op} ${op.section} #${op.blockIndex ?? "new"}`,
        description: "",
        before,
        after
      }
    })

    await consumeQuota("fullOptimize")

    return Response.json({ opPreviews, errors: previewErrors })
  } catch (error: any) {
    console.error("生成简历编辑操作失败:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
