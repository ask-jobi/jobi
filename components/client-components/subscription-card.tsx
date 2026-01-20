"use client"

import { useEffect, useState } from "react"
import { QuotaDisplay } from "./quota-display"
import { useTranslations } from "next-intl"

interface SubscriptionData {
  plan: "FREE" | "LITE" | "PRO" | null
  planName: string
  expiryDate: string | null
  isActive: boolean
  quotas: {
    fullOptimize: { used: number; total: number }
    blockOptimize: { used: number; total: number }
    motivationLetter: { used: number; total: number }
  }
}

export function SubscriptionCard() {
  const t = useTranslations()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/user/subscription")
        if (!response.ok) {
          throw new Error("Failed to fetch subscription data")
        }
        const data = await response.json()
        setSubscription(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <div className="w-full animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-center text-muted-foreground">
          <p>{t("loadingSubscriptionError")}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="w-full">
        <div className="text-center text-muted-foreground">
          <p>{t("failedToLoadSubscription")}</p>
        </div>
      </div>
    )
  }

  return <QuotaDisplay subscription={subscription} />
}
