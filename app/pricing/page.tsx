import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check,
  Star,
  Crown,
  FileText
} from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Jobi</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost">首页</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>免费注册</Button>
            </Link>
          </div>
        </div>
      </header>

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
            无论您是个人求职者还是企业用户，我们都有适合您的套餐选择
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="border-0 shadow-lg relative">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">免费版</CardTitle>
              <div className="text-4xl font-bold text-primary mb-2">¥0</div>
              <CardDescription>适合个人用户试用</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">每月 3 次简历优化</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">基础 AI 分析</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">5 个简历模板</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">邮件支持</span>
                </div>
              </div>
              <Link href="/auth/sign-up">
                <Button className="w-full mt-4" variant="outline">
                  开始免费试用
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-0 shadow-lg relative border-2 border-primary">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                <Crown className="w-4 h-4 mr-1" />
                最受欢迎
              </Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">专业版</CardTitle>
              <div className="text-4xl font-bold text-primary mb-2">¥99</div>
              <CardDescription>每月，适合求职者</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">每月 50 次简历优化</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">高级 AI 分析</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">50+ 个简历模板</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">个性化建议</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">优先客服支持</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">导出 PDF 格式</span>
                </div>
              </div>
              <Link href="/auth/sign-up">
                <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
                  选择专业版
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-0 shadow-lg relative">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">企业版</CardTitle>
              <div className="text-4xl font-bold text-primary mb-2">¥299</div>
              <CardDescription>每月，适合企业</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">无限次简历优化</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">企业级 AI 分析</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">所有简历模板</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">团队协作功能</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">专属客户经理</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">API 接口</span>
                </div>
              </div>
              <Link href="/auth/sign-up">
                <Button className="w-full mt-4" variant="outline">
                  联系销售
                </Button>
              </Link>
            </CardContent>
          </Card>
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

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Jobi</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Jobi. 保留所有权利。
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 