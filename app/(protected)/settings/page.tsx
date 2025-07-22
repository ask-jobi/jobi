"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useTransition} from "react";
import {setUserLocale} from "@/lib/i18n/services";
import {Locale} from "@/lib/i18n/config";
import {cn} from "@/lib/utils";

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
      <h1 className="text-2xl font-bold mb-4">{t('settings')}</h1>
      <div className="max-w-xs">
        <label className="block mb-2 text-sm font-medium">{t('language')}</label>
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
      {/* 这里可以添加更多设置内容 */}
    </div>
  );
}
