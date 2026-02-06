"use client"

import { ComposerPrimitive, AuiIf } from "@assistant-ui/react"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon, SquareIcon } from "lucide-react"
import { useTranslations } from "next-intl"

export function Composer() {
  const t = useTranslations("chat")
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <div className="relative">
        <ComposerPrimitive.Input
          placeholder={t("composerPlaceholder")}
          className="aui-composer-input pr-12 max-h-32 min-h-14 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <div className="aui-composer-action-wrapper absolute bottom-3 right-2 flex items-center gap-1">
          <AuiIf condition={(s) => !s.thread.isRunning}>
            <ComposerPrimitive.Send asChild>
              <Button
                type="submit"
                size="icon"
                className="rounded-full h-8 w-8"
                aria-label="Send message"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
            </ComposerPrimitive.Send>
          </AuiIf>
          <AuiIf condition={(s) => s.thread.isRunning}>
            <ComposerPrimitive.Cancel asChild>
              <Button
                type="button"
                size="icon"
                variant="default"
                className="rounded-full h-8 w-8"
                aria-label={t("stopGenerating")}
              >
                <SquareIcon className="h-3 w-3 fill-current" />
              </Button>
            </ComposerPrimitive.Cancel>
          </AuiIf>
        </div>
      </div>
    </ComposerPrimitive.Root>
  )
}
