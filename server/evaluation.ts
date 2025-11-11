"use server"

import { createClient } from "@/lib/supabase/server"
import { evaluateResume } from "@/lib/evaluation/llm-evaluator"
import type { ResumeEvaluationOutput } from "@/lib/evaluation/types"
import type { ResumeData } from "@/types/resume"

/**
 * Run AI evaluation and persist the output to database.
 * Stores evaluation_report directly in resumes table as jsonb column.
 */
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
    .update({ evaluation_report: report } as any)
    .eq("id", resumeId)

  if (error) {
    throw new Error(`Failed to save resume evaluation: ${error.message}`)
  }

  return report
}


