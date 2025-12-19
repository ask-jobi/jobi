'use client'

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  ArrowRight,
  Mail,
  Files,
  ShieldX,
  Info
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { LandingPageLayout } from "@/components/ui/landing-page-layout";
import {useTranslations} from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export default function LandingPage() {
  const t = useTranslations();
  const { user } = useAuth();
  
  // 滚动动画状态 - Problem cards
  const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false]);
  const cardRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  // 滚动动画状态 - Feature items
  const [visibleFeatures, setVisibleFeatures] = useState<boolean[]>([false, false, false]);
  const featureRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  useEffect(() => {
    // Problem cards observer
    const cardObservers = cardRefs.map((ref, index) => {
      if (!ref.current) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                setVisibleCards((prev) => {
                  const newState = [...prev];
                  newState[index] = true;
                  return newState;
                });
              }, index * 150);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -100px 0px'
        }
      );

      observer.observe(ref.current);
      return observer;
    });

    // Feature items observer
    const featureObservers = featureRefs.map((ref, index) => {
      if (!ref.current) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                setVisibleFeatures((prev) => {
                  const newState = [...prev];
                  newState[index] = true;
                  return newState;
                });
              }, index * 150);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -100px 0px'
        }
      );

      observer.observe(ref.current);
      return observer;
    });

    return () => {
      cardObservers.forEach((observer) => observer?.disconnect());
      featureObservers.forEach((observer) => observer?.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 mt-8 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
            {t('landingPage.hero.slogan')}
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landingPage.hero.valueProposition')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={user ? "/dashboard" : "/auth/sign-up"}>
              <Button size="lg" className="text-lg px-8 relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-md overflow-hidden group border-0">
                {/* 持续的背景白色光晕 */}
                <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-60 animate-pulse-slow blur-sm"></span>
                
                {/* 白色光晕扫过效果 */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></span>
                
                {/* 内容 */}
                <span className="relative z-10 flex items-center">
                  {t('landingPage.hero.startFreeTrial')}
                  <ArrowRight className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
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

      {/* Problem Section */}
      <section id="problem" className="relative py-24 md:py-32 bg-gradient-to-b from-background via-foreground/[0.02] to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              {t('landingPage.problem.title')}
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {t('landingPage.problem.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Problem 1 */}
            <Card 
              ref={cardRefs[0]}
              className={`relative border border-border/50 shadow-lg transition-all duration-700 ease-out ${
                visibleCards[0] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <CardHeader className="pb-6">
                <div className="w-12 h-12 flex items-center justify-center mb-6 mx-auto">
                  <Mail className="w-6 h-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-center mb-4 font-semibold">
                  {t('landingPage.problem.problem1')}
                </CardTitle>
                <CardDescription className="text-center text-base leading-relaxed">
                  {t('landingPage.problem.problem1Desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Problem 2 */}
            <Card 
              ref={cardRefs[1]}
              className={`relative border border-border/50 shadow-lg transition-all duration-700 ease-out ${
                visibleCards[1] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <CardHeader className="pb-6">
                <div className="w-12 h-12 flex items-center justify-center mb-6 mx-auto">
                  <Files className="w-6 h-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-center mb-4 font-semibold">
                  {t('landingPage.problem.problem2')}
                </CardTitle>
                <CardDescription className="text-center text-base leading-relaxed">
                  {t('landingPage.problem.problem2Desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Problem 3 */}
            <Card 
              ref={cardRefs[2]}
              className={`relative border border-border/50 shadow-lg transition-all duration-700 ease-out ${
                visibleCards[2] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <CardHeader className="pb-6">
                <div className="w-12 h-12 flex items-center justify-center mb-6 mx-auto">
                  <ShieldX className="w-6 h-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-center mb-4 font-semibold">
                  <span className="inline-flex items-center flex-wrap justify-center gap-1.5">
                    被
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="relative inline-block cursor-help">
                            ATS
                            <Info className="absolute top-1 -right-2 w-2 h-2 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3">
                          <p className="text-sm leading-relaxed">
                            {t('landingPage.problem.atsExplanation')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    系统过滤
                  </span>
                </CardTitle>
                <CardDescription className="text-center text-base leading-relaxed">
                  {t('landingPage.problem.problem3Desc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 md:py-32 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight leading-tight">
              {t('landingPage.features.title')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('landingPage.features.description')}
            </p>
          </div>

          <div className="max-w-7xl mx-auto space-y-20">
            {/* Feature 1 */}
            <div 
              ref={featureRefs[0]}
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-700 ease-out ${
                visibleFeatures[0] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-foreground/20">01</span>
                  <h3 className="text-3xl font-bold">{t('landingPage.features.feature1')}</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {t('landingPage.features.feature1Desc')}
                </p>
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50">
                <Image
                  src="/landing-page/一键导入.png"
                  alt={t('landingPage.features.feature1')}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div 
              ref={featureRefs[1]}
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-700 ease-out ${
                visibleFeatures[1] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`}
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 md:order-1 order-2">
                <Image
                  src="/landing-page/岗位定制.png"
                  alt={t('landingPage.features.feature2')}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="space-y-6 md:order-2 order-1">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-foreground/20">02</span>
                  <h3 className="text-3xl font-bold">{t('landingPage.features.feature2')}</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {t('landingPage.features.feature2Desc')}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div 
              ref={featureRefs[2]}
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-700 ease-out ${
                visibleFeatures[2] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-foreground/20">03</span>
                  <h3 className="text-3xl font-bold">{t('landingPage.features.feature3')}</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {t('landingPage.features.feature3Desc')}
                </p>
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50">
                <Image
                  src="/landing-page/真实表达.png"
                  alt={t('landingPage.features.feature3')}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
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
            <Button size="lg" className="text-lg px-8 relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-md overflow-hidden group border-0">
              {/* 持续的背景白色光晕 */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-60 animate-pulse-slow blur-sm"></span>
              
              {/* 白色光晕扫过效果 */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></span>
              
              {/* 内容 */}
              <span className="relative z-10 flex items-center">
                {t('landingPage.getStarted')}
                <ArrowRight className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
          </Link>
        </div>
      </section>
    </LandingPageLayout>
  );
}
