"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Zap } from "lucide-react"
import { useTranslations } from "next-intl"

import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { TOKEN_BALANCE_UPDATED_EVENT } from "@/lib/token-balance-events"
import { cn } from "@/lib/utils"

interface TokenBalance {
  plan: "FREE" | "LITE" | "PRO" | null
  chatTokenLimit: number
  chatTokenUsed?: number
  chatTokenRemaining?: number
}

function formatTokenCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function getUsagePercentage(used: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.min(Math.round((used / total) * 100), 100)
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

function getPlanLabelKey(plan: TokenBalance["plan"]) {
  switch (plan) {
    case "PRO":
      return "planPro"
    case "LITE":
      return "planLite"
    case "FREE":
      return "planFree"
    default:
      return "noPlan"
  }
}

export function ApplicationTokenUsage() {
  const t = useTranslations()
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchTokenBalance = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    try {
      const response = await fetch("/api/user/token-balance")

      if (!response.ok) {
        throw new Error("Failed to fetch token balance")
      }

      const payload = (await response.json()) as TokenBalance

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return
      }

      setTokenBalance(payload)
      setError(null)
    } catch (fetchError: unknown) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return
      }

      setError(
        fetchError instanceof Error
          ? fetchError
          : new Error("Failed to fetch token balance")
      )
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchTokenBalance()

    const intervalId = window.setInterval(() => {
      void fetchTokenBalance()
    }, 30000)

    const handleFocus = () => {
      void fetchTokenBalance()
    }

    const handleTokenBalanceUpdated = () => {
      void fetchTokenBalance()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchTokenBalance()
      }
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener(
      TOKEN_BALANCE_UPDATED_EVENT,
      handleTokenBalanceUpdated
    )
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener(
        TOKEN_BALANCE_UPDATED_EVENT,
        handleTokenBalanceUpdated
      )
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchTokenBalance])

  const tokenTotal = tokenBalance?.chatTokenLimit ?? 0
  const tokenUsed = tokenBalance?.chatTokenUsed ?? 0
  const tokenRemaining =
    tokenBalance?.chatTokenRemaining ?? Math.max(tokenTotal - tokenUsed, 0)
  const usagePercentage = getUsagePercentage(tokenUsed, tokenTotal)
  const summaryText = error
    ? "-- / --"
    : `${formatTokenCount(tokenUsed)} / ${formatTokenCount(tokenTotal)}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-full max-w-[240px] cursor-default flex-col gap-1.5 bg-transparent px-0 py-0">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="h-3.5 w-3.5 shrink-0 text-foreground" />
            <span className="truncate font-medium text-foreground">
              {t("tokenHeader")}
            </span>
            <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
              {isLoading ? "..." : summaryText}
            </span>
          </div>
          <Progress
            value={isLoading ? undefined : usagePercentage}
            showAnimate={isLoading}
            indicatorClassName={cn(
              getIndicatorClassName(usagePercentage),
              isLoading && "bg-primary/70",
              error && "bg-muted-foreground/40"
            )}
            className="h-1.5 cursor-default bg-muted"
            aria-label={t("tokenUsed")}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={10} className="w-56 p-3">
        {error ? (
          <p className="text-xs leading-relaxed">
            {t("failedToLoadTokenBalance")}
          </p>
        ) : (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t("currentPlan")}</span>
              <span className="tabular-nums">
                {t(getPlanLabelKey(tokenBalance?.plan ?? null))}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t("tokenTotal")}</span>
              <span className="tabular-nums">
                {formatTokenCount(tokenTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t("tokenUsed")}</span>
              <span className="tabular-nums">
                {formatTokenCount(tokenUsed)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {t("tokenRemaining")}
              </span>
              <span className="tabular-nums">
                {formatTokenCount(tokenRemaining)}
              </span>
            </div>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
