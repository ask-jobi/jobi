"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { ResumeSectionEditAction } from "@/components/resume-templates/resume-section-edit-action"
import { cn } from "@/lib/utils"

const EDIT_ACTION_HIDE_DELAY_MS = 50

interface ResumeSectionActionButtonGroupProps {
  actionClassName?: string
  children: ReactNode
  className?: string
  id?: string
  isInteractive?: boolean
  onEdit?: () => void
}

export function ResumeSectionActionButtonGroup({
  actionClassName,
  children,
  className,
  id,
  isInteractive = false,
  onEdit
}: ResumeSectionActionButtonGroupProps) {
  const [isActionVisible, setIsActionVisible] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const isActionEnabled = isInteractive && !!onEdit

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const showAction = () => {
    clearHideTimer()
    setIsActionVisible(true)
  }

  const hideAction = () => {
    clearHideTimer()
    hideTimerRef.current = window.setTimeout(() => {
      setIsActionVisible(false)
      hideTimerRef.current = null
    }, EDIT_ACTION_HIDE_DELAY_MS)
  }

  useEffect(() => clearHideTimer, [])

  return (
    <div
      id={id}
      className={cn("relative", className)}
      onBlurCapture={isActionEnabled ? hideAction : undefined}
      onFocusCapture={isActionEnabled ? showAction : undefined}
      onMouseEnter={isActionEnabled ? showAction : undefined}
      onMouseLeave={isActionEnabled ? hideAction : undefined}
    >
      {isActionEnabled && onEdit && (
        <ResumeSectionEditAction
          className={actionClassName}
          isVisible={isActionVisible}
          onClick={onEdit}
        />
      )}
      {children}
    </div>
  )
}
