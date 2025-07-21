import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {Toaster} from "@/components/ui/sonner";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {routing} from "@/lib/i18n/routing";
import {notFound} from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jobi - AI 驱动的简历优化平台",
  description: "使用先进的 AI 技术，智能分析您的简历，提供个性化建议，让您的简历在众多求职者中脱颖而出。",
  keywords: ["简历优化", "AI 简历", "求职", "职业发展", "简历模板"],
  authors: [{ name: "Jobi Team" }],
  openGraph: {
    title: "Jobi - AI 驱动的简历优化平台",
    description: "使用先进的 AI 技术，智能分析您的简历，提供个性化建议，让您的简历在众多求职者中脱颖而出。",
    type: "website",
  },
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {

  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
