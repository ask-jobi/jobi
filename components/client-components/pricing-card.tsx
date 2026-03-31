"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Loader2 } from "lucide-react"
import { PaymentError } from "./payment-error"
import { LoginRequiredModal } from "./login-required-modal"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

interface PricingCardProps {
  title: string
  price: string
  tokenAmount: string
  description: string
  features: readonly string[]
  priceId?: string
  plan: string
  isPopular?: boolean
  buttonText: string
  buttonVariant?: "default" | "outline"
}

export function PricingCard({
  title,
  price,
  tokenAmount,
  description,
  features,
  priceId,
  plan,
  isPopular = false,
  buttonText,
  buttonVariant = "outline"
}: PricingCardProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // 处理国际化文本
  const getTranslatedText = (text: string) => {
    // 如果text是国际化键值，则翻译；否则直接返回
    if (text.startsWith("pricing.")) {
      try {
        return t(text as keyof typeof t)
      } catch {
        // 如果翻译键不存在，返回原文本
        return text
      }
    }
    return text
  }

  const getTranslatedFeatures = () => {
    return features.map((feature) => getTranslatedText(feature))
  }

  const handleButtonClick = async () => {
    // 首先检查登录状态
    if (!user) {
      // 未登录，跳转到登录页面并传递回调URL
      const callbackUrl = encodeURIComponent("/pricing")
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
      return
    }

    // 已登录之后的处理，处理套餐选择
    if (!priceId) {
      // 免费套餐：处理免费通行证的逻辑
      try {
        setIsLoading(true)

        // 调用API创建免费通行证（API会自动检查用户历史）
        const response = await fetch("/api/access-passes/create-free", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        })

        const result = await response.json()

        if (response.ok) {
          if (result.message === "Free pass created successfully") {
            // 新创建了免费通行证，跳转到仪表板
            router.push("/dashboard")
          } else if (result.message === "User already has an active pass") {
            // 用户已有有效通行证，直接跳转到仪表板
            router.push("/dashboard")
          }
        } else {
          // 创建失败，显示错误信息
          if (result.code === "ALREADY_TRIED") {
            setError(t("pricing.freePass.alreadyTried"))
          } else {
            setError(result.error || t("pricing.freePass.createFailed"))
          }
        }
      } catch (error) {
        console.error("Error creating free access pass:", error)
        setError(t("pricing.freePass.createError"))
      } finally {
        setIsLoading(false)
      }
      return
    }

    // 付费套餐，创建支付会话
    await handlePayment()
  }

  const handlePayment = async () => {
    if (!priceId) return

    setIsLoading(true)
    setError(undefined)

    try {
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          priceId,
          plan
        })
      })

      const { url, error } = await response.json()

      if (response.status === 401) {
        // 如果后端返回401，跳转到登录页面
        const callbackUrl = encodeURIComponent("/pricing")
        router.push(`/auth/login?callbackUrl=${callbackUrl}`)
        return
      }

      if (error) {
        console.error("Payment error:", error)
        setError(error || t("pricing.paymentError"))
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Payment error:", error)
      setError(t("pricing.paymentError"))
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (authLoading) return t("pricing.loading")
    if (!user) return t("pricing.loginToPurchase")
    if (!priceId) return getTranslatedText(buttonText) // 免费套餐
    return getTranslatedText(buttonText)
  }

  const buttonContent = (
    <>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {getButtonText()}
    </>
  )

  return (
    <>
      <PaymentError error={error} onClose={() => setError(undefined)} />
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        planName={getTranslatedText(title)}
      />
      <Card
        className={`border-0 shadow-lg relative ${isPopular ? "border-2 border-primary" : ""}`}
      >
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-4 py-1">
              <Crown className="w-4 h-4 mr-1" />
              {t("pricing.mostPopular")}
            </Badge>
          </div>
        )}
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">{getTranslatedText(title)}</CardTitle>
          <div className="text-4xl font-bold text-primary mb-2">
            {getTranslatedText(price)}
          </div>
          <div className="text-sm font-semibold text-foreground/80 uppercase tracking-[0.16em]">
            {getTranslatedText(tokenAmount)}
          </div>
          <CardDescription>{getTranslatedText(description)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.length > 0 && (
            <div className="space-y-2">
              {getTranslatedFeatures().map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          )}
          <Button
            className="w-full mt-4"
            variant={buttonVariant}
            onClick={handleButtonClick}
            disabled={isLoading || authLoading}
          >
            {buttonContent}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
