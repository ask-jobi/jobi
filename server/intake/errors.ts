import type { IntakeError } from "./types"

const error = (
  code: string,
  userMessage: string,
  details?: unknown
): IntakeError => ({ code, userMessage, details })

export const IntakeErrors = {
  /** PDF text extraction produced no usable text */
  emptyPdfText: () =>
    error(
      "EMPTY_PDF_TEXT",
      "Could not extract text from the uploaded PDF. Please upload a text-based PDF resume."
    ),

  /** Resume parsing failed (AI/model error) */
  parseFailed: (details?: unknown) =>
    error("PARSE_FAILED", "Failed to parse resume content.", details),

  /** File upload to storage failed */
  uploadFailed: (details?: unknown) =>
    error("UPLOAD_FAILED", "Failed to upload resume file.", details),

  /** Persist DB operations failed */
  persistFailed: (details?: unknown) =>
    error("PERSIST_FAILED", "Failed to save application data.", details),

  /** Evaluation generation/save failed */
  evaluateFailed: (details?: unknown) =>
    error("EVALUATE_FAILED", "Failed to evaluate resume.", details),

  /** Intake was cancelled before commit point */
  cancelled: () =>
    error("INTAKE_CANCELLED", "The upload was cancelled before completion."),

  /** Resume parsing quota blocks new starts once already exhausted */
  quotaExceeded: (details?: unknown) =>
    error(
      "QUOTA_EXCEEDED",
      "Resume parsing quota has been reached. Please upgrade or wait for quota to refresh.",
      details
    ),

  /** Generic internal error fallback */
  internal: (details?: unknown) =>
    error("INTERNAL_ERROR", "An internal error occurred.", details)
} as const
