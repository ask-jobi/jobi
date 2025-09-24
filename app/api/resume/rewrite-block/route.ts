import { NextResponse } from 'next/server';
import type { RewriteBlockRequest } from '@/types/api/requests';
import {rewriteBlock} from '@/server/langchain/resume-rewriter';
import { consumeQuota } from '@/server/quota';

export async function POST(request: Request) {
  try {
    const body: RewriteBlockRequest = await request.json();

    if (!body.originalContent || !body.context.jd || !body.instruction) {
      return NextResponse.json(
        { error: 'required fields are missed' },
        { status: 400 }
      );
    }

    const response = await rewriteBlock({
      resumeSection: body.resumeSection,
      originalContent: body.originalContent,
      section: body.context.sectionType,
      jd: body.context.jd,
      instruction: body.instruction,
      language: body.language,
    });

    await consumeQuota('blockOptimize');

    return NextResponse.json(response);
  } catch (error) {
    console.error('an error occurred while processing the request:', error);
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 }
    );
  }
}
