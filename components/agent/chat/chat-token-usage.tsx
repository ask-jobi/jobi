"use client"

import { useAuiState } from "@assistant-ui/react"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { useChatSessionIdValue } from "@/lib/store/chat"
import { useChatSessionTokenUsage } from "@/lib/hooks/use-chat-session-token-usage"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export const CHAT_TOKEN_SOFT_LIMIT = 100_000

function formatTokenCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function getUsagePercentage(totalTokens: number) {
  if (CHAT_TOKEN_SOFT_LIMIT <= 0) {
    return 0
  }

  return Math.min(Math.round((totalTokens / CHAT_TOKEN_SOFT_LIMIT) * 100), 100)
}

function getIndicatorClassName(percentage: number) {
  if (percentage >= 90) {
    return "bg-destructive"
  }

  if (percentage >= 70) {
    return "bg-amber-500"
  }

  return "bg-primary"
}

export function ChatTokenUsage() {
  const t = useTranslations("chat")
  const sessionId = useChatSessionIdValue()
  const isRunning = useAuiState((s) => s.thread.isRunning)
  const messages = useAuiState((s) => s.thread.messages ?? [])
  const lastMessage = messages[messages.length - 1]
  const refreshKey = `${messages.length}:${lastMessage?.id ?? "none"}:${lastMessage?.metadata?.tokenUsage?.totalTokens ?? 0}`
  const { tokenUsage, isLoading, error } = useChatSessionTokenUsage({
    sessionId,
    refreshKey,
    enabled: !isRunning
  })
  const hasError = !!error
  const totalTokens = tokenUsage?.totalTokens ?? 0
  const usagePercentage = getUsagePercentage(totalTokens)
  const usageItems = tokenUsage
    ? [
        { label: t("tokenInput"), value: tokenUsage.totalInputTokens },
        { label: t("tokenOutput"), value: tokenUsage.totalOutputTokens },
        { label: t("tokenCached"), value: tokenUsage.totalCachedTokens },
        { label: t("tokenReasoning"), value: tokenUsage.totalReasoningTokens },
        { label: t("tokenTotal"), value: tokenUsage.totalTokens }
      ]
    : []

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="ml-auto w-full max-w-40 self-end">
          <Progress
            value={isLoading ? undefined : usagePercentage}
            showAnimate={isLoading}
            indicatorClassName={cn(
              getIndicatorClassName(usagePercentage),
              isLoading && "bg-primary/70",
              hasError && "bg-muted-foreground/40"
            )}
            className="h-1.5 cursor-default bg-muted/70"
            aria-label={t("tokenSoftLimit")}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="w-56 p-3">
        {hasError ? (
          <p className="text-xs leading-relaxed">
            {t("tokenUsageUnavailable")}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-medium">{t("tokenUsageDetails")}</div>
            <div className="space-y-1.5">
              {usageItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-background/70">{item.label}</span>
                  <span className="tabular-nums">
                    {formatTokenCount(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
