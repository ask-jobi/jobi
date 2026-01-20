import { NextRequest, NextResponse } from "next/server"
import { evaluateResume } from "@/server/ai/resume-evaluator"

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription } = await request.json()

    if (!resumeData) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 }
      )
    }

    // Call LLM evaluator on the server side
    const result = await evaluateResume(resumeData, jobDescription)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Evaluation error:", error)
    return NextResponse.json(
      {
        error: "Evaluation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
