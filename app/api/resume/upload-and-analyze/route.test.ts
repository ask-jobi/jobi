/**
 * @vitest-environment node
 *
 * Route adapter tests for upload-and-analyze.
 *
 * Only covers adapter-level responsibilities:
 * - Auth guard (401)
 * - Input validation → 4xx JSON
 * - SSE headers
 * - Orchestrator event → SSE mapping
 */
import { POST } from "./route"
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

// ── Mocks ───────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}))

vi.mock("@/server/quota", () => ({
  verifyJobApplicationLimit: vi.fn()
}))

vi.mock("@/server/intake/orchestrator", () => ({
  runUploadedResumeIntake: vi.fn()
}))

const { createClient } = await import("@/lib/supabase/server")
const { verifyJobApplicationLimit } = await import("@/server/quota")
const { runUploadedResumeIntake } = await import("@/server/intake/orchestrator")

// ── Helpers ─────────────────────────────────────────────────────

function createFormRequest(file?: File, jobInfo?: unknown): NextRequest {
  const formData = new FormData()
  if (file) formData.append("file", file)
  if (jobInfo) formData.append("jobInfo", JSON.stringify(jobInfo))
  return new NextRequest(
    "http://localhost:3000/api/resume/upload-and-analyze",
    {
      method: "POST",
      body: formData
    }
  )
}

