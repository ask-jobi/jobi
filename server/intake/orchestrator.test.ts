/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IntakeContext, IntakeEvent } from "./types"
import { RollbackRegistryImpl } from "./rollback"

vi.mock("nanoid", () => ({
  nanoid: () => "intake-123"
}))

vi.mock("@/server/ai/tools", () => ({
  loadPdfToDoc: vi.fn()
}))

vi.mock("@/server/ai/resume-parser", () => ({
  parseResumeWithTokenUsage: vi.fn()
}))

vi.mock("@/server/resume", () => ({
  uploadResumeFile: vi.fn()
}))

vi.mock("@/server/evaluation", () => ({
  evaluateAndSaveResume: vi.fn()
}))

vi.mock("./persist", () => ({
  persistApplicationResume: vi.fn()
}))

vi.mock("./quota", () => ({
  authorizeUsage: vi.fn(),
  recordAuthorizedUsage: vi.fn()
}))

const { runUploadedResumeIntake } = await import("./orchestrator")
const { loadPdfToDoc } = await import("@/server/ai/tools")
const { parseResumeWithTokenUsage } = await import("@/server/ai/resume-parser")
const { uploadResumeFile } = await import("@/server/resume")
const { evaluateAndSaveResume } = await import("@/server/evaluation")
const { persistApplicationResume } = await import("./persist")
const { authorizeUsage, recordAuthorizedUsage } = await import("./quota")

const actorId = "user-1"

const input = {
  jobInfo: {
    name: "Software Engineer",
    company: "Jobi",
    description: "Build product"
  },
  file: new File(["pdf"], "resume.pdf", { type: "application/pdf" })
}

function createContext(options?: {
  onEmit?: (event: IntakeEvent, ctx: IntakeContext) => void
}): { ctx: IntakeContext; events: IntakeEvent[] } {
  const events: IntakeEvent[] = []
  let cancelled = false

  const ctx: IntakeContext = {
    userId: actorId,
    emit: async (event) => {
      events.push(event)
      options?.onEmit?.(event, ctx)
    },
    cancellation: {
      isCancelled: () => cancelled,
      cancel: () => {
        cancelled = true
      }
    },
    rollback: new RollbackRegistryImpl({ maxRetries: 0, retryDelayMs: 0 })
  }

  return { ctx, events }
}

function terminalEvents(events: IntakeEvent[]) {
  return events.filter(
    (event) =>
      event.type === "intake.done" ||
      event.type === "intake.failed" ||
      event.type === "intake.cancelled"
  )
}

function eventTypes(events: IntakeEvent[]) {
  return events.map((event) => event.type)
}

