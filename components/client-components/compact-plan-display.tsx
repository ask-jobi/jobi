"use client"

import { useEffect, useState } from "react"
import { Package, Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SubscriptionData {
  plan: 'FREE' | 'LITE' | 'PRO' | null
  expiryDate: string | null
  isActive: boolean
  quotas: {
    fullOptimize: { used: number; total: number }
    blockOptimize: { used: number; total: number }
    motivationLetter: { used: number; total: number }
  }
}


export function CompactPlanDisplay() {
  const t = useTranslations()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const getPlanGradient = (plan: string | null) => {
    switch (plan) {
      case 'PRO':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'LITE':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      case 'FREE':
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500'
    }
  }

  const getPlanName = (plan: string | null) => {
    switch (plan) {
      case 'PRO':
        return 'pro30Days'
      case 'LITE':
        return 'lite14Days'
      case 'FREE':
        return 'freeTrial'
      default:
        return 'noPlan'
    }
  }


  // 使用与侧边栏按钮相同的样式类
  const sidebarButtonStyle = cn(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    "h-8 text-sm"
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

    if (!subscription) {
      return (
        <>
          <div className="flex items-center gap-2 w-full">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("currentPlan")}</span>
          </div>
          <Badge variant="outline" className="text-xs ml-auto">
            {t("noPlan")}
          </Badge>
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
            getPlanGradient(subscription.plan)
          )}
        >
          {t(getPlanName(subscription.plan))}
        </Badge>
      </>
    )
  }

  const dialogBody = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
          </div>
        </div>
      )
    }

    if (!subscription) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("noPlan")}
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => router.push("/pricing")}
          >
            {t("buyPlan")}
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("planType")}</span>
            <span className="font-medium">{t(getPlanName(subscription.plan))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("status")}</span>
            <span className="font-medium">
              {subscription.isActive ? t("active") : t("expired")}
            </span>
          </div>
          {subscription.expiryDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("validUntil")}</span>
              <span className="font-medium">
                {new Date(subscription.expiryDate).toLocaleDateString("zh-CN")}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div className="font-semibold">{t("detailedUsage")}</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("fullOptimization")}</span>
              <span className="font-medium">
                {subscription.quotas.fullOptimize.used} / {subscription.quotas.fullOptimize.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("blockOptimization")}</span>
              <span className="font-medium">
                {subscription.quotas.blockOptimize.used} / {subscription.quotas.blockOptimize.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("motivationLetter")}</span>
              <span className="font-medium">
                {subscription.quotas.motivationLetter.used} / {subscription.quotas.motivationLetter.total}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            className="flex-1"
            variant={subscription.isActive ? "outline" : "default"}
            onClick={() => router.push("/pricing")}
          >
            {subscription.isActive ? t("renewPlan") : t("buyPlan")}
          </Button>
          {subscription.plan === "LITE" && (
            <Button
              type="button"
              className="flex-1"
              onClick={() => router.push("/pricing")}
            >
              {t("upgradeToPro")}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                type="button"
                className={sidebarButtonStyle}
              >
                {buttonContent()}
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          {subscription && !loading && (
            <TooltipContent side="right" className="w-64 p-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <h4 className="font-semibold text-sm">{t("planDetails")}</h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("planType")}</span>
                    <span className="font-medium">
                      {t(getPlanName(subscription.plan))}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("status")}</span>
                    <span className="font-medium">
                      {subscription.isActive ? t("active") : t("expired")}
                    </span>
                  </div>

                  {subscription.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("validUntil")}
                      </span>
                      <span className="font-medium">
                        {new Date(subscription.expiryDate).toLocaleDateString(
                          "zh-CN"
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("fullOptimization")}
                    </span>
                    <span className="font-medium">
                      {subscription.quotas.fullOptimize.used} /{" "}
                      {subscription.quotas.fullOptimize.total}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("blockOptimization")}
                    </span>
                    <span className="font-medium">
                      {subscription.quotas.blockOptimize.used} /{" "}
                      {subscription.quotas.blockOptimize.total}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("motivationLetter")}
                    </span>
                    <span className="font-medium">
                      {subscription.quotas.motivationLetter.used} /{" "}
                      {subscription.quotas.motivationLetter.total}
                    </span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("subscriptionAndUsage")}</DialogTitle>
        </DialogHeader>
        {dialogBody()}
      </DialogContent>
    </Dialog>
  )
}
