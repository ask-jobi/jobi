import { nanoid } from "nanoid"
import type {
  IntakeContext,
  IntakeResult,
  IntakeError,
  IntakeEvent,
  StepId
} from "./types"
import { IntakeErrors } from "./errors"
import { loadPdfToDoc } from "@/server/ai/tools"
import { parseResumeWithTokenUsage } from "@/server/ai/resume-parser"
import { uploadResumeFile } from "@/server/resume"
import { evaluateAndSaveResume } from "@/server/evaluation"
import { persistApplicationResume } from "./persist"
import { authorizeUsage, recordAuthorizedUsage } from "./quota"

export type UploadedResumeIntakeInput = {
  jobInfo: { name: string; company: string; description: string }
  file: File
}

// ── Step helper ─────────────────────────────────────────────────

type StepHandler<T> = () => Promise<T>

async function runStep<T>(
  ctx: IntakeContext,
  intakeId: string,
  step: StepId,
  handler: StepHandler<T>
): Promise<T> {
  await ctx.emit({ type: "step.start", intakeId, step })

  if (ctx.cancellation.isCancelled()) {
    throw IntakeErrors.cancelled()
  }

  try {
    const result = await handler()

    if (ctx.cancellation.isCancelled()) {
      throw IntakeErrors.cancelled()
    }

    await ctx.emit({ type: "step.done", intakeId, step })
    return result
  } catch (err) {
    if (isCancellationError(err)) {
      throw err
    }

    const error: IntakeError = isIntakeError(err)
      ? err
      : mapStepError(step, err)

    await ctx.emit({
      type: "step.failed",
      intakeId,
      step,
      error
    })
    throw error
  }
}

function isIntakeError(err: unknown): err is IntakeError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "userMessage" in err
  )
}

function isCancellationError(err: unknown): err is IntakeError {
  return isIntakeError(err) && err.code === "INTAKE_CANCELLED"
}

function mapStepError(step: StepId, err: unknown): IntakeError {
  const message = err instanceof Error ? err.message : "Unknown error occurred"

  switch (step) {
    case "extract":
      return IntakeErrors.emptyPdfText()
    case "parse":
      return IntakeErrors.parseFailed(message)
    case "upload":
      return IntakeErrors.uploadFailed(message)
    case "persist":
      return IntakeErrors.persistFailed(message)
    case "evaluate":
      return IntakeErrors.evaluateFailed(message)
  }
}

// ── Main orchestrator ───────────────────────────────────────────

/**
 * Uploaded Resume intake orchestrator.
 *
 * Flow: extract → parse → upload → persist → evaluate
 *
 * Contract:
 * - Returns explicit union (done | cancelled | failed), never throws
 * - Commit point is after evaluate succeeds
 * - Cancellation before commit triggers rollback
 * - Token usage is never rolled back
 */
export async function runUploadedResumeIntake(
  input: UploadedResumeIntakeInput,
  ctx: IntakeContext
): Promise<IntakeResult> {
  const intakeId = nanoid()
  const actorId = ctx.userId

  // Wrap emit so intakeId is always set correctly on events
  const emitWithId = (event: IntakeEvent): Promise<void> => {
    return ctx.emit({ ...event, intakeId } as IntakeEvent)
  }

  const localCtx: IntakeContext = {
    ...ctx,
    emit: emitWithId
  }

  let committed = false

  try {
    await localCtx.emit({ type: "intake.start", intakeId })

    const authorization = await authorizeUsage(actorId, "resume-parse")
    if (authorization && !authorization.authorized) {
      const error = IntakeErrors.quotaExceeded({
        used: authorization.used,
        limit: authorization.limit
      })
      await localCtx.emit({ type: "intake.failed", intakeId, error })
      return { status: "failed", intakeId, error }
    }

    // ── Step 1: extract ──
    const docs = await runStep(localCtx, intakeId, "extract", async () => {
      const result = await loadPdfToDoc(input.file, { splitPages: false })
      if (!result[0]?.pageContent?.trim()) {
        throw IntakeErrors.emptyPdfText()
      }
      return result
    })

    // ── Step 2: parse ──
    const { parsedResume, language } = await runStep(
      localCtx,
      intakeId,
      "parse",
      async () => {
        const {
          resumeData,
          language: resumeLang,
          tokenUsage
        } = await parseResumeWithTokenUsage(docs[0].pageContent)

        // Soft cap: once the run is authorized to start, record full actual usage.
        if (authorization && tokenUsage.totalTokens > 0) {
          await recordAuthorizedUsage(authorization, tokenUsage)
        }

        return { parsedResume: resumeData, language: resumeLang }
      }
    )

    // ── Step 3: upload ──
    const uploadResult = await runStep(
      localCtx,
      intakeId,
      "upload",
      async () => {
        const result = await uploadResumeFile(input.file, localCtx.rollback)
        return result
      }
    )

    // ── Step 4: persist ──
    const persistResult = await runStep(
      localCtx,
      intakeId,
      "persist",
      async () => {
        return persistApplicationResume(
          {
            actorId,
            jobInfo: input.jobInfo,
            resumeData: parsedResume as unknown as Record<string, unknown>,
            resumeLanguage: language,
            uploadedResumePublicUrl: uploadResult.publicUrl
          },
          localCtx.rollback
        )
      }
    )

    // ── Step 5: evaluate (commit point) ──
    await runStep(localCtx, intakeId, "evaluate", async () => {
      await evaluateAndSaveResume(
        persistResult.resumeData.id,
        parsedResume,
        input.jobInfo.description
      )
    })

    // ── Commit: mark done, no rollback beyond this point ──
    committed = true

    await localCtx.emit({
      type: "intake.done",
      intakeId,
      applicationId: persistResult.applicationData.id,
      resumeId: persistResult.resumeData.id
    })

    return {
      status: "done",
      intakeId,
      applicationId: persistResult.applicationData.id,
      resumeId: persistResult.resumeData.id
    }
  } catch (err) {
    if (isCancellationError(err)) {
      // Rollback before commit
      if (!committed) {
        await localCtx.rollback.executeAll(localCtx.emit)
      }

      const reason = IntakeErrors.cancelled()
      await localCtx.emit({ type: "intake.cancelled", intakeId, reason })
      return { status: "cancelled", intakeId, reason }
    }

    // Failure before commit: rollback
    if (!committed) {
      await localCtx.rollback.executeAll(localCtx.emit)
    }

    const error: IntakeError = isIntakeError(err)
      ? err
      : IntakeErrors.internal(err instanceof Error ? err.message : err)

    await localCtx.emit({ type: "intake.failed", intakeId, error })
    return { status: "failed", intakeId, error }
  }
}
