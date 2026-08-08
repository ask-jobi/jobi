/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetResumeThumbnailSections = vi.fn()
const mockGetResumeThumbnailData = vi.fn()

vi.mock("@/server/auth-helper", () => ({
  requireVerifiedUserIdentity: vi.fn(async () => ({ id: "workspace-1" }))
}))

vi.mock("@/server/data/applications", () => ({
  getResumeThumbnailData: mockGetResumeThumbnailData
}))

vi.mock("@/lib/resume-thumbnail", () => ({
  getResumeThumbnailSections: mockGetResumeThumbnailSections
}))

const { GET } = await import("./route")

describe("GET /api/resume/thumbnail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetResumeThumbnailSections.mockReturnValue([])
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

  it("returns 404 when resume data cannot be loaded", async () => {
    mockGetResumeThumbnailData.mockResolvedValue(null)
    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/thumbnail?resume_id=missing",
      { method: "GET" }
    )

    const response = await GET(request)

    expect(response.status).toBe(404)
    await expect(response.text()).resolves.toBe("Resume not found")
  })

  it("generates a realtime escaped SVG thumbnail for an existing resume", async () => {
    const resumeJson = {
      personalInfo: {
        firstName: "Ada &",
        lastName: "<Lovelace>",
        email: "ada<script>@example.com",
        phone: "123 > 456"
      }
    }
    mockGetResumeThumbnailData.mockResolvedValue({
      language: "en",
      resumeData: resumeJson
    })
    mockGetResumeThumbnailSections.mockReturnValue([
      {
        id: "employment",
        title: "Experience & More",
        entries: [
          {
            heading: "ACME <Corp>",
            subheading: "Engineer & Writer",
            meta: "1842 > 1843",
            tags: ["TypeScript & SVG"]
          }
        ]
      }
    ])
    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/thumbnail?resume_id=resume-123",
      { method: "GET" }
    )

    const response = await GET(request)
    const svg = await response.text()

    expect(mockGetResumeThumbnailData).toHaveBeenCalledWith(
      "workspace-1",
      "resume-123"
    )
    expect(mockGetResumeThumbnailSections).toHaveBeenCalledWith(
      resumeJson,
      "en"
    )
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("image/svg+xml")
    expect(svg).toContain("<svg")
    expect(svg).toContain("Ada &amp; &lt;Lovelace&gt;")
    expect(svg).toContain("ada&lt;script&gt;@example.com")
    expect(svg).toContain("123 &gt; 456")
    expect(svg).toContain("Experience &amp; More")
    expect(svg).toContain("ACME &lt;Corp&gt;")
    expect(svg).toContain("Engineer &amp; Writer")
    expect(svg).toContain("1842 &gt; 1843")
    expect(svg).toContain("TypeScript &amp; SVG")
    expect(svg).not.toContain("ACME <Corp>")
  })
})
