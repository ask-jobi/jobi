"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useLocale } from "next-intl"
import { useTransition } from "react"
import { setUserLocale } from "@/lib/i18n/services"
import { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export function LanguageSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const toggleLanguage = () => {
    startTransition(() => {
      setUserLocale((locale === "zh" ? "en" : "zh") as Locale)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "flex items-center space-x-1",
        isPending && "pointer-events-none opacity-60"
      )}
    >
      <Globe className="w-4 h-4" />
      <span>{locale === "zh" ? "EN" : "中文"}</span>
    </Button>
  )
}
