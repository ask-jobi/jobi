/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { loadPdfToDoc, Document } from "./tools"

const { mockGetDocument, mockCleanup } = vi.hoisted(() => ({
  mockGetDocument: vi.fn(),
  mockCleanup: vi.fn()
}))

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: mockGetDocument
}))

function mockPdfPages(pages: string[]) {
  mockCleanup.mockResolvedValue(undefined)
  mockGetDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: vi.fn((pageNumber: number) =>
        Promise.resolve({
          getTextContent: vi.fn().mockResolvedValue({
            items: pages[pageNumber - 1]
              .split(" ")
              .filter(Boolean)
              .map((str) => ({ str }))
          })
        })
      ),
      cleanup: mockCleanup
    })
  })
}

describe("loadPdfToDoc", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("default behavior (no split)", () => {
    it("should combine all pages into single document", async () => {
      mockPdfPages(["Page 1", "Page 2", "Page 3"])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("Page 1\n\nPage 2\n\nPage 3")
      expect(result[0].metadata.totalPages).toBe(3)
    })

    it("should handle single page PDF", async () => {
      mockPdfPages(["Single page content"])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("Single page content")
    })

    it("should handle empty PDF", async () => {
      mockPdfPages([])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("")
      expect(result[0].metadata.totalPages).toBe(0)
    })
  })

  describe("splitPages option", () => {
    it("should return separate document for each page", async () => {
      mockPdfPages(["First page content", "Second page content"])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob, { splitPages: true })

      expect(result).toHaveLength(2)
      expect(result[0].pageContent).toBe("First page content")
      expect(result[0].metadata.currentPage).toBe(1)
      expect(result[1].pageContent).toBe("Second page content")
      expect(result[1].metadata.currentPage).toBe(2)
      expect(result[0].metadata.totalPages).toBe(2)
      expect(result[1].metadata.totalPages).toBe(2)
    })

    it("should handle split with empty pages", async () => {
      mockPdfPages([""])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob, { splitPages: true })

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("")
    })
  })

  describe("file handling", () => {
    it("should handle File object", async () => {
      mockPdfPages(["Test content"])

      const mockFile = new File(["%PDF-1.4"], "resume.pdf", {
        type: "application/pdf"
      })
      const result = await loadPdfToDoc(mockFile)

      expect(result).toHaveLength(1)
    })

    it("should handle Blob object", async () => {
      mockPdfPages(["Test content"])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
    })

    it("should pass binary data to the PDF parser", async () => {
      mockPdfPages(["Content"])

      const buffer = new ArrayBuffer(100)
      const mockBlob = new Blob([buffer], { type: "application/pdf" })
      await loadPdfToDoc(mockBlob)

      expect(mockGetDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Uint8Array)
        })
      )
    })

    it("should clean up the parsed PDF document", async () => {
      mockPdfPages(["Content"])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      await loadPdfToDoc(mockBlob)

      expect(mockCleanup).toHaveBeenCalled()
    })
  })

  describe("metadata structure", () => {
    it("should have correct metadata properties for combined document", async () => {
      mockPdfPages(["Content"])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      const doc = result[0]
      expect(doc).toHaveProperty("pageContent")
      expect(doc).toHaveProperty("metadata")
      expect(doc.metadata).toHaveProperty("totalPages")
      expect(typeof doc.metadata.totalPages).toBe("number")
    })

    it("should have currentPage for split documents", async () => {
      mockPdfPages(["Page 1", "Page 2"])

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob, { splitPages: true })

      result.forEach((doc: Document) => {
        expect(doc.metadata).toHaveProperty("currentPage")
        expect(typeof doc.metadata.currentPage).toBe("number")
      })
    })
  })
})
