"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useTransition} from "react";
import {setUserLocale} from "@/lib/i18n/services";
import {Locale} from "@/lib/i18n/config";
import {cn} from "@/lib/utils";
import { SubscriptionCard } from "@/components/client-components/subscription-card";

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const locale = useLocale()

  const switchLocale = (locale: string) => {
    startTransition(() => {
      setUserLocale(locale as Locale);
    })
  }

  return (
    <div className="h-[calc(100vh-3rem)] p-6 overflow-y-auto">
      <div className="flex gap-12">
        {/* 左侧内容区域 */}
        <div className="flex-1 max-w-md">
          <h1 className="text-2xl font-bold mb-8">{t('settings')}</h1>
          
          <div className="space-y-8">
            {/* 用量信息卡片 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('subscriptionAndUsage')}</h2>
              <SubscriptionCard />
            </div>

            {/* 语言设置 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('language')}</h2>
              <div className="max-w-xs">
                <Select value={locale} onValueChange={switchLocale}>
                  <SelectTrigger className={cn(
                    "w-full",
                    isPending && 'pointer-events-none opacity-60'
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh" icon={Globe}>{t('chinese')}</SelectItem>
                    <SelectItem value="en" icon={Globe}>{t('english')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧空白区域 */}
        <div className="flex-1"></div>
      </div>
    </div>
  );
}
