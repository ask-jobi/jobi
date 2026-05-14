"use client"

import { PencilLine } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResumeSectionEditActionProps {
  className?: string
  isVisible?: boolean
  onClick: () => void
}

export function ResumeSectionEditAction({
  className,
  isVisible = false,
  onClick
}: ResumeSectionEditActionProps) {
  const t = useTranslations("rightPanel")

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "absolute top-2 z-50 h-8 rounded-full border-border/70 bg-background/95 px-3 text-xs font-medium shadow-sm transition-all duration-200 motion-safe:translate-x-2",
        isVisible
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "pointer-events-none opacity-0",
        className
      )}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
    >
      <PencilLine className="mr-1.5 h-3.5 w-3.5" />
      {t("editSection")}
    </Button>
  )
}
