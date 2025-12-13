'use client'

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="text-sm text-muted-foreground">
            {t('landingPage.copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
} 