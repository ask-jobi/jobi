"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { ResumeSectionAddAction } from "@/components/resume-templates/resume-section-add-action"
import { ResumeSectionDeleteAction } from "@/components/resume-templates/resume-section-delete-action"
import { ResumeSectionEditAction } from "@/components/resume-templates/resume-section-edit-action"
import { cn } from "@/lib/utils"

const EDIT_ACTION_HIDE_DELAY_MS = 50

interface ResumeSectionActionButtonGroupProps {
  actionClassName?: string
  children: ReactNode
  className?: string
  id?: string
  isInteractive?: boolean
  onAdd?: () => void
  onDelete?: () => void
  onEdit?: () => void
}

export function ResumeSectionActionButtonGroup({
  actionClassName,
  children,
  className,
  id,
  isInteractive = false,
  onAdd,
  onDelete,
  onEdit
}: ResumeSectionActionButtonGroupProps) {
  const [isActionVisible, setIsActionVisible] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const isActionEnabled = isInteractive && (!!onEdit || !!onAdd || !!onDelete)

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
      {isActionEnabled && (
        <div
          className={cn(
            "absolute z-50 flex items-center gap-2 transition-all duration-200 motion-safe:translate-x-2",
            isActionVisible
              ? "pointer-events-auto translate-x-0 opacity-100"
              : "pointer-events-none opacity-0",
            actionClassName
          )}
        >
          {onEdit && <ResumeSectionEditAction onClick={onEdit} />}
          {onAdd && <ResumeSectionAddAction onClick={onAdd} />}
          {onDelete && <ResumeSectionDeleteAction onClick={onDelete} />}
        </div>
      )}
      {children}
    </div>
  )
}
