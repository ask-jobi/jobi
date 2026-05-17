"use client"

import { useEffect, useState } from "react"
import { Package } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SubscriptionData {
  plan: "FREE" | "LITE" | "PRO" | null
  chatTokenLimit: number
  chatTokenUsed?: number
  chatTokenRemaining?: number
}

export function CompactPlanDisplay() {
  const t = useTranslations()
  const router = useRouter()
  const [tokenBalance, setTokenBalance] = useState<SubscriptionData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        const response = await fetch("/api/user/token-balance")
        if (response.ok) {
          const data = await response.json()
          setTokenBalance(data)
        }
      } catch (error) {
        console.error("Error fetching token balance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenBalance()
  }, [])

  const getPlanGradient = (plan: string | null) => {
    switch (plan) {
      case "PRO":
        return "bg-gradient-to-r from-purple-500 to-pink-500"
      case "LITE":
        return "bg-gradient-to-r from-blue-500 to-cyan-500"
      case "FREE":
        return "bg-gradient-to-r from-gray-500 to-gray-600"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500"
    }
  }

  const getPlanName = (plan: string | null) => {
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

  const numberFormatter = new Intl.NumberFormat("en-US")
  const tokenTotal = tokenBalance?.chatTokenLimit ?? 0
  const tokenUsed = tokenBalance?.chatTokenUsed ?? 0
  const tokenRemaining =
    tokenBalance?.chatTokenRemaining ?? Math.max(tokenTotal - tokenUsed, 0)

  const sidebarButtonStyle = cn(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    "h-8 text-sm"
  )

  const renderTokenSummary = (compact = false) => (
    <div className={compact ? "space-y-2 text-xs" : "space-y-3 text-sm"}>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("currentPlan")}</span>
        <span className="font-medium">
          {tokenBalance ? t(getPlanName(tokenBalance.plan)) : t("noPlan")}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("tokenTotal")}</span>
        <span className="font-medium tabular-nums">
          {numberFormatter.format(tokenTotal)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("tokenUsed")}</span>
        <span className="font-medium tabular-nums">
          {numberFormatter.format(tokenUsed)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("tokenRemaining")}</span>
        <span className="font-medium tabular-nums">
          {numberFormatter.format(tokenRemaining)}
        </span>
      </div>
    </div>
  )

  const buttonContent = () => {
    if (loading) {
      return (
        <>
          <div className="flex items-center gap-2 w-full">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("currentPlan")}</span>
          </div>
          <div className="h-5 w-16 bg-muted rounded animate-pulse ml-auto" />
        </>
      )
    }

    return (
      <>
        <div className="flex items-center gap-2 w-full">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("currentPlan")}</span>
        </div>
        <Badge
          className={cn(
            "text-white border-0 text-xs",
            getPlanGradient(tokenBalance?.plan ?? null)
          )}
        >
          {tokenBalance ? t(getPlanName(tokenBalance.plan)) : t("noPlan")}
        </Badge>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button type="button" className={sidebarButtonStyle}>
                {buttonContent()}
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          {!loading && (
            <TooltipContent side="right" className="w-64 p-3">
              {renderTokenSummary(true)}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("tokenBalance")}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-4">
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {renderTokenSummary()}
            <Button type="button" className="w-full" onClick={() => router.push("/pricing")}>
              {t("pricingPage")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
