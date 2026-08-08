import { and, eq } from "drizzle-orm"

import { getDatabase } from "@/lib/db/client"
import {
  jobApplications,
  jobs,
  resumes,
  resumeSnapshots
} from "@/lib/db/schema"
import type { PersistInput, PersistOutput, RollbackRegistry } from "./types"

/**
 * Shared persist capability for both uploaded intake and empty creation.
 * Database records are inserted atomically through a D1 batch.
 */
export async function persistApplicationResume(
  input: PersistInput,
  rollback: RollbackRegistry
): Promise<PersistOutput> {
  const db = await getDatabase()
  const jobId = crypto.randomUUID()
  const resumeId = crypto.randomUUID()
  const applicationId = crypto.randomUUID()

  await db.batch([
    db.insert(jobs).values({
      id: jobId,
      userId: input.userId,
      name: input.jobInfo.name,
      company: input.jobInfo.company,
      description: input.jobInfo.description
    }),
    db.insert(resumes).values({
      id: resumeId,
      userId: input.userId,
      jobId,
      language: input.resumeLanguage,
      resumeJson: input.resumeData
    }),
    db.insert(resumeSnapshots).values({
      id: crypto.randomUUID(),
      resumeId,
      revision: 1,
      resumeJson: input.resumeData
    }),
    db.insert(jobApplications).values({
      id: applicationId,
      userId: input.userId,
      resumeId,
      jobId
    })
  ])

  rollback.register("db", "delete-application-data", async () => {
    await db.batch([
      db
        .delete(resumes)
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, input.userId))),
      db
        .delete(jobs)
        .where(and(eq(jobs.id, jobId), eq(jobs.userId, input.userId)))
    ])
  })

  return {
    jobData: { id: jobId },
    resumeData: { id: resumeId },
    applicationData: { id: applicationId }
  }
}
