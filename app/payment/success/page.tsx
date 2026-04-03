import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { PaymentSuccessActions } from "@/components/client-components/payment-success-actions"
import { LandingPageLayout } from "@/components/ui/landing-page-layout"
import { getTranslations } from "next-intl/server"

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const sessionId = params.session_id
  return (
    <LandingPageLayout>
      {/* Success Content */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-green-600">
                {t("paymentSuccess.title")}
              </CardTitle>
              <CardDescription className="text-lg">
                {t("paymentSuccess.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  {t("paymentSuccess.orderNumber")}: {sessionId || "N/A"}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t("paymentSuccess.nextStepsTitle")}
                </h3>
                <div className="grid gap-3 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{t("paymentSuccess.nextStepUseTokens")}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{t("paymentSuccess.nextStepViewBalance")}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{t("paymentSuccess.nextStepBuyMore")}</span>
                  </div>
                </div>
              </div>

              <PaymentSuccessActions
                sessionId={sessionId}
                checkingLabel={t("paymentSuccess.checkingStatus")}
                delayedLabel={t("paymentSuccess.processingDelay")}
                dashboardLabel={t("paymentSuccess.goToDashboard")}
                homeLabel={t("paymentSuccess.backToHome")}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </LandingPageLayout>
  )
}
