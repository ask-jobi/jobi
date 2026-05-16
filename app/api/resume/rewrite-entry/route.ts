import { NextResponse } from "next/server"
import type { RewriteEntryRequest } from "@/types/api/requests"
import { rewriteEntry } from "@/server/ai/resume-entry-rewriter"

export async function POST(request: Request) {
  try {
    const body: RewriteEntryRequest = await request.json()

    if (!body.originalContent || !body.jd || !body.instruction) {
      return NextResponse.json(
        { error: "required fields are missed" },
        { status: 400 }
      )
    }

    const response = await rewriteEntry({
      resumeSection: body.resumeSection,
      originalContent: body.originalContent,
      jd: body.jd,
      instruction: body.instruction,
      language: body.language
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("an error occurred while processing the request:", error)
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    )
  }
}
