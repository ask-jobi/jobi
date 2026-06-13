import { isDeepStrictEqual } from "node:util"
import type { Database } from "@/types/supabase"
import type { AuthoritativeResumeState, ResumeData } from "@/types/resume"
import type { SupabaseClient } from "@supabase/supabase-js"
import { insertResumeSnapshot } from "./snapshots"
import { normalizeResumeDateRanges } from "@/lib/resume/date-ranges"

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
  user_id: string | null
  resume_json: unknown
  current_revision: number
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
  supabase,
  actorId,
  resumeId
}: {
  supabase: SupabaseClient<Database>
  actorId: string
  resumeId: string
}): Promise<CurrentResumeRow> {
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

  return {
    ...currentResume,
    resume_json: normalizeResumeDateRanges(
      currentResume.resume_json as ResumeData
    )
  }
}

async function rollbackCommittedResumeUpdate({
  supabase,
  resumeId,
  expectedRevision,
  previousResume,
  previousRevision
}: {
  supabase: SupabaseClient<Database>
  resumeId: string
  expectedRevision: number
  previousResume: ResumeData
  previousRevision: number
}) {
  await supabase
    .from("resumes")
    .update({
      resume_json: previousResume,
      current_revision: previousRevision,
      evaluation_report_refresh_flag: true
    })
    .eq("id", resumeId)
    .eq("current_revision", expectedRevision)
}

async function updateResumeAtRevision({
  supabase,
  resumeId,
  expectedRevision,
  nextRevision,
  nextResume
}: {
  supabase: SupabaseClient<Database>
  resumeId: string
  expectedRevision: number
  nextRevision: number
  nextResume: ResumeData
}) {
  const updateQuery = supabase
    .from("resumes")
    .update(
      {
        resume_json: nextResume,
        current_revision: nextRevision,
        evaluation_report_refresh_flag: true
      },
      { count: "exact" }
    )
    .eq("id", resumeId)
    .eq("current_revision", expectedRevision)

  const { error, count } = await updateQuery

  if (error) {
    throw error
  }

  return count !== 0
}

async function commitNormalizedResume<TMetadata>({
  supabase,
  resumeId,
  currentResume,
  nextResume,
  eventId,
  metadata
}: {
  supabase: SupabaseClient<Database>
  resumeId: string
  currentResume: CurrentResumeRow
  nextResume: ResumeData
  eventId?: string | null
  metadata: TMetadata
}): Promise<ResumeCommitResult<TMetadata> | null> {
  const normalizedCurrentResume = currentResume.resume_json as ResumeData
  const normalizedNextResume = normalizeResumeDateRanges(nextResume)

  if (isDeepStrictEqual(normalizedCurrentResume, normalizedNextResume)) {
    return {
      resume: normalizedCurrentResume,
      currentRevision: currentResume.current_revision,
      baseRevision: currentResume.current_revision,
      metadata
    }
  }

  const nextRevision = currentResume.current_revision + 1
  const didUpdate = await updateResumeAtRevision({
    supabase,
    resumeId,
    expectedRevision: currentResume.current_revision,
    nextRevision,
    nextResume: normalizedNextResume
  })

  if (!didUpdate) {
    return null
  }

  try {
    await insertResumeSnapshot({
      supabase,
      resumeId,
      revision: nextRevision,
      resume: normalizedNextResume,
      eventId
    })
  } catch (error) {
    await rollbackCommittedResumeUpdate({
      supabase,
      resumeId,
      expectedRevision: nextRevision,
      previousResume: normalizedCurrentResume,
      previousRevision: currentResume.current_revision
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
    baseRevision: currentResume.current_revision,
    metadata
  }
}

export async function commitResumeChange({
  supabase,
  actorId,
  resumeId,
  nextResume,
  eventId,
  baseRevision
}: {
  supabase: SupabaseClient<Database>
  actorId: string
  resumeId: string
  nextResume: ResumeData
  eventId?: string | null
  baseRevision?: number | null
}): Promise<AuthoritativeResumeState> {
  const currentResume = await readCurrentResume({
    supabase,
    actorId,
    resumeId
  })

  if (
    typeof baseRevision === "number" &&
    currentResume.current_revision !== baseRevision
  ) {
    throw new ResumeCommitError(
      `Resume changed from revision ${baseRevision} to ${currentResume.current_revision}. Please reload before saving.`,
      "stale-json-conflict"
    )
  }

  const commitResult = await commitNormalizedResume({
    supabase,
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
  supabase,
  actorId,
  resumeId,
  eventId,
  operation,
  maxAttempts = 3
}: {
  supabase: SupabaseClient<Database>
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
      supabase,
      actorId,
      resumeId
    })
    const { nextResume, metadata } = await operation({
      resume: currentResume.resume_json as ResumeData,
      currentRevision: currentResume.current_revision
    })

    const commitResult = await commitNormalizedResume({
      supabase,
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
