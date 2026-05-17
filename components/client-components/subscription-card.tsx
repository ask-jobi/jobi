"use client"

import { useEffect, useState } from "react"
import { QuotaDisplay } from "./quota-display"
import { useTranslations } from "next-intl"

interface SubscriptionData {
  plan: "FREE" | "LITE" | "PRO" | null
  chatTokenLimit: number
  chatTokenUsed: number
  chatTokenRemaining: number
}

export function SubscriptionCard() {
  const t = useTranslations()
  const [tokenBalance, setTokenBalance] = useState<SubscriptionData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        const response = await fetch("/api/user/token-balance")
        if (!response.ok) {
          throw new Error("Failed to fetch token balance")
        }
        const data = await response.json()
        setTokenBalance(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchTokenBalance()
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
          <p>{t("loadingTokenBalanceError")}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!tokenBalance) {
    return (
      <div className="w-full">
        <div className="text-center text-muted-foreground">
          <p>{t("failedToLoadTokenBalance")}</p>
        </div>
      </div>
    )
  }

  return <QuotaDisplay tokenBalance={tokenBalance} />
}
