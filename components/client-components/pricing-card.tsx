'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Loader2 } from 'lucide-react'
import { PaymentError } from './payment-error'
import { LoginRequiredModal } from './login-required-modal'
import { useAuth } from '@/lib/hooks/use-auth'

interface PricingCardProps {
  title: string
  price: string
  description: string
  features: readonly string[]
  priceId?: string
  mode?: 'subscription' | 'payment'
  isPopular?: boolean
  buttonText: string
  buttonVariant?: 'default' | 'outline'
  buttonHref?: string
}

export function PricingCard({
  title,
  price,
  description,
  features,
  priceId,
  mode = 'subscription',
  isPopular = false,
  buttonText,
  buttonVariant = 'outline',
  buttonHref
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, loading: authLoading } = useAuth()

  const handlePayment = async () => {
    if (!priceId) return

    // 前端检查用户是否已登录（提供更好的用户体验）
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          mode,
        }),
      })

      const { url, error } = await response.json()

      if (response.status === 401) {
        // 如果后端返回401，说明用户未登录，显示登录提示
        setShowLoginModal(true)
        return
      }

      if (error) {
        console.error('Payment error:', error)
        setError(error || '支付过程中出现错误，请重试')
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('支付过程中出现错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (!priceId) return buttonText // 免费套餐
    if (!user) return '登录后购买'
    return buttonText
  }

  const getButtonHref = () => {
    if (!priceId) return buttonHref || '/auth/sign-up' // 免费套餐
    // 对于付费套餐，如果用户未登录，不返回href，让按钮触发onClick事件
    if (!user) return null
    return buttonHref
  }

  // 调试信息
  console.log(`PricingCard ${title}:`, {
    user: !!user,
    loading: authLoading,
    isFree: !priceId,
    priceId,
    buttonText: getButtonText(),
    buttonHref: getButtonHref()
  })

  const buttonContent = (
    <>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {getButtonText()}
    </>
  )

  return (
    <>
      <PaymentError error={error} onClose={() => setError(undefined)} />
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        planName={title}
      />
      <Card className={`border-0 shadow-lg relative ${isPopular ? 'border-2 border-primary' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <Crown className="w-4 h-4 mr-1" />
            最受欢迎
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <div className="text-4xl font-bold text-primary mb-2">{price}</div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-3" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        {!priceId || (getButtonHref() && user) ? (
          <Link href={getButtonHref() || '/auth/sign-up'}>
            <Button 
              className="w-full mt-4" 
              variant={buttonVariant}
              disabled={isLoading || authLoading}
            >
              {buttonContent}
            </Button>
          </Link>
        ) : (
          <Button 
            className="w-full mt-4" 
            variant={buttonVariant}
            onClick={handlePayment}
            disabled={isLoading || authLoading}
          >
            {buttonContent}
          </Button>
        )}
      </CardContent>
    </Card>
    </>
  )
} 