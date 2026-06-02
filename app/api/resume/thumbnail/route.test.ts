/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockImageResponse = vi.fn(function (_body: unknown, init: ResponseInit) {
  return new Response("thumbnail", {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "x-thumbnail-width": String((init as { width?: number }).width)
    }
  })
})

vi.mock("next/og", () => ({
  ImageResponse: mockImageResponse
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: mockFrom
    })
}))

vi.mock("@/lib/resume-thumbnail", () => ({
  getResumeThumbnailSections: () => []
}))

const { GET } = await import("./route")

describe("GET /api/resume/thumbnail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when resume id is missing", async () => {
    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/thumbnail",
      { method: "GET" }
    )

    const response = await GET(request)

    expect(response.status).toBe(400)
    await expect(response.text()).resolves.toBe("Missing resume data")
  })

  it("returns 500 when resume data cannot be loaded", async () => {
    mockSingle.mockResolvedValue({ data: null })
    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/thumbnail?resume_id=missing",
      { method: "GET" }
    )

    const response = await GET(request)

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toBe("Error fetching resume data")
  })

  it("generates a realtime ImageResponse for an existing resume", async () => {
    mockSingle.mockResolvedValue({
      data: {
        language: "en",
        resume_json: {
          personalInfo: {
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            phone: "123"
          }
        }
      }
    })
    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/thumbnail?resume_id=resume-123",
      { method: "GET" }
    )

    const response = await GET(request)

    expect(mockFrom).toHaveBeenCalledWith("resumes")
    expect(mockSelect).toHaveBeenCalledWith("resume_json, language")
    expect(mockEq).toHaveBeenCalledWith("id", "resume-123")
    expect(mockImageResponse).toHaveBeenCalledWith(expect.anything(), {
      width: 600,
      height: 824
    })
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("image/png")
  })
})
