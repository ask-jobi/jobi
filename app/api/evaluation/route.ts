import { NextRequest, NextResponse } from "next/server"
import { evaluateAndSaveResume } from "@/server/evaluation"
import type { ResumeData } from "@/types/resume"

export async function POST(request: NextRequest) {
  try {
    const { resumeId, resumeData, jobDescription } = (await request.json()) as {
      resumeId?: string
      resumeData?: ResumeData
      jobDescription?: string
    }

    if (!resumeId) {
      return NextResponse.json(
        { error: "Resume id is required" },
        { status: 400 }
      )
    }

    if (!resumeData) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 }
      )
    }

    const result = await evaluateAndSaveResume(
      resumeId,
      resumeData,
      jobDescription
    )

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
