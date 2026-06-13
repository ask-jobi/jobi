import { nanoid } from "nanoid"

export const BUCKET_NAME = "upload-resumes"

export function generateUploadedResumeFileName(
  userId: string,
  originalFileName: string
): string {
  const lastDotIndex = originalFileName.lastIndexOf(".")
  const hasExtension =
    lastDotIndex > 0 && lastDotIndex < originalFileName.length - 1
  const extension = hasExtension ? originalFileName.slice(lastDotIndex + 1) : ""
  const generatedName = nanoid()

  return extension
    ? `${userId}/resume_${generatedName}.${extension}`
    : `${userId}/resume_${generatedName}`
}

export function extractFilePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    // 提取路径部分，格式: /storage/v1/object/public/upload-resumes/userId/filename.pdf
    const pathParts = url.pathname.split("/")
    // 找到 BUCKET_NAME 的索引，然后取后面的部分
    const bucketIndex = pathParts.indexOf(BUCKET_NAME)
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null
    }
    // 提取 userId/filename.pdf
    const filePath = pathParts.slice(bucketIndex + 1).join("/")
    return filePath || null
  } catch (error) {
    console.error("Failed to extract file path from publicUrl:", error)
    return null
  }
}
