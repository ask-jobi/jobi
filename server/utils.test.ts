import {
  getUniqueFileName,
  extractFilePathFromPublicUrl,
  BUCKET_NAME
} from "./utils"
import { vi, describe, it, expect, beforeEach } from "vitest"

describe("getUniqueFileName", () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn()
        })
      }
    }
  })

  it("should return original filename when file does not exist", async () => {
    const listMock = vi.fn().mockResolvedValue({ data: [], error: null })
    mockSupabase.storage.from(BUCKET_NAME).list = listMock

    const result = await getUniqueFileName(
      mockSupabase,
      "user-123",
      "resume.pdf"
    )

    expect(result).toBe("user-123/resume.pdf")
    expect(listMock).toHaveBeenCalledWith("user-123", {
      search: "resume.pdf"
    })
  })

  it("should append counter when file exists", async () => {
    const listMock = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ name: "resume.pdf" }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.storage.from(BUCKET_NAME).list = listMock

    const result = await getUniqueFileName(
      mockSupabase,
      "user-123",
      "resume.pdf"
    )

    expect(result).toBe("user-123/resume-1.pdf")
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it("should increment counter for multiple duplicates", async () => {
    const listMock = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ name: "resume.pdf" }], error: null })
      .mockResolvedValueOnce({ data: [{ name: "resume-1.pdf" }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.storage.from(BUCKET_NAME).list = listMock

    const result = await getUniqueFileName(
      mockSupabase,
      "user-123",
      "resume.pdf"
    )

    expect(result).toBe("user-123/resume-2.pdf")
    expect(listMock).toHaveBeenCalledTimes(3)
  })

  it("should throw error when storage list fails", async () => {
    const listMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Permission denied" }
    })
    mockSupabase.storage.from(BUCKET_NAME).list = listMock

    await expect(
      getUniqueFileName(mockSupabase, "user-123", "resume.pdf")
    ).rejects.toThrow("Failed to check file existence: Permission denied")
  })

  it("should handle filenames with multiple dots", async () => {
    const listMock = vi.fn().mockResolvedValue({ data: [], error: null })
    mockSupabase.storage.from(BUCKET_NAME).list = listMock

    const result = await getUniqueFileName(
      mockSupabase,
      "user-123",
      "my.resume.file.pdf"
    )

    expect(result).toBe("user-123/my.resume.file.pdf")
  })

  it("should handle empty file extension edge case", async () => {
    const listMock = vi.fn().mockResolvedValue({ data: [], error: null })
    mockSupabase.storage.from(BUCKET_NAME).list = listMock

    const result = await getUniqueFileName(mockSupabase, "user-123", "resume")

    expect(result).toBe("user-123/resume")
  })
})

describe("extractFilePathFromPublicUrl", () => {
  it("should extract file path from valid public URL", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/resume.pdf"
    const result = extractFilePathFromPublicUrl(url)

    expect(result).toBe("user-123/resume.pdf")
  })

  it("should handle URL without file", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/"
    const result = extractFilePathFromPublicUrl(url)

    expect(result).toBe("user-123/")
  })

  it("should return null when bucket name not found", () => {
    const url =
      "https://example.com/storage/v1/object/public/other-bucket/user-123/resume.pdf"
    const result = extractFilePathFromPublicUrl(url)

    expect(result).toBeNull()
  })

  it("should return null for invalid URL", () => {
    const result = extractFilePathFromPublicUrl("not-a-url")

    expect(result).toBeNull()
  })

  it("should return null when URL throws exception", () => {
    const result = extractFilePathFromPublicUrl("http://[invalid:url")

    expect(result).toBeNull()
  })

  it("should handle URL with query parameters", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/resume.pdf?token=abc"
    const result = extractFilePathFromPublicUrl(url)

    expect(result).toBe("user-123/resume.pdf")
  })

  it("should handle nested paths in filename", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/folder/resume.pdf"
    const result = extractFilePathFromPublicUrl(url)

    expect(result).toBe("user-123/folder/resume.pdf")
  })
})
