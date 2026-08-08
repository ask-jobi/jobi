import { isDeepStrictEqual } from "node:util"
import { and, eq } from "drizzle-orm"

import type { AppDatabase } from "@/lib/db/client"
import { resumes } from "@/lib/db/schema"
import { normalizeResumeDateRanges } from "@/lib/resume/date-ranges"
import type { AuthoritativeResumeState, ResumeData } from "@/types/resume"
import { insertResumeSnapshot } from "./snapshots"

export class ResumeCommitError extends Error {
  constructor(
    message: string,
    public code:
      | "stale-json-conflict"
      | "semantic-conflict"
      | "concurrent-update-conflict"
      | "snapshot-insert-failed",
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = "ResumeCommitError"
  }
}

type CurrentResumeRow = {
  id: string
  userId: string
  resumeJson: ResumeData
  currentRevision: number
}

type ResumeCommitResult<TMetadata = undefined> = AuthoritativeResumeState & {
  baseRevision: number
  metadata: TMetadata
}

type ResumeOperationResult<TMetadata> = {
  nextResume: ResumeData
  metadata: TMetadata
}

async function readCurrentResume({
  db,
  actorId,
  resumeId
}: {
  db: AppDatabase
  actorId: string
  resumeId: string
}): Promise<CurrentResumeRow> {
  const [currentResume] = await db
    .select({
      id: resumes.id,
      userId: resumes.userId,
      resumeJson: resumes.resumeJson,
      currentRevision: resumes.currentRevision
    })
    .from(resumes)
    .where(eq(resumes.id, resumeId))
    .limit(1)

  if (!currentResume) {
    throw new Error(`No resume found with id: ${resumeId}`)
  }

  if (currentResume.userId !== actorId) {
    throw new Error("Forbidden: You do not own this resume")
  }

  if (!currentResume.resumeJson) {
    throw new Error(`Resume data not found for id: ${resumeId}`)
  }

  return {
    ...currentResume,
    resumeJson: normalizeResumeDateRanges(currentResume.resumeJson)
  }
}

async function rollbackCommittedResumeUpdate({
  db,
  resumeId,
  expectedRevision,
  previousResume,
  previousRevision
}: {
  db: AppDatabase
  resumeId: string
  expectedRevision: number
  previousResume: ResumeData
  previousRevision: number
}) {
  await db
    .update(resumes)
    .set({
      resumeJson: previousResume,
      currentRevision: previousRevision,
      evaluationReportRefreshFlag: true
    })
    .where(
      and(
        eq(resumes.id, resumeId),
        eq(resumes.currentRevision, expectedRevision)
      )
    )
}

async function updateResumeAtRevision({
  db,
  resumeId,
  expectedRevision,
  nextRevision,
  nextResume
}: {
  db: AppDatabase
  resumeId: string
  expectedRevision: number
  nextRevision: number
  nextResume: ResumeData
}) {
  const updated = await db
    .update(resumes)
    .set({
      resumeJson: nextResume,
      currentRevision: nextRevision,
      evaluationReportRefreshFlag: true
    })
    .where(
      and(
        eq(resumes.id, resumeId),
        eq(resumes.currentRevision, expectedRevision)
      )
    )
    .returning({ id: resumes.id })

  return updated.length !== 0
}

async function commitNormalizedResume<TMetadata>({
  db,
  resumeId,
  currentResume,
  nextResume,
  eventId,
  metadata
}: {
  db: AppDatabase
  resumeId: string
  currentResume: CurrentResumeRow
  nextResume: ResumeData
  eventId?: string | null
  metadata: TMetadata
}): Promise<ResumeCommitResult<TMetadata> | null> {
  const normalizedCurrentResume = currentResume.resumeJson
  const normalizedNextResume = normalizeResumeDateRanges(nextResume)

  if (isDeepStrictEqual(normalizedCurrentResume, normalizedNextResume)) {
    return {
      resume: normalizedCurrentResume,
      currentRevision: currentResume.currentRevision,
      baseRevision: currentResume.currentRevision,
      metadata
    }
  }

  const nextRevision = currentResume.currentRevision + 1
  const didUpdate = await updateResumeAtRevision({
    db,
    resumeId,
    expectedRevision: currentResume.currentRevision,
    nextRevision,
    nextResume: normalizedNextResume
  })

  if (!didUpdate) {
    return null
  }

  try {
    await insertResumeSnapshot({
      db,
      resumeId,
      revision: nextRevision,
      resume: normalizedNextResume,
      eventId
    })
  } catch (error) {
    await rollbackCommittedResumeUpdate({
      db,
      resumeId,
      expectedRevision: nextRevision,
      previousResume: normalizedCurrentResume,
      previousRevision: currentResume.currentRevision
    }).catch((rollbackError) => {
      console.error(
        "Failed to compensate resume snapshot failure:",
        rollbackError
      )
    })

    throw new ResumeCommitError(
      "Resume update was rolled back because snapshot insert failed.",
      "snapshot-insert-failed",
      { cause: error }
    )
  }

  return {
    resume: normalizedNextResume,
    currentRevision: nextRevision,
    baseRevision: currentResume.currentRevision,
    metadata
  }
}

export async function commitResumeChange({
  db,
  actorId,
  resumeId,
  nextResume,
  eventId,
  baseRevision
}: {
  db: AppDatabase
  actorId: string
  resumeId: string
  nextResume: ResumeData
  eventId?: string | null
  baseRevision?: number | null
}): Promise<AuthoritativeResumeState> {
  const currentResume = await readCurrentResume({
    db,
    actorId,
    resumeId
  })

  if (
    typeof baseRevision === "number" &&
    currentResume.currentRevision !== baseRevision
  ) {
    throw new ResumeCommitError(
      `Resume changed from revision ${baseRevision} to ${currentResume.currentRevision}. Please reload before saving.`,
      "stale-json-conflict"
    )
  }

  const commitResult = await commitNormalizedResume({
    db,
    resumeId,
    currentResume,
    nextResume,
    eventId,
    metadata: undefined
  })

  if (!commitResult) {
    throw new ResumeCommitError(
      "Resume changed while saving. Please retry.",
      "stale-json-conflict"
    )
  }

  return {
    resume: commitResult.resume,
    currentRevision: commitResult.currentRevision
  }
}

export async function commitResumeOperation<TMetadata>({
  db,
  actorId,
  resumeId,
  eventId,
  operation,
  maxAttempts = 3
}: {
  db: AppDatabase
  actorId: string
  resumeId: string
  eventId?: string | null
  operation: (input: {
    resume: ResumeData
    currentRevision: number
  }) =>
    | Promise<ResumeOperationResult<TMetadata>>
    | ResumeOperationResult<TMetadata>
  maxAttempts?: number
}): Promise<ResumeCommitResult<TMetadata>> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const currentResume = await readCurrentResume({
      db,
      actorId,
      resumeId
    })
    const { nextResume, metadata } = await operation({
      resume: currentResume.resumeJson,
      currentRevision: currentResume.currentRevision
    })

    const commitResult = await commitNormalizedResume({
      db,
      resumeId,
      currentResume,
      nextResume,
      eventId,
      metadata
    })

    if (commitResult) {
      return commitResult
    }
  }

  throw new ResumeCommitError(
    `Resume changed during ${maxAttempts} consecutive operation commit attempts.`,
    "concurrent-update-conflict"
  )
}
