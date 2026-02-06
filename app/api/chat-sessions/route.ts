import { NextRequest, NextResponse } from "next/server"
import { createSession, listSessions } from "@/lib/agent/chat-history"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list chat session" },
      { status: 500 }
    )
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

    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await createSession({
      userId: user.id,
      resumeId: validationResult.data.resumeId,
      title: validationResult.data.title
    })

    return NextResponse.json(session)
  } catch (error: any) {
    console.error("Create chat session failed:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create chat session" },
      { status: 500 }
    )
  }
}
