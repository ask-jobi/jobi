import { isDeepStrictEqual } from "node:util"
import type { Database } from "@/types/supabase"
import type { ResumeData } from "@/types/resume"
import type { SupabaseClient } from "@supabase/supabase-js"
import { insertResumeSnapshot } from "./snapshots"

export async function commitResumeChange({
  supabase,
  actorId,
  resumeId,
  nextResume,
  eventId
}: {
  supabase: SupabaseClient<Database>
  actorId: string
  resumeId: string
  nextResume: ResumeData
  eventId?: string | null
}) {
  const { data: currentResume, error: currentResumeError } = await supabase
    .from("resumes")
    .select("id, user_id, resume_json, current_revision")
    .eq("id", resumeId)
    .single()

  if (currentResumeError) {
    throw currentResumeError
  }

  if (!currentResume) {
    throw new Error(`No resume found with id: ${resumeId}`)
  }

  if (currentResume.user_id !== actorId) {
    throw new Error("Forbidden: You do not own this resume")
  }

  if (!currentResume.resume_json) {
    throw new Error(`Resume data not found for id: ${resumeId}`)
  }

  if (isDeepStrictEqual(currentResume.resume_json, nextResume)) {
    return {
      resume: currentResume.resume_json,
      currentRevision: currentResume.current_revision
    }
  }

  const nextRevision = currentResume.current_revision + 1
  const { error: updateError } = await supabase
    .from("resumes")
    .update({
      resume_json: nextResume,
      current_revision: nextRevision,
      evaluation_report_refresh_flag: true
    })
    .eq("id", resumeId)

  if (updateError) {
    throw updateError
  }

  await insertResumeSnapshot({
    supabase,
    resumeId,
    revision: nextRevision,
    resume: nextResume,
    eventId
  })

  return {
    resume: nextResume,
    currentRevision: nextRevision
  }
}
