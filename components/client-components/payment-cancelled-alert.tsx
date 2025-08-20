'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PaymentCancelledAlertProps {
  isVisible: boolean
  onClose: () => void
}

export function PaymentCancelledAlert({ isVisible, onClose }: PaymentCancelledAlertProps) {
  const t = useTranslations();
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // 5秒后自动隐藏
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 300) // 等待动画完成
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <Card className={`border-orange-200 bg-orange-50 transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-[-100%] opacity-0'
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-800 text-lg">{t('pricing.paymentCancelled.title')}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAnimating(false)
                setTimeout(onClose, 300)
              }}
              className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-orange-700">
            {t('pricing.paymentCancelled.description')}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
} 