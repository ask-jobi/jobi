/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockLaunch = vi.fn()
const mockGetCloudflareContext = vi.fn()
const mockGetAllCookies = vi.fn()

vi.mock("@cloudflare/puppeteer", () => ({
  default: {
    launch: mockLaunch
  }
}))

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext
}))

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      getAll: mockGetAllCookies
    })
}))

const { GET } = await import("./route")

function createSuccessfulBrowser(pdf = new Uint8Array([37, 80, 68, 70])) {
  const page = {
    setCookie: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluateHandle: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(undefined),
    pdf: vi.fn().mockResolvedValue(pdf)
  }
  const browser = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined)
  }

  return { browser, page, pdf }
}

describe("GET /api/resume/print", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.NEXT_PUBLIC_BASE_URL
    mockGetAllCookies.mockReturnValue([])
    mockGetCloudflareContext.mockReturnValue({
      env: {
        MYBROWSER: { fetch: vi.fn() }
      }
    })
  })

  it("returns 400 when resume id is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/resume/print", {
      method: "GET"
    })

    const response = await GET(request)

    expect(response.status).toBe(400)
    await expect(response.text()).resolves.toBe("Missing resume id")
    expect(mockLaunch).not.toHaveBeenCalled()
  })

  it("renders the print page through Cloudflare Browser Run and returns a PDF", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://jobi-validation.workers.dev"
    const { browser, page, pdf } = createSuccessfulBrowser()
    mockLaunch.mockResolvedValue(browser)
    mockGetAllCookies.mockReturnValue([
      { name: "sb-session", value: "session-token" }
    ])

    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/print?id=resume-123",
      { method: "GET" }
    )

    const response = await GET(request)

    expect(mockLaunch).toHaveBeenCalledWith(
      mockGetCloudflareContext().env.MYBROWSER
    )
    expect(page.setCookie).toHaveBeenCalledWith({
      name: "sb-session",
      value: "session-token",
      url: "https://jobi-validation.workers.dev",
      path: "/"
    })
    expect(page.goto).toHaveBeenCalledWith(
      "https://jobi-validation.workers.dev/resume-print/resume-123",
      { waitUntil: "networkidle0" }
    )
    expect(page.waitForSelector).toHaveBeenCalledWith("[data-resume-ready]", {
      timeout: 10_000
    })
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(pdf)
    expect(browser.close).toHaveBeenCalled()
  })

  it("falls back to the request origin when NEXT_PUBLIC_BASE_URL is not set", async () => {
    const { browser, page } = createSuccessfulBrowser()
    mockLaunch.mockResolvedValue(browser)

    const request = new NextRequest(
      "https://preview.jobi.workers.dev/api/resume/print?id=resume-123",
      { method: "GET" }
    )

    await GET(request)

    expect(page.goto).toHaveBeenCalledWith(
      "https://preview.jobi.workers.dev/resume-print/resume-123",
      { waitUntil: "networkidle0" }
    )
  })

  it("returns 500 when the Browser Run binding is missing", async () => {
    mockGetCloudflareContext.mockReturnValue({ env: {} })

    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/print?id=resume-123",
      { method: "GET" }
    )

    const response = await GET(request)

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toBe("export resume failed")
    expect(mockLaunch).not.toHaveBeenCalled()
  })

  it("closes the browser when PDF generation fails", async () => {
    const { browser, page } = createSuccessfulBrowser()
    page.pdf.mockRejectedValue(new Error("PDF generation failed"))
    mockLaunch.mockResolvedValue(browser)

    const request = new NextRequest(
      "https://jobi-validation.workers.dev/api/resume/print?id=resume-123",
      { method: "GET" }
    )

    const response = await GET(request)

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toBe("export resume failed")
    expect(browser.close).toHaveBeenCalled()
  })
})
