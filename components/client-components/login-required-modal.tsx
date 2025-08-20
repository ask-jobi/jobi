'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Lock, UserPlus, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  planName: string
}

export function LoginRequiredModal({ isOpen, onClose, planName }: LoginRequiredModalProps) {
  const t = useTranslations();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">{t('pricing.loginRequired.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('pricing.loginRequired.description', { planName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {t('pricing.loginRequired.benefitsTitle')}
            <ul className="mt-2 space-y-1 text-left">
              <li>• {t('pricing.loginRequired.benefits.0')}</li>
              <li>• {t('pricing.loginRequired.benefits.1')}</li>
              <li>• {t('pricing.loginRequired.benefits.2')}</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full" onClick={onClose}>
                <LogIn className="w-4 h-4 mr-2" />
                {t('pricing.loginRequired.loginButton')}
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="flex-1">
              <Button variant="outline" className="w-full" onClick={onClose}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t('pricing.loginRequired.signUpButton')}
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('pricing.loginRequired.laterButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
