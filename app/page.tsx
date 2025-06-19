import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Sparkles, 
  Zap, 
  Shield, 
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
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
            <Link href="/pricing">
              <Button variant="ghost">定价</Button>
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
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
            AI 驱动的简历优化
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            打造完美简历
            <br />
            <span className="text-primary">获得理想工作</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            使用先进的 AI 技术，智能分析您的简历，提供个性化建议，
            让您的简历在众多求职者中脱颖而出。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
                开始免费试用
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            为什么选择 Jobi？
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我们提供最先进的 AI 技术，帮助您创建专业、有竞争力的简历
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>AI 智能分析</CardTitle>
              <CardDescription>
                先进的 AI 算法深度分析您的简历，识别改进空间并提供具体建议
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>个性化优化</CardTitle>
              <CardDescription>
                根据目标职位和行业特点，提供量身定制的简历优化建议
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>隐私保护</CardTitle>
              <CardDescription>
                您的个人信息和简历内容完全加密，确保数据安全
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-700 mb-2">10,000+</div>
              <div className="text-muted-foreground">成功案例</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-muted-foreground">面试通过率</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500 mb-2">50+</div>
              <div className="text-muted-foreground">行业模板</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-muted-foreground">AI 支持</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            准备好提升您的职业发展了吗？
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            加入数千名成功求职者的行列，让 AI 帮助您打造完美简历
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
              立即开始
              <ArrowRight className="w-5 h-5 ml-2" />
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