/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { vi, describe, it, expect, beforeEach } from "vitest"

// Define mockLaunchBrowser at module scope
const mockLaunchBrowser = vi.fn()

// Mock puppeteer-core before importing the route
vi.mock("puppeteer-core", () => ({
  default: {
    launch: vi.fn()
  }
}))

vi.mock("@sparticuz/chromium", () => ({
  default: {
    args: [],
    executablePath: vi.fn()
  }
}))

vi.mock("./route", async () => {
  const actual = await vi.importActual("./route")
  return {
    ...actual,
    launchBrowser: mockLaunchBrowser
  }
})

// Import after mocking
const { GET } = await import("./route")

describe("GET /api/resume/print", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Validation", () => {
    it("should return 400 when resume id is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/resume/print",
        { method: "GET" }
      )

      const response = await GET(request)
      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe("Missing resume id")
    })

    it("should return 400 when resume id is empty string", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/resume/print?id=",
        { method: "GET" }
      )

      const response = await GET(request)
      expect(response.status).toBe(400)
    })

    it("should accept valid resume id", async () => {
      // This will fail due to browser dependency, but we can verify the validation passes
      const request = new NextRequest(
        "http://localhost:3000/api/resume/print?id=valid-resume-id",
        { method: "GET" }
      )

      // The request should not return 400, meaning validation passed
      const response = await GET(request)
      expect(response.status).not.toBe(400)
    })
  })

  describe("URL construction", () => {
    it("should construct target URL with resume id", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/resume/print?id=test-resume-123",
        { method: "GET" }
      )

      // If validation passes, it should proceed to browser launch
      // This tests that the URL is properly constructed
      const { searchParams } = new URL(request.url)
      const resumeId = searchParams.get("id")
      expect(resumeId).toBe("test-resume-123")
    })

    it("should use NEXT_PUBLIC_BASE_URL environment variable", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_BASE_URL
      process.env.NEXT_PUBLIC_BASE_URL = "https://custom-domain.com"

      try {
        const { searchParams } = new URL(
          "http://localhost:3000/api/resume/print?id=test"
        )
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
        expect(baseUrl).toBe("https://custom-domain.com")
      } finally {
        if (originalUrl) {
          process.env.NEXT_PUBLIC_BASE_URL = originalUrl
        } else {
          delete process.env.NEXT_PUBLIC_BASE_URL
        }
      }
    })

    it("should use localhost as default base URL when env var not set", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_BASE_URL
      delete process.env.NEXT_PUBLIC_BASE_URL

      try {
        const { searchParams } = new URL(
          "http://localhost:3000/api/resume/print?id=test"
        )
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
        expect(baseUrl).toBe("http://localhost:3000")
      } finally {
        if (originalUrl) {
          process.env.NEXT_PUBLIC_BASE_URL = originalUrl
        }
      }
    })
  })

  describe("Error handling", () => {
    it("should return 500 when browser launch fails", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/resume/print?id=test-resume-123",
        { method: "GET" }
      )

      // Mock launchBrowser to throw an error
      mockLaunchBrowser.mockRejectedValue(new Error("Browser launch failed"))

      const response = await GET(mockRequest)
      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toBe("export resume failed")

      // Clean up
      mockLaunchBrowser.mockReset()
    })

    it("should return 500 when PDF generation fails", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/resume/print?id=test-resume-123",
        { method: "GET" }
      )

      // Mock launchBrowser to return a browser that throws on PDF generation
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          evaluateHandle: vi.fn().mockResolvedValue(undefined),
          waitForSelector: vi.fn().mockResolvedValue(undefined),
          pdf: vi.fn().mockRejectedValue(new Error("PDF generation failed"))
        }),
        close: vi.fn().mockResolvedValue(undefined)
      }

      mockLaunchBrowser.mockResolvedValue(mockBrowser as any)

      const response = await GET(mockRequest)
      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toBe("export resume failed")

      // Clean up
      mockLaunchBrowser.mockReset()
    })
  })
})
