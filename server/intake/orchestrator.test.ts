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
  parseResume: vi.fn()
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

const { runUploadedResumeIntake } = await import("./orchestrator")
const { loadPdfToDoc } = await import("@/server/ai/tools")
const { parseResume } = await import("@/server/ai/resume-parser")
const { uploadResumeFile } = await import("@/server/resume")
const { evaluateAndSaveResume } = await import("@/server/evaluation")
const { persistApplicationResume } = await import("./persist")

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
  onEmit?: (event: IntakeEvent, abort: () => void) => void
}): { ctx: IntakeContext; events: IntakeEvent[] } {
  const events: IntakeEvent[] = []
  const controller = new AbortController()

  const ctx: IntakeContext = {
    userId: actorId,
    emit: async (event) => {
      events.push(event)
      options?.onEmit?.(event, () => controller.abort())
    },
    signal: controller.signal,
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

    vi.mocked(loadPdfToDoc).mockResolvedValue([
      { pageContent: "resume text", metadata: { totalPages: 1 } }
    ])
    vi.mocked(parseResume).mockResolvedValue([
      { basics: { name: "Alice" } },
      "en"
    ] as any)
    vi.mocked(uploadResumeFile).mockImplementation(async (_file, rollback) => {
      rollback?.register("storage", "delete-upload", async () => {})
      return {
        fileName: "resume.pdf",
        filePath: "user-1/resume.pdf",
        userId: actorId
      }
    })
    vi.mocked(persistApplicationResume).mockImplementation(async () => ({
      jobData: { id: "job-1" },
      resumeData: { id: "resume-1" },
      applicationData: { id: "app-1" }
    }))
    vi.mocked(evaluateAndSaveResume).mockResolvedValue({
      gates: {
        ats: "pass",
        hr: "pass",
        hiringManager: "pass"
      },
      gaps: [],
      actions: []
    })
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
  })

  it("fails when extract produces no text", async () => {
    vi.mocked(loadPdfToDoc).mockResolvedValue([
      { pageContent: "   ", metadata: { totalPages: 1 } }
    ])

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

  it("preserves parser failures from the extract step", async () => {
    vi.mocked(loadPdfToDoc).mockRejectedValue(
      new Error("DOMMatrix is not defined")
    )

    const { ctx, events } = createContext()
    const result = await runUploadedResumeIntake(input, ctx)

    expect(result).toMatchObject({
      status: "failed",
      intakeId: "intake-123",
      error: {
        code: "PDF_EXTRACTION_FAILED",
        details: "DOMMatrix is not defined"
      }
    })
    expect(events).toContainEqual({
      type: "step.failed",
      intakeId: "intake-123",
      step: "extract",
      error: {
        code: "PDF_EXTRACTION_FAILED",
        userMessage:
          "Could not read the uploaded PDF. Please try again or upload a different PDF.",
        details: "DOMMatrix is not defined"
      }
    })
  })

  it("fails when parsing fails", async () => {
    vi.mocked(parseResume).mockRejectedValue(new Error("llm down"))

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
      onEmit: (event, abort) => {
        if (event.type === "step.start" && event.step === "persist") {
          abort()
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

  it("cancels after parsing without continuing to upload", async () => {
    const { ctx, events } = createContext({
      onEmit: (event, abort) => {
        if (event.type === "step.done" && event.step === "parse") {
          abort()
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

  it("reports rollback quality on downstream failure", async () => {
    vi.mocked(uploadResumeFile).mockImplementation(async (_file, rollback) => {
      rollback?.register("storage", "delete-upload", async () => {
        throw new Error("delete failed")
      })
      return {
        fileName: "resume.pdf",
        filePath: "user-1/resume.pdf",
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
