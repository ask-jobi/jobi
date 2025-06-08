import { NextResponse } from 'next/server';
import type { RewriteBlockRequest } from '@/types/api/requests';
import { ResumeRewriter } from '@/server/langchain/resume-rewriter';

export async function POST(request: Request) {
  try {
    const body: RewriteBlockRequest = await request.json();

    if (!body.originalContent || !body.context.jd || !body.instruction) {
      return NextResponse.json(
        { error: '缺少必要字段' },
        { status: 400 }
      );
    }

    const rewriter = ResumeRewriter.getInstance();
    const response = await rewriter.rewriteBlock({
      originalContent: body.originalContent,
      resumeSummary: body.context.resumeSummary,
      resumeGoal: body.context.resumeGoal,
      jd: body.context.jd,
      relatedSkills: body.context.relatedSkills,
      instruction: body.instruction,
      language: body.language === "zh" ? "zh" : "en",
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
