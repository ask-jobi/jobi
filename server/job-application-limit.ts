import "server-only"

import type { AppDatabase } from "@/lib/db/client"
import { countApplications } from "@/server/data/applications"

const JOB_APPLICATION_LIMIT = 20

export async function verifyJobApplicationLimit(
  userId: string,
  db?: AppDatabase
) {
  const applicationCount = await countApplications(userId, db)

  if (applicationCount >= JOB_APPLICATION_LIMIT) {
    throw new Error(
      "You have reached the maximum job application limit. Delete an existing application before creating another."
    )
  }
}
