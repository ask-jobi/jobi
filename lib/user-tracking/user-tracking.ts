'use client'

/**
 * Umami 用户识别
 * 在用户登录后调用此函数来识别用户身份
 * @param userId 用户ID
 * @param email 用户邮箱（可选）
 * @param metadata 额外的用户元数据（可选）
 */
export function identifyUser(
  userId: string,
  email?: string,
  metadata?: Record<string, string | number>
) {
  if (typeof window === 'undefined') return

  // 检查 umami 是否已加载
  if (typeof window.umami === 'undefined') {
    console.warn('Umami is not loaded yet')
    return
  }

  try {
    const userData: Record<string, string | number> = {
      ...(email && { email }),
      ...metadata,
    }
    window.umami.identify(userId, Object.keys(userData).length > 0 ? userData : undefined)
  } catch (error) {
    console.error('Failed to identify user:', error)
  }
}

/**
 * 跟踪事件
 * @param eventName 事件名称
 * @param metadata 事件元数据（可选）
 */
function trackEvent(eventName: string, metadata?: Record<string, string | number>) {
  if (typeof window === 'undefined') return

  // 检查 umami 是否已加载
  if (typeof window.umami === 'undefined') {
    console.warn('Umami is not loaded yet')
    return
  }

  try {
    window.umami.track(eventName, metadata)
  } catch (error) {
    console.error('Failed to track resume upload:', error)
  }
}

export function trackOpenResumeUploadDialog() {
  trackEvent('resume_upload_dialog_opened');
}

export function trackSelectResumeFile(metadata?: Record<string, string | number>) {
  trackEvent('resume_file_selected', metadata);
}

export function trackStartResumeUpload(metadata?: Record<string, string | number>) {
  trackEvent('resume_upload_started', metadata);
}

export function trackSuccessResumeUpload(metadata?: Record<string, string | number>) {
  trackEvent('resume_upload_success', metadata);
}

export function trackFailedResumeUpload(metadata?: Record<string, string | number>) {
  trackEvent('resume_upload_failed', metadata);
}

export function trackViewResume(metadata?: Record<string, string | number>) {
  trackEvent('resume_viewed', metadata);
}

export function trackClickAiFullSuggestion(){
    trackEvent('ai_full_suggestion_clicked');
}

export function trackExportResume(){
    trackEvent('resume_exported');
}