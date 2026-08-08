import {
  generateUploadedResumeFileName,
  resolveUploadedResumeFilePath
} from "./utils"
import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-nanoid")
}))

describe("generateUploadedResumeFileName", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should generate a nanoid-based filename with extension", () => {
    const result = generateUploadedResumeFileName("user-123", "resume.pdf")

    expect(result).toBe("user-123/resume_mock-nanoid.pdf")
  })

  it("should handle filenames with multiple dots", () => {
    const result = generateUploadedResumeFileName(
      "user-123",
      "my.resume.file.pdf"
    )

    expect(result).toBe("user-123/resume_mock-nanoid.pdf")
  })

  it("should handle files without extension", () => {
    const result = generateUploadedResumeFileName("user-123", "resume")

    expect(result).toBe("user-123/resume_mock-nanoid")
  })

  it("should handle dotfiles without treating them as extensions", () => {
    const result = generateUploadedResumeFileName("user-123", ".resume")

    expect(result).toBe("user-123/resume_mock-nanoid")
  })
})

describe("resolveUploadedResumeFilePath", () => {
  it("returns a stored private bucket path", () => {
    expect(resolveUploadedResumeFilePath("user-123/resume.pdf")).toBe(
      "user-123/resume.pdf"
    )
  })

  it("should extract file path from valid public URL", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/resume.pdf"
    const result = resolveUploadedResumeFilePath(url)

    expect(result).toBe("user-123/resume.pdf")
  })

  it("should handle URL without file", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/"
    const result = resolveUploadedResumeFilePath(url)

    expect(result).toBe("user-123/")
  })

  it("should return null when bucket name not found", () => {
    const url =
      "https://example.com/storage/v1/object/public/other-bucket/user-123/resume.pdf"
    const result = resolveUploadedResumeFilePath(url)

    expect(result).toBeNull()
  })

  it("should return null for invalid URL", () => {
    const result = resolveUploadedResumeFilePath("/not-a-storage-path")

    expect(result).toBeNull()
  })

  it("should return null when URL throws exception", () => {
    const result = resolveUploadedResumeFilePath("http://[invalid:url")

    expect(result).toBeNull()
  })

  it("should handle URL with query parameters", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/resume.pdf?token=abc"
    const result = resolveUploadedResumeFilePath(url)

    expect(result).toBe("user-123/resume.pdf")
  })

  it("should handle nested paths in filename", () => {
    const url =
      "https://example.com/storage/v1/object/public/upload-resumes/user-123/folder/resume.pdf"
    const result = resolveUploadedResumeFilePath(url)

    expect(result).toBe("user-123/folder/resume.pdf")
  })
})
