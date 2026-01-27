import { NextRequest } from "next/server"
import { generateAISuggestionQueue } from "@/server/ai/full-optimize"
import { getJobApplication } from "@/server/resume"
import { ResumeData, ResumeJobDescription } from "@/types/resume"
import { consumeQuota, verifyQuota, getUserSubscription } from "@/server/quota"
import { ResumeEvaluationOutput } from "@/types/evaluation"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobApplicationId = searchParams.get("jobApplicationId")

    if (!jobApplicationId) {
      return Response.json(
        { error: "缺少 jobApplicationId 参数" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return Response.json({ error: "用户未登录" }, { status: 401 })
    }

    const jobApplication = await getJobApplication(jobApplicationId)
    if (!jobApplication) {
      return Response.json({ error: "未找到对应的简历" }, { status: 404 })
    }

    const resumeData = jobApplication.resumes.resume_json as ResumeData
    const jobDescription = jobApplication.jobs as ResumeJobDescription
    const resumeEvaluationReport = jobApplication.resumes
      .evaluation_report as ResumeEvaluationOutput

    const subscription = await getUserSubscription()
    verifyQuota("fullOptimize", subscription.quotas)

    const suggestions = await generateAISuggestionQueue(
      resumeData,
      jobDescription,
      resumeEvaluationReport,
      jobApplication.resumes.language
    )

    await consumeQuota("fullOptimize")

    return Response.json(suggestions)
  } catch (error: any) {
    console.error("生成简历优化建议失败:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
