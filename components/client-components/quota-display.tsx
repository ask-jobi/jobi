"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Package, RefreshCw, ArrowUpRight, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

interface QuotaDisplayProps {
  subscription: {
    plan: "FREE" | "LITE" | "PRO" | null
    planName: string
    expiryDate: string | null
    isActive: boolean
    chatTokenLimit: number
    quotas: {
      fullOptimize: { used: number; total: number }
      blockOptimize: { used: number; total: number }
      motivationLetter: { used: number; total: number }
    }
  }
}

export function QuotaDisplay({ subscription }: QuotaDisplayProps) {
  const router = useRouter()
  const t = useTranslations()
  const numberFormatter = new Intl.NumberFormat("en-US")

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("noActivePlan")
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

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
        return "pro30Days"
      case "LITE":
        return "lite14Days"
      case "FREE":
        return "freeTrial"
      default:
        return "noPlan"
    }
  }

  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0
    return Math.round((used / total) * 100)
  }

  const handleUpgrade = () => {
    router.push("/pricing")
  }

  const handleRenew = () => {
    router.push("/pricing")
  }

  return (
    <Card className="w-full border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            {t("currentPlan")}
          </CardTitle>
          <Badge
            className={`text-white border-0 ${getPlanGradient(subscription.plan)}`}
          >
            {t(getPlanName(subscription.plan))}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {/* 有效期 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">{t("validUntil")}</span>
          </div>
          <span className="font-semibold text-sm">
            {formatDate(subscription.expiryDate)}
          </span>
        </div>

        {/* 详细用量信息 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold text-sm">{t("detailedUsage")}</h4>
          </div>

          {/* 整体优化 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("fullOptimization")}
              </span>
              <span className="font-medium">
                {subscription.quotas.fullOptimize.used} /{" "}
                {subscription.quotas.fullOptimize.total}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(
                subscription.quotas.fullOptimize.used,
                subscription.quotas.fullOptimize.total
              )}
              className="h-2"
            />
          </div>

          {/* 区块优化 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("blockOptimization")}
              </span>
              <span className="font-medium">
                {subscription.quotas.blockOptimize.used} /{" "}
                {subscription.quotas.blockOptimize.total}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(
                subscription.quotas.blockOptimize.used,
                subscription.quotas.blockOptimize.total
              )}
              className="h-2"
            />
          </div>

          {/* 动机信生成 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("motivationLetter")}
              </span>
              <span className="font-medium">
                {subscription.quotas.motivationLetter.used} /{" "}
                {subscription.quotas.motivationLetter.total}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(
                subscription.quotas.motivationLetter.used,
                subscription.quotas.motivationLetter.total
              )}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("chatTokens")}</span>
              <span className="font-medium">
                {numberFormatter.format(subscription.chatTokenLimit)}
              </span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          {subscription.isActive ? (
            <Button
              variant="outline"
              size="default"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              onClick={handleRenew}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("renewPlan")}
            </Button>
          ) : (
            <Button
              variant="default"
              size="default"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              onClick={handleUpgrade}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              {t("buyPlan")}
            </Button>
          )}

          {subscription.plan === "LITE" && (
            <Button
              variant="default"
              size="default"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              onClick={handleUpgrade}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              {t("upgradeToPro")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
