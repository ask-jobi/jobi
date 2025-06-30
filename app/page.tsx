'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Sparkles, 
  Zap, 
  Shield, 
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/hooks/use-auth";
import Image from "next/image";

export default function LandingPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/jobi_logo.svg"
              alt="Jobi Logo"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link href="/pricing">
              <Button variant="ghost">{t('pricing')}</Button>
            </Link>
            {!loading && (
              <>
                {user ? (
                  <Link href="/dashboard">
                    <Button>{t('dashboard')}</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost">{t('login')}</Button>
                    </Link>
                    <Link href="/auth/sign-up">
                      <Button>{t('signUp')}</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
            {t('aiDriven')}
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('heroTitle')}
            <br />
            <span className="text-primary">{t('heroSubtitle')}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('heroDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
                {t('startFreeTrial')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8">
                {t('learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('whyChooseJobi')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('featuresDescription')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>{t('aiAnalysis')}</CardTitle>
              <CardDescription>
                {t('aiAnalysisDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>{t('personalizedOptimization')}</CardTitle>
              <CardDescription>
                {t('personalizedOptimizationDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>{t('privacyProtection')}</CardTitle>
              <CardDescription>
                {t('privacyProtectionDesc')}
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
              <div className="text-muted-foreground">{t('successCases')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-muted-foreground">{t('interviewRate')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500 mb-2">50+</div>
              <div className="text-muted-foreground">{t('templates')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-muted-foreground">{t('aiSupport')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('readyToStart')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('ctaDescription')}
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
              {t('getStarted')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                  src="/jobi_logo.png"
                  alt="Jobi Logo"
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold">Jobi</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('copyright')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 