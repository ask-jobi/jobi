"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { Logo } from "@/components/ui/logo"
import { useTranslations } from "next-intl"
import { Skeleton } from "@/components/ui/skeleton"
import { memo } from "react"
import { LanguageSwitcher } from "../client-components/language-switcher"

interface HeaderProps {
  showLanguageSwitcher?: boolean
  showPricingLink?: boolean
  showAuthButtons?: boolean
  className?: string
}

// 使用 memo 来避免不必要的重新渲染
export const Header = memo(function Header({
  showLanguageSwitcher = true,
  showPricingLink = true,
  showAuthButtons = true,
  className = ""
}: HeaderProps) {
  const t = useTranslations()
  const { user, loading } = useAuth()

  return (
    <header
      className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200 ${className}`}
    >
      <div className="container mx-auto px-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Logo size="lg" href="/" />
        </div>
        <div className="flex items-center space-x-4">
          {showLanguageSwitcher && <LanguageSwitcher />}
          {showPricingLink && (
            <Link href="/pricing">
              <Button variant="ghost">{t("pricingPage")}</Button>
            </Link>
          )}
          {showAuthButtons && (
            <>
              {loading ? (
                // 显示骨架屏而不是隐藏按钮
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-10 w-20" />
                </div>
              ) : (
                <>
                  {user ? (
                    <Link href="/dashboard">
                      <Button>{t("dashboard")}</Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/login">
                        <Button variant="ghost">{t("login")}</Button>
                      </Link>
                      <Link href="/auth/sign-up">
                        <Button>{t("signUp")}</Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
})
