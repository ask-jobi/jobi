import { NextRequest, NextResponse } from "next/server"
import { createEmptyApplicationResumeRecord } from "@/server/resume"
import { JobInfoFormType } from "@/components/forms/job-information-form"
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobInfo = body.jobInfo as JobInfoFormType
    const language = locales.includes(body.language)
      ? body.language
      : defaultLocale

    if (!jobInfo) {
      return NextResponse.json(
        { error: "No job info provided" },
        { status: 400 }
      )
    }

    const result = await createEmptyApplicationResumeRecord(
      jobInfo,
      language as Locale
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error("Create empty resume failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
