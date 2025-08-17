import { NextRequest } from "next/server";
import { generateAISuggestionQueue } from "@/server/langchain/full-optimize";
import { getJobApplication } from "@/server/resume";
import { ResumeData } from "@/types/resume";
import { consumeQuota } from "@/server/quota";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobApplicationId = searchParams.get('jobApplicationId');

    if (!jobApplicationId) {
      return Response.json({ error: "缺少 jobApplicationId 参数" }, { status: 400 });
    }

    const jobApplication = await getJobApplication(jobApplicationId);
    if (!jobApplication) {
      return Response.json({ error: "未找到对应的简历" }, { status: 404 });
    }

    const resumeData = jobApplication.resumes.resume_json as ResumeData;

    const suggestions = await generateAISuggestionQueue(resumeData, jobApplication.resumes.language);
    
    // 消耗一次 fullOptimize 用量
    await consumeQuota('fullOptimize');

    return Response.json(suggestions);
  } catch (error: any) {
    console.error('生成简历优化建议失败:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
