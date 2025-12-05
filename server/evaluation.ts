"use server"

import { createClient } from "@/lib/supabase/server"
import { evaluateResume } from "@/lib/evaluation/llm-evaluator"
import type { ResumeEvaluationOutput } from "@/lib/evaluation/types"
import type { ResumeData } from "@/types/resume"


export async function evaluateAndSaveResume(
  resumeId: string,
  resumeData: ResumeData,
  jobDescription?: string
) {
  const supabase = await createClient()

  // Run LLM evaluation
  const report: ResumeEvaluationOutput = await evaluateResume(resumeData, jobDescription)

  // Update resumes table with evaluation report
  const { error } = await supabase
    .from("resumes")
    .update({ evaluation_report: report, evaluation_report_refresh_flag: false } as any)
    .eq("id", resumeId)

  if (error) {
    throw new Error(`Failed to save resume evaluation: ${error.message}`)
  }

  return report
}

export async function updateResumeEvaluationReport(
  resumeId: string,
  report: ResumeEvaluationOutput
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("resumes")
    .update({ evaluation_report: report, evaluation_report_refresh_flag: false } as any)
    .eq("id", resumeId)

  if (error) {
    throw new Error(`Failed to update resume evaluation: ${error.message}`)
  }

  return report
}

export async function updateResumeEvaluationReportRefreshFlag(
  resumeId: string,
  flag: boolean = true
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("resumes")
    .update({ evaluation_report_refresh_flag: flag })
    .eq("id", resumeId)

  if (error) {
    throw new Error(`Failed to update resume evaluation: ${error.message}`)
  }
}
