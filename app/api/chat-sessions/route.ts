import { NextRequest, NextResponse } from "next/server"
import { createSession, listSessions } from "@/lib/agent/chat-history"
import { z } from "zod"
import { getAuthenticatedUser, handleApiError } from "@/server/auth-helpers"

const createSessionSchema = z.object({
  resumeId: z.uuid("Invalid resume ID format"),
  title: z
    .string()
    .max(200, "Title must be less than 200 characters")
    .optional()
})

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get("resumeId")

    if (!resumeId) {
      return NextResponse.json([])
    }

    return NextResponse.json(await listSessions(resumeId))
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

    const user = await getAuthenticatedUser()

    const session = await createSession({
      userId: user.id,
      resumeId: validationResult.data.resumeId,
      title: validationResult.data.title
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error("Create chat session failed:", error)
    return handleApiError(error)
  }
}
