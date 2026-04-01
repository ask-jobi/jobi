import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { LandingPageLayout } from "@/components/ui/landing-page-layout"

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
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
                支付成功！
              </CardTitle>
              <CardDescription className="text-lg">
                您购买的 Token 额度已到账，可以继续使用了
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  订单号: {sessionId || "N/A"}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">接下来您可以：</h3>
                <div className="grid gap-3 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>继续在聊天和改写流程中消耗 Token</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>查看当前 Token 余额和使用情况</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>继续购买新的 Token 套餐来累加余额</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full" size="lg">
                    进入控制台
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full" size="lg">
                    返回首页
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </LandingPageLayout>
  )
}
