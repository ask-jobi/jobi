'use client'

import { ReactNode } from 'react';
import { Header } from './header';
import { Footer } from './footer';

interface LandingPageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function LandingPageLayout({ children, className = "" }: LandingPageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-all duration-200 ${className}`}>
      <Header />
      <main className="transition-opacity duration-200">
        {children}
      </main>
      <Footer />
    </div>
  );
} 