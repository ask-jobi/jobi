"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type PaymentSuccessActionsProps = {
  sessionId?: string
  transactionId?: string
  checkingLabel: string
  delayedLabel: string
  dashboardLabel: string
  homeLabel: string
}

const POLL_INTERVAL_MS = 2_000
const MAX_POLL_ATTEMPTS = 15

export function PaymentSuccessActions({
  sessionId,
  transactionId,
  checkingLabel,
  delayedLabel,
  dashboardLabel,
  homeLabel
}: PaymentSuccessActionsProps) {
  const router = useRouter()
  const checkoutId = transactionId ?? sessionId
  const statusUrl = transactionId
    ? `/api/paddle/checkout-status?transaction_id=${encodeURIComponent(transactionId)}`
    : sessionId
      ? `/api/stripe/checkout-status?session_id=${encodeURIComponent(sessionId)}`
      : null
  const [isReady, setIsReady] = useState(!checkoutId)
  const [isDelayed, setIsDelayed] = useState(false)
  const attemptCountRef = useRef(0)

  useEffect(() => {
    if (!statusUrl) {
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const checkStatus = async () => {
      try {
        const response = await fetch(statusUrl, { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Failed to fetch checkout status")
        }

        const payload = (await response.json()) as { processed?: boolean }

        if (cancelled) {
          return
        }

        if (payload.processed) {
          setIsReady(true)
          setIsDelayed(false)
          router.refresh()
          return
        }
      } catch (error) {
        console.error("Error checking checkout status:", error)
      }

      if (cancelled) {
        return
      }

      attemptCountRef.current += 1

      if (attemptCountRef.current >= MAX_POLL_ATTEMPTS) {
        setIsDelayed(true)
        setIsReady(true)
        return
      }

      timer = setTimeout(() => {
        void checkStatus()
      }, POLL_INTERVAL_MS)
    }

    void checkStatus()

    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [router, statusUrl])

  return (
    <div className="flex flex-col gap-4 pt-4">
      {isDelayed ? (
        <p className="text-sm text-muted-foreground">{delayedLabel}</p>
      ) : null}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        data-testid="payment-success-actions"
      >
        <Button
          className="min-h-10 w-full min-w-0 shrink whitespace-normal px-4 text-center leading-snug"
          disabled={!isReady}
          onClick={() => router.push("/dashboard")}
          size="lg"
        >
          {isReady ? dashboardLabel : checkingLabel}
        </Button>
        <Link href="/" className="min-w-0">
          <Button
            className="min-h-10 w-full min-w-0 shrink whitespace-normal px-4 text-center leading-snug"
            variant="outline"
            size="lg"
          >
            {homeLabel}
          </Button>
        </Link>
      </div>
    </div>
  )
}
