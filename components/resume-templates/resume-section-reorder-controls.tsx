"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ResumeSectionReorderControlsProps {
  className?: string
  disableMoveDown?: boolean
  disableMoveUp?: boolean
  onMoveDown?: () => void
  onMoveUp?: () => void
}

export function ResumeSectionReorderControls({
  className,
  disableMoveDown = false,
  disableMoveUp = false,
  onMoveDown,
  onMoveUp
}: ResumeSectionReorderControlsProps) {
  const t = useTranslations("rightPanel")

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t("moveSectionUp")}
            disabled={disableMoveUp}
            className={cn(
              "rounded-full border-border/70 bg-background/95 shadow-sm",
              className
            )}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (disableMoveUp) {
                return
              }
              onMoveUp?.()
            }}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          {t("moveSectionUp")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t("moveSectionDown")}
            disabled={disableMoveDown}
            className={cn(
              "rounded-full border-border/70 bg-background/95 shadow-sm",
              className
            )}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (disableMoveDown) {
                return
              }
              onMoveDown?.()
            }}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          {t("moveSectionDown")}
        </TooltipContent>
      </Tooltip>
    </>
  )
}
