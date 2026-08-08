"use server"

import { and, eq } from "drizzle-orm"

import { getDatabase } from "@/lib/db/client"
import { resumes } from "@/lib/db/schema"
import { requireVerifiedUserIdentity } from "@/server/auth-helper"
import { evaluateResume } from "@/server/ai/resume-evaluator"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import type { ResumeData } from "@/types/resume"

async function saveEvaluation(
  resumeId: string,
  report: ResumeEvaluationOutput
) {
  const user = await requireVerifiedUserIdentity()
  const db = await getDatabase()
  const updated = await db
    .update(resumes)
    .set({
      evaluationReport: report,
      evaluationReportRefreshFlag: false
    })
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)))
    .returning({ id: resumes.id })

  if (updated.length === 0) {
    throw new Error(`Resume not found with id: ${resumeId}`)
  }
}

export async function evaluateAndSaveResume(
  resumeId: string,
  resumeData: ResumeData,
  jobDescription?: string
) {
  const report = await evaluateResume(resumeData, jobDescription)
  await saveEvaluation(resumeId, report)
  return report
}

export async function updateResumeEvaluationReport(
  resumeId: string,
  report: ResumeEvaluationOutput
) {
  await saveEvaluation(resumeId, report)
  return report
}

export async function updateResumeEvaluationReportRefreshFlag(
  resumeId: string,
  flag: boolean = true
) {
  const user = await requireVerifiedUserIdentity()
  const db = await getDatabase()
  const updated = await db
    .update(resumes)
    .set({ evaluationReportRefreshFlag: flag })
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)))
    .returning({ id: resumes.id })

  if (updated.length === 0) {
    throw new Error(`Resume not found with id: ${resumeId}`)
  }
}
