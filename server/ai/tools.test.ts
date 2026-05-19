/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from "vitest"
import { loadPdfToDoc, Document } from "./tools"

// Mock pdf-parse
const mockPdfParse = vi.fn()

vi.mock("pdf-parse/worker", () => ({}))

vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn().mockImplementation(function (this: any, data: any) {
    this.data = data
    this.getText = mockPdfParse
    this.destroy = vi.fn().mockResolvedValue(undefined)
  })
}))

describe("loadPdfToDoc", () => {
  describe("default behavior (no split)", () => {
    it("should combine all pages into single document", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Full PDF text content",
        total: 3,
        pages: [
          { num: 1, text: "Page 1" },
          { num: 2, text: "Page 2" },
          { num: 3, text: "Page 3" }
        ]
      })

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("Full PDF text content")
      expect(result[0].metadata.totalPages).toBe(3)
    })

    it("should handle single page PDF", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Single page content",
        total: 1,
        pages: [{ num: 1, text: "Single page content" }]
      })

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("Single page content")
    })

    it("should handle empty PDF", async () => {
      mockPdfParse.mockResolvedValue({
        text: "",
        total: 0,
        pages: []
      })

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("")
      expect(result[0].metadata.totalPages).toBe(0)
    })
  })

  describe("splitPages option", () => {
    it("should return separate document for each page", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Full text",
        total: 2,
        pages: [
          { num: 1, text: "First page content" },
          { num: 2, text: "Second page content" }
        ]
      })

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
      mockPdfParse.mockResolvedValue({
        text: "",
        total: 1,
        pages: [{ num: 1, text: "" }]
      })

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob, { splitPages: true })

      expect(result).toHaveLength(1)
      expect(result[0].pageContent).toBe("")
    })
  })

  describe("file handling", () => {
    it("should handle File object", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Test content",
        total: 1,
        pages: [{ num: 1, text: "Test content" }]
      })

      const mockFile = new File(["%PDF-1.4"], "resume.pdf", {
        type: "application/pdf"
      })
      const result = await loadPdfToDoc(mockFile)

      expect(result).toHaveLength(1)
    })

    it("should handle Blob object", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Test content",
        total: 1,
        pages: [{ num: 1, text: "Test content" }]
      })

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      expect(result).toHaveLength(1)
    })

    it("should convert ArrayBuffer to Buffer correctly", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Content",
        total: 1,
        pages: [{ num: 1, text: "Content" }]
      })

      const buffer = new ArrayBuffer(100)
      const mockBlob = new Blob([buffer], { type: "application/pdf" })
      await loadPdfToDoc(mockBlob)

      // Verify the mock was called (pdf-parse received buffer data)
      expect(mockPdfParse).toHaveBeenCalled()
    })
  })

  describe("metadata structure", () => {
    it("should have correct metadata properties for combined document", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Content",
        total: 5,
        pages: [{ num: 1, text: "Content" }]
      })

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob)

      const doc = result[0]
      expect(doc).toHaveProperty("pageContent")
      expect(doc).toHaveProperty("metadata")
      expect(doc.metadata).toHaveProperty("totalPages")
      expect(typeof doc.metadata.totalPages).toBe("number")
    })

    it("should have currentPage for split documents", async () => {
      mockPdfParse.mockResolvedValue({
        text: "Content",
        total: 3,
        pages: [
          { num: 1, text: "Page 1" },
          { num: 2, text: "Page 2" }
        ]
      })

      const mockBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" })
      const result = await loadPdfToDoc(mockBlob, { splitPages: true })

      result.forEach((doc: Document) => {
        expect(doc.metadata).toHaveProperty("currentPage")
        expect(typeof doc.metadata.currentPage).toBe("number")
      })
    })
  })
})
