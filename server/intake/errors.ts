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

  /** PDF parser could not read the uploaded file */
  pdfExtractionFailed: (details?: unknown) =>
    error(
      "PDF_EXTRACTION_FAILED",
      "Could not read the uploaded PDF. Please try again or upload a different PDF.",
      details
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

  /** Generic internal error fallback */
  internal: (details?: unknown) =>
    error("INTERNAL_ERROR", "An internal error occurred.", details)
} as const
