'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Zap,
  Shield,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { LandingPageLayout } from "@/components/ui/landing-page-layout";
import {useTranslations} from 'next-intl';

export default function LandingPage() {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('landingPage.hero.slogan')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('landingPage.hero.valueProposition')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={user ? "/dashboard" : "/auth/sign-up"}>
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
                {t('landingPage.hero.startFreeTrial')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8">
                {t('landingPage.hero.learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landingPage.features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landingPage.features.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>{t('landingPage.features.feature1')}</CardTitle>
              <CardDescription>
                {t('landingPage.features.feature1Desc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>{t('landingPage.features.feature2')}</CardTitle>
              <CardDescription>
                {t('landingPage.features.feature2Desc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>{t('landingPage.features.feature3')}</CardTitle>
              <CardDescription>
                {t('landingPage.features.feature3Desc')}
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
              <div className="text-muted-foreground">{t('landingPage.successCases')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-muted-foreground">{t('landingPage.interviewRate')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500 mb-2">50+</div>
              <div className="text-muted-foreground">{t('landingPage.templates')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-muted-foreground">{t('landingPage.aiSupport')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('landingPage.readyToStart')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('landingPage.ctaDescription')}
          </p>
          <Link href={user ? "/dashboard" : "/auth/sign-up"}>
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg">
              {t('landingPage.getStarted')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </LandingPageLayout>
  );
}
