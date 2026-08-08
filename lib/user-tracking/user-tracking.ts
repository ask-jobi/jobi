"use client"

/**
 * 跟踪事件
 * @param eventName 事件名称
 * @param metadata 事件元数据（可选）
 */
function trackEvent(
  eventName: string,
  metadata?: Record<string, string | number>
) {
  if (typeof window === "undefined") return

  // 检查 umami 是否已加载
  if (typeof window.umami === "undefined") {
    console.warn("Umami is not loaded yet")
    return
  }

  try {
    window.umami.track(eventName, metadata)
  } catch (error) {
    console.error("Failed to track resume upload:", error)
  }
}

export function trackOpenResumeUploadDialog() {
  trackEvent("resume_upload_dialog_opened")
}

export function trackSelectResumeFile(
  metadata?: Record<string, string | number>
) {
  trackEvent("resume_file_selected", metadata)
}

export function trackStartResumeUpload(
  metadata?: Record<string, string | number>
) {
  trackEvent("resume_upload_started", metadata)
}

export function trackSuccessResumeUpload(
  metadata?: Record<string, string | number>
) {
  trackEvent("resume_upload_success", metadata)
}

export function trackFailedResumeUpload(
  metadata?: Record<string, string | number>
) {
  trackEvent("resume_upload_failed", metadata)
}

export function trackViewResume(metadata?: Record<string, string | number>) {
  trackEvent("resume_viewed", metadata)
}

export function trackClickAiFullSuggestion() {
  trackEvent("ai_full_suggestion_clicked")
}

export function trackExportResume() {
  trackEvent("resume_exported")
}
