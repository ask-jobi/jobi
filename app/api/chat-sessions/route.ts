import { NextRequest, NextResponse } from "next/server"
import { getOrCreateCanonicalSessionSummary } from "@/lib/agent/chat-history"
import { z } from "zod"
import {
  requireVerifiedUserIdentity,
  handleApiError
} from "@/server/auth-helper"

const createSessionSchema = z.object({
  resumeId: z.uuid("Invalid resume ID format")
})

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await requireVerifiedUserIdentity()
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get("resumeId")

    if (!resumeId) {
      return NextResponse.json(null)
    }

    return NextResponse.json(
      await getOrCreateCanonicalSessionSummary({
        userId: user.id,
        resumeId
      })
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = createSessionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const user = await requireVerifiedUserIdentity()

    const session = await getOrCreateCanonicalSessionSummary({
      userId: user.id,
      resumeId: validationResult.data.resumeId
    })

    return NextResponse.json(session)
  } catch (error) {
    return handleApiError(error)
  }
}
