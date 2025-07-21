'use client'

import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/lib/i18n/navigation";
import {useParams} from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  const toggleLanguage = () => {
    router.replace(
      // @ts-expect-error -- TypeScript will validate that only known `params`
      {pathname, params},
      {locale: locale === 'zh' ? 'en' : 'zh'}
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-1"
    >
      <Globe className="w-4 h-4" />
      <span>{locale === 'zh' ? 'EN' : '中文'}</span>
    </Button>
  );
}
