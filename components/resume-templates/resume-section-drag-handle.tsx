"use client"

import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"
import type { DraggableAttributes } from "@dnd-kit/core"
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import { cn } from "@/lib/utils"

interface ResumeSectionDragHandleProps {
  attributes?: DraggableAttributes
  className?: string
  disabled?: boolean
  listeners?: SyntheticListenerMap
}

export function ResumeSectionDragHandle({
  attributes,
  className,
  disabled = false,
  listeners
}: ResumeSectionDragHandleProps) {
  const t = useTranslations("rightPanel")

  return (
    <button
      type="button"
      aria-label={t("reorderEntry")}
      className={cn(
        "inline-flex h-6 w-6 cursor-grab items-center justify-center border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}
