'use client'

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-1"
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'zh' ? 'EN' : '中文'}</span>
    </Button>
  );
} 