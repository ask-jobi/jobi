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

    const opPreviews = ops.map((op, index) => {
      const sectionData = (resumeData as any)[op.section]
      const block =
        typeof op.blockIndex === "number"
          ? sectionData?.blocks?.[op.blockIndex]
          : null
      const before = block?.content ?? ""
      const after =
        op.op === "updateBlock" ? op.payload?.content ?? before : before

      return {
        opId: `${op.section}-${op.blockIndex ?? "new"}-${index}`,
        op,
        title: `${op.op} ${op.section} #${op.blockIndex ?? "new"}`,
        description: "",
        before,
        after
      }
    })

    await consumeQuota("fullOptimize")

    return Response.json({ opPreviews, errors })
  } catch (error: any) {
    console.error("生成简历编辑操作失败:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
