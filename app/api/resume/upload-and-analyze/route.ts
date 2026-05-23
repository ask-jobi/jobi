import { NextRequest, NextResponse } from "next/server"
import {
  jobInfoFormSchema,
  type JobInfoFormType
} from "@/lib/job-info-form-schema"
import { verifyJobApplicationLimit } from "@/server/quota"
import { runUploadedResumeIntake } from "@/server/intake/orchestrator"
import { RollbackRegistryImpl } from "@/server/intake/rollback"
import type { IntakeEvent, CancellationSource } from "@/server/intake/types"
import { getCurrentUser } from "@/server/auth-helper"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function isPdfUpload(file: File) {
  const normalizedType = file.type.toLowerCase()
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf")

  return (
    normalizedType === "application/pdf" ||
    normalizedType === "application/x-pdf" ||
    ((normalizedType === "" || normalizedType === "application/octet-stream") &&
      hasPdfExtension)
  )
}

function parseJobInfoField(
  field: FormDataEntryValue | null
):
  | { ok: true; jobInfo: JobInfoFormType }
  | { ok: false; error: string; details?: unknown } {
  if (typeof field !== "string") {
    return {
      ok: false,
      error: "Invalid job info: expected a text field named jobInfo"
    }
  }

  let raw: unknown
  try {
    raw = JSON.parse(field)
  } catch {
    return {
      ok: false,
      error: "Invalid job info: malformed JSON"
    }
  }

  const result = jobInfoFormSchema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      error: "Invalid job info: must include name, company, and description",
      details: result.error.flatten().fieldErrors
    }
  }

  return { ok: true, jobInfo: result.data }
}

function recordSseTransportFailure(input: {
  phase: "pre-commit" | "post-commit"
  intakeId: string
  eventType: IntakeEvent["type"]
  error: unknown
}) {
  console.error("resume_intake_sse_transport_failure", {
    phase: input.phase,
    intakeId: input.intakeId,
    eventType: input.eventType,
    error:
      input.error instanceof Error
        ? {
            name: input.error.name,
            message: input.error.message,
            stack: input.error.stack
          }
        : input.error
  })
}

// ── POST /api/resume/upload-and-analyze ─────────────────────────
//
// Thin HTTP/SSE adapter:
//   1. Authenticate & parse multipart
//   2. Validate file (exists, PDF) and jobInfo (schema)
//   3. Create SSE stream
//   4. Delegate to UploadedResumeIntakeOrchestrator
//   5. Map orchestrator events to SSE payloads

export async function POST(request: NextRequest) {
  // ── Auth ──
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Parse multipart ──
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data" },
      { status: 400 }
    )
  }

  const file = formData.get("file") as File | null

  // ── Validate file ──
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!isPdfUpload(file)) {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 400 }
    )
  }

  // ── Validate jobInfo ──
  const jobInfoResult = parseJobInfoField(formData.get("jobInfo"))
  if (!jobInfoResult.ok) {
    console.error("resume_intake_invalid_job_info", {
      receivedType: typeof formData.get("jobInfo"),
      details: jobInfoResult.details
    })

    return NextResponse.json(
      {
        error: jobInfoResult.error,
        details: jobInfoResult.details
      },
      { status: 400 }
    )
  }
  const jobInfo = jobInfoResult.jobInfo

  // ── Application limit guard (peripheral) ──
  try {
    await verifyJobApplicationLimit()
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 })
  }

  // ── Set up SSE stream ──
  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  let emitFailed = false
  let writerClosed = false
  let committed = false

  const closeWriterSafely = async () => {
    if (writerClosed) return
    writerClosed = true
    try {
      await writer.close()
    } catch {
      // ignore - writer may already be closed
    }
  }

  // ── Cancellation source ──
  let cancelled = false
  const cancellation: CancellationSource = {
    isCancelled: () => cancelled,
    cancel: () => {
      cancelled = true
    }
  }

  // Abort from client (refresh, close, disconnect)
  request.signal.onabort = () => {
    cancellation.cancel()
    closeWriterSafely()
  }

  // ── Emit function ──
  const emit = async (event: IntakeEvent): Promise<void> => {
    if (emitFailed) return

    const phase: "pre-commit" | "post-commit" =
      committed || event.type === "intake.done" ? "post-commit" : "pre-commit"

    try {
      await writer.ready
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      if (event.type === "intake.done") {
        committed = true
      }
    } catch (err) {
      emitFailed = true
      cancellation.cancel()
      recordSseTransportFailure({
        phase,
        intakeId: event.intakeId,
        eventType: event.type,
        error: err
      })
    }
  }

  // ── Rollback registry ──
  const rollback = new RollbackRegistryImpl()

  // ── Fire-and-forget orchestration ──
  runUploadedResumeIntake(
    {
      jobInfo,
      file
    },
    { userId: user.id, emit, cancellation, rollback }
  )
    .catch((err) => {
      console.error("Unhandled intake error:", err)
    })
    .finally(() => {
      closeWriterSafely()
    })

  // ── Return SSE response ──
  return new NextResponse(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Transfer-Encoding": "chunked"
    }
  })
}