function createRawMultipartRequest(parts: string[], boundary: string) {
  return new NextRequest(
    "http://localhost:3000/api/resume/upload-and-analyze",
    {
      method: "POST",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`
      },
      body: parts.join("\r\n")
    }
  )
}

function mockAuth(userId = "test-user-id") {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: userId } },
        error: null
      })
    }
  } as any)
}

function mockNoAuth() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: null },
        error: null
      })
    }
  } as any)
}

const validJobInfo = {
  name: "Software Engineer",
  company: "Tech Corp",
  description: "Build great products"
}

async function readSSEBody(
  response: Response
): Promise<{ events: unknown[]; raw: string }> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  const chunks: string[] = []

  // Read for a limited time then cancel
  const timeout = setTimeout(() => reader.cancel(), 500)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(decoder.decode(value, { stream: true }))
    }
  } catch {
    // reader cancelled
  } finally {
    clearTimeout(timeout)
  }

  const raw = chunks.join("")
  const events: unknown[] = []
  for (const line of raw.split("\n")) {
    if (line.startsWith("data: ")) {
      try {
        events.push(JSON.parse(line.slice(6)))
      } catch {
        // skip unparseable
      }
    }
  }
  return { events, raw }
}

// ── Tests ───────────────────────────────────────────────────────

describe("POST /api/resume/upload-and-analyze (adapter)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth()
    vi.mocked(verifyJobApplicationLimit).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Auth ──────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockNoAuth()
    const request = createFormRequest(
      new File(["test"], "resume.pdf", { type: "application/pdf" }),
      validJobInfo
    )
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  // ── File validation ───────────────────────────────────────────

  it("returns 400 when file is missing", async () => {
    const request = createFormRequest(undefined, validJobInfo)
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain("No file")
  })

  it("returns 400 when file is not PDF", async () => {
    const request = createFormRequest(
      new File(["test"], "resume.png", { type: "image/png" }),
      validJobInfo
    )
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain("PDF")
  })

  it("accepts a .pdf file when the browser omits the MIME type", async () => {
    vi.mocked(runUploadedResumeIntake).mockResolvedValue({
      status: "cancelled",
      intakeId: "test-intake-1",
      reason: {
        code: "INTAKE_CANCELLED",
        userMessage: "cancelled"
      }
    })

    const file = new File(["test"], "resume.pdf", { type: "" })
    const request = createFormRequest(file, validJobInfo)
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(runUploadedResumeIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ name: "resume.pdf" })
      }),
      expect.any(Object)
    )
  })

  // ── jobInfo validation ────────────────────────────────────────

  it("returns 400 when jobInfo is not valid JSON", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new File(["test"], "resume.pdf", { type: "application/pdf" })
    )
    formData.append("jobInfo", "not-json")
    const request = new NextRequest(
      "http://localhost:3000/api/resume/upload-and-analyze",
      { method: "POST", body: formData }
    )
    const response = await POST(request)
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.error).toBe("Invalid job info: malformed JSON")
  })

  it("returns 400 when jobInfo fails schema validation", async () => {
    const request = createFormRequest(
      new File(["test"], "resume.pdf", { type: "application/pdf" }),
      { name: "", company: "", description: "" }
    )
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain("job info")
    expect(body.details).toMatchObject({
      name: expect.any(Array),
      company: expect.any(Array),
      description: expect.any(Array)
    })
  })

  it("accepts raw multipart with a Chinese pdf filename and Unicode job info", async () => {
    vi.mocked(runUploadedResumeIntake).mockResolvedValue({
      status: "cancelled",
      intakeId: "test-intake-1",
      reason: {
        code: "INTAKE_CANCELLED",
        userMessage: "cancelled"
      }
    })

    const boundary = "----WebKitFormBoundaryKiI3tPJW53ayeLIf"
    const request = createRawMultipartRequest(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="余涛_developer_简历.pdf"',
        "Content-Type: application/pdf",
        "",
        "%PDF-1.4",
        `--${boundary}`,
        'Content-Disposition: form-data; name="jobInfo"',
        "",
        '{"name":"BitSearch","company":"星云科技有限公司","description":"asdadasdasd"}',
        `--${boundary}--`,
        ""
      ],
      boundary
    )

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(runUploadedResumeIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ name: "余涛_developer_简历.pdf" }),
        jobInfo: {
          name: "BitSearch",
          company: "星云科技有限公司",
          description: "asdadasdasd"
        }
      }),
      expect.any(Object)
    )
  })

  // ── Application limit ─────────────────────────────────────────

  it("returns 403 when application limit is exceeded", async () => {
    vi.mocked(verifyJobApplicationLimit).mockRejectedValue(
      new Error("limit reached")
    )
    const request = createFormRequest(
      new File(["test"], "resume.pdf", { type: "application/pdf" }),
      validJobInfo
    )
    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  // ── SSE response ──────────────────────────────────────────────

  it("passes validated request input to the orchestrator", async () => {
    vi.mocked(runUploadedResumeIntake).mockResolvedValue({
      status: "cancelled",
      intakeId: "test-intake-1",
      reason: {
        code: "INTAKE_CANCELLED",
        userMessage: "cancelled"
      }
    })

    const file = new File(["test"], "resume.pdf", { type: "application/pdf" })
    const request = createFormRequest(file, validJobInfo)
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(runUploadedResumeIntake).toHaveBeenCalledWith(
      {
        jobInfo: validJobInfo,
        file: expect.any(File)
      },
      expect.objectContaining({
        userId: "test-user-id",
        emit: expect.any(Function),
        signal: expect.any(AbortSignal),
        rollback: expect.any(Object)
      })
    )

    const [{ file: validatedFile }] = vi.mocked(runUploadedResumeIntake).mock
      .calls[0]
    expect(validatedFile.name).toBe("resume.pdf")
    expect(validatedFile.type).toBe("application/pdf")
    expect(validatedFile.size).toBe(4)
  })

  it("records post-commit SSE transport failure without changing the domain result", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    let resumeAfterDisconnect!: () => void
    const disconnected = new Promise<void>((resolve) => {
      resumeAfterDisconnect = resolve
    })

    vi.mocked(runUploadedResumeIntake).mockImplementation(
      async (_input, ctx) => {
        await ctx.emit({ type: "intake.start", intakeId: "test-intake-1" })
        await ctx.emit({
          type: "intake.done",
          intakeId: "test-intake-1",
          applicationId: "app-1",
          resumeId: "resume-1"
        })
        await disconnected
        await ctx.emit({
          type: "step.done",
          intakeId: "test-intake-1",
          step: "evaluate"
        })
        return {
          status: "done",
          intakeId: "test-intake-1",
          applicationId: "app-1",
          resumeId: "resume-1"
        }
      }
    )

    const request = createFormRequest(
      new File(["test"], "resume.pdf", { type: "application/pdf" }),
      validJobInfo
    )
    const response = await POST(request)

    const reader = response.body?.getReader()
    expect(reader).toBeTruthy()

    const decoder = new TextDecoder()
    let raw = ""

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      raw += decoder.decode(value, { stream: true })
      if (raw.includes('"type":"intake.done"')) {
        break
      }
    }

    await reader?.cancel()
    resumeAfterDisconnect()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(raw).toContain('"type":"intake.done"')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "resume_intake_sse_transport_failure",
      expect.objectContaining({
        phase: "post-commit",
        intakeId: "test-intake-1",
        eventType: "step.done"
      })
    )
  })

  it("returns SSE content-type and streams events", async () => {
    // Setup orchestrator to emit some events then resolve
    vi.mocked(runUploadedResumeIntake).mockImplementation(
      async (_input, ctx) => {
        await ctx.emit({ type: "intake.start", intakeId: "test-intake-1" })
        await ctx.emit({
          type: "step.start",
          intakeId: "test-intake-1",
          step: "extract"
        })
        await ctx.emit({
          type: "step.done",
          intakeId: "test-intake-1",
          step: "extract"
        })
        await ctx.emit({
          type: "intake.done",
          intakeId: "test-intake-1",
          applicationId: "app-1",
          resumeId: "resume-1"
        })
        return {
          status: "done",
          intakeId: "test-intake-1",
          applicationId: "app-1",
          resumeId: "resume-1"
        }
      }
    )

    const request = createFormRequest(
      new File(["test"], "resume.pdf", { type: "application/pdf" }),
      validJobInfo
    )
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("text/event-stream")
    expect(response.headers.get("Cache-Control")).toContain("no-cache")

    const { events } = await readSSEBody(response)

    expect(events.length).toBeGreaterThanOrEqual(4)
    expect(events[0]).toMatchObject({ type: "intake.start" })
    expect(events[1]).toMatchObject({ type: "step.start", step: "extract" })
    expect(events[2]).toMatchObject({ type: "step.done", step: "extract" })
    const lastEvent = events[events.length - 1] as Record<string, unknown>
    expect(lastEvent.type).toBe("intake.done")
    expect(lastEvent.applicationId).toBe("app-1")
    expect(lastEvent.resumeId).toBe("resume-1")
  })
})
