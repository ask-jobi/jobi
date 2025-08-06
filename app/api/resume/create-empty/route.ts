import { NextRequest, NextResponse } from "next/server";
import { createEmptyResumeRecord } from "@/server/resume";
import { JobInfoFormType } from "@/components/client-components/job-information-form";
import { consumeQuota } from "@/server/quota";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await consumeQuota("credits")

    const body = await request.json()
    const jobInfo = body.jobInfo as JobInfoFormType

    if (!jobInfo) {
      return NextResponse.json({ error: "No job info provided" }, { status: 400 })
    }

    const result = await createEmptyResumeRecord(jobInfo);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Create empty resume failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 