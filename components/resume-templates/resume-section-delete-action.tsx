"use client"

import { useEffect, useId, useState } from "react"
import { Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DELETE_CONFIRM_TIMEOUT_MS = 2500

interface ResumeSectionDeleteActionProps {
  className?: string
  disabled?: boolean
  onClick: () => void
}

export function ResumeSectionDeleteAction({
  className,
  disabled = false,
  onClick
}: ResumeSectionDeleteActionProps) {
  const t = useTranslations("rightPanel")
  const [isConfirming, setIsConfirming] = useState(false)
  const actionId = useId()

  useEffect(() => {
    if (!isConfirming) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsConfirming(false)
    }, DELETE_CONFIRM_TIMEOUT_MS)

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (
        target instanceof HTMLElement &&
        target.closest(`[data-resume-delete-action="${actionId}"]`)
      ) {
        return
      }

      setIsConfirming(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConfirming(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(timeoutId)
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [actionId, isConfirming])

  return (
    <Tooltip open={isConfirming}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={t("deleteEntry")}
          data-resume-delete-action={actionId}
          disabled={disabled}
          className={cn(
            "rounded-full border-destructive/30 bg-background/95 p-0 text-destructive shadow-sm hover:bg-destructive/5 hover:text-destructive",
            className
          )}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()

            if (disabled) {
              setIsConfirming(false)
              return
            }

            if (isConfirming) {
              setIsConfirming(false)
              onClick()
              return
            }

            setIsConfirming(true)
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        className="pointer-events-none"
        side="left"
        sideOffset={8}
      >
        {t("confirmDeleteEntry")}
      </TooltipContent>
    </Tooltip>
  )
}
