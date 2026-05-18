"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResumeSectionAddActionProps {
  className?: string
  disabled?: boolean
  onClick: () => void
}

export function ResumeSectionAddAction({
  className,
  disabled = false,
  onClick
}: ResumeSectionAddActionProps) {
  const t = useTranslations("rightPanel")

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-8 rounded-full border-border/70 bg-background/95 px-3 text-xs font-medium shadow-sm",
        className
      )}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (disabled) {
          return
        }
        onClick()
      }}
    >
      <Plus className="mr-1.5 h-3.5 w-3.5" />
      {t("addEntry")}
    </Button>
  )
}
