"use client"

import { PencilLine } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResumeSectionEditActionProps {
  className?: string
  onClick: () => void
}

export function ResumeSectionEditAction({
  className,
  onClick
}: ResumeSectionEditActionProps) {
  const t = useTranslations("rightPanel")

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "pointer-events-none absolute top-2 z-50 h-8 rounded-full border-border/70 bg-background/95 px-3 text-xs font-medium shadow-sm opacity-0 transition-all duration-200 group-hover/resume-section:pointer-events-auto group-hover/resume-section:translate-x-0 group-hover/resume-section:opacity-100 group-focus-within/resume-section:pointer-events-auto group-focus-within/resume-section:translate-x-0 group-focus-within/resume-section:opacity-100 motion-safe:translate-x-2",
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
