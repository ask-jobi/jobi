import { NextRequest, NextResponse } from 'next/server';
import {evaluateResume} from "@/lib/evaluation/llm-evaluator";

export async function POST(request: NextRequest) {
  try {
    const { resumeData, rules } = await request.json();

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    // Call LLM evaluator on the server side
    const result = await evaluateResume(resumeData, rules);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Subjective evaluation error:', error);
    return NextResponse.json(
      {
        error: 'Subjective evaluation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
