"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

interface QuotaDisplayProps {
  subscription: {
    plan: "FREE" | "LITE" | "PRO" | null
    planName: string
    expiryDate?: string | null
    isActive?: boolean
    chatTokenLimit: number
    chatTokenUsed?: number
    quotas?: {
      blockOptimize: { used: number; total: number }
      motivationLetter: { used: number; total: number }
    }
  }
}

export function QuotaDisplay({ subscription }: QuotaDisplayProps) {
  const t = useTranslations()
  const router = useRouter()
  const numberFormatter = new Intl.NumberFormat("en-US")

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

  const tokenTotal = subscription.chatTokenLimit ?? 0
  const tokenUsed = subscription.chatTokenUsed ?? 0
  const tokenRemaining = Math.max(tokenTotal - tokenUsed, 0)

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

      <CardContent className="pt-0 space-y-4">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/60 p-4">
            <dt className="text-sm text-muted-foreground">{t("tokenTotal")}</dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums">
              {numberFormatter.format(tokenTotal)}
            </dd>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 p-4">
            <dt className="text-sm text-muted-foreground">{t("tokenUsed")}</dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums">
              {numberFormatter.format(tokenUsed)}
            </dd>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 p-4">
            <dt className="text-sm text-muted-foreground">
              {t("tokenRemaining")}
            </dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums">
              {numberFormatter.format(tokenRemaining)}
            </dd>
          </div>
        </dl>
        <Button className="w-full sm:w-auto" onClick={() => router.push("/pricing")}>
          {t("pricingPage")}
        </Button>
      </CardContent>
    </Card>
  )
}
