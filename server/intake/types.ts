/** Intake step identifiers */
export type StepId = "extract" | "parse" | "upload" | "persist" | "evaluate"

/** Structured error model - never branch on message text */
export type IntakeError = {
  code: string
  userMessage: string
  details?: unknown
}

// ── Event protocol ──────────────────────────────────────────────

export type IntakeEvent =
  | { type: "intake.start"; intakeId: string }
  | { type: "step.start"; intakeId: string; step: StepId }
  | { type: "step.done"; intakeId: string; step: StepId }
  | {
      type: "step.failed"
      intakeId: string
      step: StepId
      error: IntakeError
    }
  | { type: "rollback.start"; intakeId: string }
  | {
      type: "rollback.done"
      intakeId: string
      allSucceeded: boolean
      failureCount: number
    }
  | {
      type: "intake.done"
      intakeId: string
      applicationId: string
      resumeId: string
    }
  | { type: "intake.failed"; intakeId: string; error: IntakeError }
  | { type: "intake.cancelled"; intakeId: string; reason: IntakeError }

// ── Rollback ────────────────────────────────────────────────────

export type RollbackAction = {
  kind: string
  label: string
  execute: () => Promise<void>
}

export type RollbackResult = {
  allSucceeded: boolean
  failures: Array<{ label: string; error: unknown }>
}

export interface RollbackRegistry {
  register(kind: string, label: string, action: () => Promise<void>): void
  executeAll(
    emit: (event: IntakeEvent) => Promise<void>
  ): Promise<RollbackResult>
}

// ── Intake context ──────────────────────────────────────────────

export interface IntakeContext {
  userId: string
  emit: (event: IntakeEvent) => Promise<void>
  signal: AbortSignal
  rollback: RollbackRegistry
}

// ── Usage authorization ─────────────────────────────────────────

export type UsageAuthorization = {
  accessPassId: string
  authorized: boolean
  used: number
  limit: number
}

// ── Orchestrator results ────────────────────────────────────────

export type IntakeResult =
  | {
      status: "done"
      intakeId: string
      applicationId: string
      resumeId: string
    }
  | { status: "cancelled"; intakeId: string; reason: IntakeError }
  | { status: "failed"; intakeId: string; error: IntakeError }

// ── Persist input / output ──────────────────────────────────────

export type PersistInput = {
  userId: string
  jobInfo: {
    name: string
    company: string
    description: string
  }
  /** Raw resume JSON data — passed as-is to Supabase resume_json column */
  resumeData: unknown
  resumeLanguage: string
  uploadedResumePublicUrl: string | null
}

export type PersistOutput = {
  jobData: { id: string }
  resumeData: { id: string }
  applicationData: { id: string }
}