describe("runUploadedResumeIntake", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(authorizeUsage).mockResolvedValue({
      accessPassId: "pass-1",
      authorized: true,
      used: 10,
      limit: 100
    })
    vi.mocked(loadPdfToDoc).mockResolvedValue([{ pageContent: "resume text" }])
    vi.mocked(parseResumeWithTokenUsage).mockResolvedValue({
      resumeData: { basics: { name: "Alice" } },
      language: "en",
      tokenUsage: { totalTokens: 25 }
    } as any)
    vi.mocked(recordAuthorizedUsage).mockResolvedValue(undefined)
    vi.mocked(uploadResumeFile).mockImplementation(async (_file, rollback) => {
      rollback?.register("storage", "delete-upload", async () => {})
      return {
        fileName: "resume.pdf",
        publicUrl: "https://cdn.example/resume.pdf",
        userId: actorId
      }
    })
    vi.mocked(persistApplicationResume).mockImplementation(async () => ({
      jobData: { id: "job-1" },
      resumeData: { id: "resume-1" },
      applicationData: { id: "app-1" }
    }))
    vi.mocked(evaluateAndSaveResume).mockResolvedValue(undefined)
  })

  it("runs the happy path and emits exactly one terminal event", async () => {
    const { ctx, events } = createContext()

    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toEqual({
      status: "done",
      intakeId: "intake-123",
      applicationId: "app-1",
      resumeId: "resume-1"
    })
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "intake.done"
    ])
    expect(terminalEvents(events)).toHaveLength(1)
    expect(recordAuthorizedUsage).toHaveBeenCalledTimes(1)
  })

  it("blocks a new intake when quota is already exhausted", async () => {
    vi.mocked(authorizeUsage).mockResolvedValue({
      accessPassId: "pass-1",
      authorized: false,
      used: 100,
      limit: 100
    })
    const { ctx, events } = createContext()

    const result = await runUploadedResumeIntake(input, ctx)

    expect(result.status).toBe("failed")
    expect(result.intakeId).toBe("intake-123")
    if (result.status === "failed") {
      expect(result.error.code).toBe("QUOTA_EXCEEDED")
    }
    expect(loadPdfToDoc).not.toHaveBeenCalled()
    expect(parseResumeWithTokenUsage).not.toHaveBeenCalled()
    expect(recordAuthorizedUsage).not.toHaveBeenCalled()
    expect(eventTypes(events)).toEqual(["intake.start", "intake.failed"])
    expect(terminalEvents(events)).toHaveLength(1)
  })

  it("fails when extract produces no text", async () => {
    vi.mocked(loadPdfToDoc).mockResolvedValue([{ pageContent: "   " }])

    const { ctx, events } = createContext()
    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "failed",
      intakeId: "intake-123"
    })
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.failed",
      "rollback.start",
      "rollback.done",
      "intake.failed"
    ])
    expect(terminalEvents(events)).toHaveLength(1)
  })

  it("fails when parse fails without recording usage", async () => {
    vi.mocked(parseResumeWithTokenUsage).mockRejectedValue(
      new Error("llm down")
    )

    const { ctx, events } = createContext()
    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "failed",
      intakeId: "intake-123"
    })
    expect(recordAuthorizedUsage).not.toHaveBeenCalled()
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.done",
      "step.start",
      "step.failed",
      "rollback.start",
      "rollback.done",
      "intake.failed"
    ])
  })

  it("fails when upload fails", async () => {
    vi.mocked(uploadResumeFile).mockRejectedValue(new Error("storage down"))

    const { ctx, events } = createContext()
    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "failed",
      intakeId: "intake-123"
    })
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.failed",
      "rollback.start",
      "rollback.done",
      "intake.failed"
    ])
  })

  it("does not emit step.failed when cancellation is detected", async () => {
    const { ctx, events } = createContext({
      onEmit: (event, currentCtx) => {
        if (event.type === "step.start" && event.step === "persist") {
          currentCtx.cancellation.cancel()
        }
      }
    })

    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "cancelled",
      intakeId: "intake-123"
    })
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "rollback.start",
      "rollback.done",
      "intake.cancelled"
    ])
    expect(events.some((event) => event.type === "step.failed")).toBe(false)
    const rollbackDone = events.find((event) => event.type === "rollback.done")
    expect(rollbackDone).toMatchObject({
      type: "rollback.done",
      allSucceeded: true,
      failureCount: 0
    })
    expect(terminalEvents(events)).toHaveLength(1)
  })

  it("keeps usage recorded when cancellation happens after parse", async () => {
    const { ctx, events } = createContext({
      onEmit: (event, currentCtx) => {
        if (event.type === "step.done" && event.step === "parse") {
          currentCtx.cancellation.cancel()
        }
      }
    })

    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "cancelled",
      intakeId: "intake-123"
    })
    expect(recordAuthorizedUsage).toHaveBeenCalledTimes(1)
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "rollback.start",
      "rollback.done",
      "intake.cancelled"
    ])
    expect(terminalEvents(events)).toHaveLength(1)
  })

  it("fails when evaluate fails after persist", async () => {
    vi.mocked(evaluateAndSaveResume).mockRejectedValue(new Error("eval down"))

    const { ctx, events } = createContext()
    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "failed",
      intakeId: "intake-123"
    })
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.failed",
      "rollback.start",
      "rollback.done",
      "intake.failed"
    ])
  })

  it("reports rollback quality and keeps token usage recorded on downstream failure", async () => {
    vi.mocked(uploadResumeFile).mockImplementation(async (_file, rollback) => {
      rollback?.register("storage", "delete-upload", async () => {
        throw new Error("delete failed")
      })
      return {
        fileName: "resume.pdf",
        publicUrl: "https://cdn.example/resume.pdf",
        userId: actorId
      }
    })
    vi.mocked(persistApplicationResume).mockRejectedValue(new Error("db down"))

    const { ctx, events } = createContext()
    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "failed",
      intakeId: "intake-123"
    })
    expect(recordAuthorizedUsage).toHaveBeenCalledTimes(1)
    const rollbackDone = events.find((event) => event.type === "rollback.done")
    expect(rollbackDone).toMatchObject({
      type: "rollback.done",
      allSucceeded: false,
      failureCount: 1
    })
    expect(eventTypes(events)).toEqual([
      "intake.start",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.done",
      "step.start",
      "step.failed",
      "rollback.start",
      "rollback.done",
      "intake.failed"
    ])
    expect(terminalEvents(events)).toHaveLength(1)
  })
})
