import type { AppDatabase } from "@/lib/db/client"
import { resumeSnapshots } from "@/lib/db/schema"
import type { ResumeData } from "@/types/resume"

export async function insertResumeSnapshot({
  db,
  resumeId,
  revision,
  resume,
  eventId
}: {
  db: AppDatabase
  resumeId: string
  revision: number
  resume: ResumeData
  eventId?: string | null
}) {
  await db.insert(resumeSnapshots).values({
    id: crypto.randomUUID(),
    resumeId,
    revision,
    resumeJson: resume,
    eventId: eventId ?? null
  })
}
