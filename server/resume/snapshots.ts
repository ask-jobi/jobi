import type { Database } from "@/types/supabase"
import type { ResumeData } from "@/types/resume"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function insertResumeSnapshot({
  supabase,
  resumeId,
  revision,
  resume,
  eventId
}: {
  supabase: SupabaseClient<Database>
  resumeId: string
  revision: number
  resume: ResumeData
  eventId?: string | null
}) {
  const { error } = await supabase.from("resumes_snapshot").insert({
    resume_id: resumeId,
    revision,
    resume_json: resume,
    event_id: eventId ?? null
  })

  if (error) {
    throw error
  }
}
