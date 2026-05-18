"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { PricingCard } from "@/components/client-components/pricing-card"
import { PRICING_CONFIG } from "@/lib/payment/stripe-config"
import { PaymentCancelledAlert } from "@/components/client-components/payment-cancelled-alert"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { LandingPageLayout } from "@/components/ui/landing-page-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export default function PricingPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const [showCancelledAlert, setShowCancelledAlert] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const cancelled = searchParams.get("cancelled")
    if (cancelled === "true") {
      setShowCancelledAlert(true)
    }
  }, [searchParams])

  const handleCloseAlert = () => {
    setShowCancelledAlert(false)
    // 清除URL参数
    const url = new URL(window.location.href)
    url.searchParams.delete("cancelled")
    window.history.replaceState({}, "", url.toString())
  }

  const handleCTAClick = () => {
    // 首先检查登录状态
    if (!user) {
      // 未登录用户跳转到登录页面并传递回调URL
      const callbackUrl = encodeURIComponent("/pricing")
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
      return
    }

    // 已登录用户跳转到仪表板
    router.push("/dashboard")
  }

  return (
    <LandingPageLayout>
      <PaymentCancelledAlert
        isVisible={showCancelledAlert}
        onClose={handleCloseAlert}
      />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            {t("pricing.choosePlan")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t("pricing.heroTitle")}
            <br />
            <span className="text-primary">
              {t("pricing.heroTitleHighlight")}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("pricing.heroDescription")}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <PricingCard {...PRICING_CONFIG.FREE} />

          {/* Pro Plan */}
          <PricingCard {...PRICING_CONFIG.PRO} />

          {/* Lite Plan */}
          <PricingCard {...PRICING_CONFIG.LITE} />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            {t("pricing.faqTitle")}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("pricing.faqCancelSubscription")}
              </h3>
              <p className="text-muted-foreground">
                {t("pricing.faqCancelSubscriptionAnswer")}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("pricing.faqPaymentMethods")}
              </h3>
              <p className="text-muted-foreground">
                {t("pricing.faqPaymentMethodsAnswer")}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("pricing.faqRefundPolicy")}
              </h3>
              <p className="text-muted-foreground">
                {t("pricing.faqRefundPolicyAnswer")}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("pricing.faqEnterpriseCustomization")}
              </h3>
              <p className="text-muted-foreground">
                {t("pricing.faqEnterpriseCustomizationAnswer")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("pricing.ctaTitle")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("pricing.ctaDescription")}
          </p>
          <Button
            size="lg"
            className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg"
            onClick={handleCTAClick}
          >
            {user
              ? t("pricing.ctaButtonLoggedIn")
              : t("pricing.ctaButtonLoggedOut")}
          </Button>
        </div>
      </section>
    </LandingPageLayout>
  )
}
