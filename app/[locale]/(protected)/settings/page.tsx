"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {usePathname, useRouter} from "@/lib/i18n/navigation";
import { useParams } from "next/navigation";

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale()
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  const switchLocale = (locale: string) => {
    router.replace(
      // @ts-expect-error -- TypeScript will validate that only known `params`
      {pathname, params},
      {locale}
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">{t('settings')}</h1>
      <div className="max-w-xs">
        <label className="block mb-2 text-sm font-medium">{t('language')}</label>
        <Select value={locale} onValueChange={switchLocale}>
          <SelectTrigger className="w-full">
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
