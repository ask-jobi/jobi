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
        "h-8 rounded-full border-border/70 bg-background/95 px-3 text-xs font-medium shadow-sm",
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
