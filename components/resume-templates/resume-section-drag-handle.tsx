"use client"

import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"
import type { DraggableAttributes } from "@dnd-kit/core"
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import { Button } from "@/components/ui/button"
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
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={t("reorderEntry")}
      className={cn(
        "cursor-grab rounded-full border-border/70 bg-background/95 shadow-sm active:cursor-grabbing",
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
      <GripVertical className="h-3.5 w-3.5" />
    </Button>
  )
}
