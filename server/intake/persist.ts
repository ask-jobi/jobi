import { createClient } from "@/lib/supabase/server"
import type { PersistInput, PersistOutput, RollbackRegistry } from "./types"

/**
 * Shared persist capability for both uploaded intake and empty creation.
 * Receives normalized input, creates DB records, and registers rollback
 * via the provided RollbackRegistry.
 *
 * Does NOT depend on AsyncLocalStorage or any orchestration context.
 */
export async function persistApplicationResume(
  input: PersistInput,
  rollback: RollbackRegistry
): Promise<PersistOutput> {
  const supabase = await createClient()

  // 1. Create Job Description
  const { data: jobData, error: jobError } = await supabase
    .from("jobs")
    .insert({
      name: input.jobInfo.name,
      company: input.jobInfo.company,
      description: input.jobInfo.description
    })
    .select("id")
    .single()

  if (jobError) {
    throw new Error(`Failed to create job: ${jobError.message}`)
  }

  rollback.register("db", "delete-job", async () => {
    await supabase.from("jobs").delete().eq("id", jobData.id)
  })

  // 2. Create Application Resume
  const { data: resumeData, error: resumeError } = await supabase
    .from("resumes")
    .insert({
      user_id: input.actorId,
      job_id: jobData.id,
      upload_url: input.uploadedResumePublicUrl,
      language: input.resumeLanguage,
      resume_json: input.resumeData as Record<string, unknown>
    } as any)
    .select("id")
    .single()

  if (resumeError) {
    throw new Error(`Failed to create resume: ${resumeError.message}`)
  }

  rollback.register("db", "delete-resume", async () => {
    await supabase.from("resumes").delete().eq("id", resumeData.id)
  })

  // 3. Create Job Application
  const { data: applicationData, error: applicationError } = await supabase
    .from("job_applications")
    .insert({
      user_id: input.actorId,
      resume_id: resumeData.id,
      job_id: jobData.id,
      optimized_resume_url: null
    })
    .select("id")
    .single()

  if (applicationError) {
    throw new Error(
      `Failed to create job application: ${applicationError.message}`
    )
  }

  rollback.register("db", "delete-application", async () => {
    await supabase
      .from("job_applications")
      .delete()
      .eq("id", applicationData.id)
  })

  return {
    jobData: { id: jobData.id },
    resumeData: { id: resumeData.id },
    applicationData: { id: applicationData.id }
  }
}
