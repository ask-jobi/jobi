'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star
} from "lucide-react";
import { PricingCard } from "@/components/client-components/pricing-card";
import { PRICING_CONFIG } from "@/lib/payment/stripe-config";
import { PaymentCancelledAlert } from "@/components/client-components/payment-cancelled-alert";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingPageLayout } from "@/components/ui/landing-page-layout";

// TODO: 登录状态下仍然显示免费注册按钮
// TODO: 支付成功后，跳转到成功页面，并显示支付成功提示
// TODO: 支付失败后，跳转到失败页面，并显示支付失败提示
// TODO: 开始免费使用在登录下也会提示要登录
// TODO: 联系销售也要登录？
// TODO: 没有国际化
export default function PricingPage() {
  const searchParams = useSearchParams()
  const [showCancelledAlert, setShowCancelledAlert] = useState(false)

  useEffect(() => {
    const cancelled = searchParams.get('cancelled')
    if (cancelled === 'true') {
      setShowCancelledAlert(true)
    }
  }, [searchParams])

  const handleCloseAlert = () => {
    setShowCancelledAlert(false)
    // 清除URL参数
    const url = new URL(window.location.href)
    url.searchParams.delete('cancelled')
    window.history.replaceState({}, '', url.toString())
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
            选择最适合您的套餐
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            简单透明的
            <br />
            <span className="text-primary">定价方案</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            无论您是个人求职者还是企业用户，我们都有适合您的套餐选择。
            <br />
            我们承诺不自动续费，一次付费，享受完整功能。
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
            常见问题
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">可以随时取消订阅吗？</h3>
              <p className="text-muted-foreground">是的，您可以随时取消订阅，取消后仍可使用到当前计费周期结束。</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">支持哪些支付方式？</h3>
              <p className="text-muted-foreground">我们支持支付宝、微信支付、银行卡等多种支付方式。</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">有退款政策吗？</h3>
              <p className="text-muted-foreground">我们提供7天无理由退款保证，如果您不满意我们的服务。</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">企业版可以定制吗？</h3>
              <p className="text-muted-foreground">是的，企业版支持定制化需求，请联系我们的销售团队。</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            选择最适合您的套餐，开始打造完美简历
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
              立即开始
            </Button>
          </Link>
        </div>
      </section>
    </LandingPageLayout>
  );
} 