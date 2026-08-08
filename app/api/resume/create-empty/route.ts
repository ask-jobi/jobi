import { NextRequest, NextResponse } from "next/server"
import { JobInfoFormType } from "@/components/forms/job-information-form"
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config"
import { createEmptyResume } from "@/server/intake/empty-orchestrator"
import {
  getOptionalExistingUserIdentity,
  handleApiError
} from "@/server/auth-helper"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const user = await getOptionalExistingUserIdentity()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      jobInfo?: JobInfoFormType | null
      language?: unknown
    }
    const jobInfo = body.jobInfo as JobInfoFormType
    const language = locales.includes(body.language as Locale)
      ? body.language
      : defaultLocale

    if (!jobInfo) {
      return NextResponse.json(
        { error: "No job info provided" },
        { status: 400 }
      )
    }

    const result = await createEmptyResume({
      actorId: user.id,
      jobInfo,
      language: language as Locale
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return handleApiError(error)
  }
}
