'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Loader2 } from 'lucide-react'
import { PaymentError } from './payment-error'
import { LoginRequiredModal } from './login-required-modal'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface PricingCardProps {
  title: string
  price: string
  description: string
  features: readonly string[]
  priceId?: string
  plan: string
  isPopular?: boolean
  buttonText: string
  buttonVariant?: 'default' | 'outline'
}

export function PricingCard({
  title,
  price,
  description,
  features,
  priceId,
  plan,
  isPopular = false,
  buttonText,
  buttonVariant = 'outline',
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const handleButtonClick = async () => {
    // 首先检查登录状态
    if (!user) {
      // 未登录，跳转到登录页面并传递回调URL
      const callbackUrl = encodeURIComponent('/pricing')
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
      return
    }
    // TODO: 处理免费通行证的逻辑
    // TODO: 如果用户没有任意通行行证，则创建免费通行证 3 天试用（检查一下有没有其他地方有创建免费通行证的逻辑）
    // TODO: 如果用户有通行证，则检查是否过期，如果过期了，则引导用户购买通行，没有则直接进入DASHBOARD
    // 已登录之后的处理，处理套餐选择
    if (!priceId) {
      // 免费套餐，跳转到注册页面（或者直接进入应用）
      router.push('/auth/sign-up')
      return
    }

    // 付费套餐，创建支付会话
    await handlePayment()
  }

  const handlePayment = async () => {
    if (!priceId) return

    setIsLoading(true)
    setError(undefined)

    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          plan,
        }),
      })

      const { url, error } = await response.json()

      if (response.status === 401) {
        // 如果后端返回401，跳转到登录页面
        const callbackUrl = encodeURIComponent('/pricing')
        router.push(`/auth/login?callbackUrl=${callbackUrl}`)
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
    if (authLoading) return '加载中...'
    if (!user) return '登录后购买'
    if (!priceId) return buttonText // 免费套餐
    return buttonText
  }

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
          <Button
            className="w-full mt-4"
            variant={buttonVariant}
            onClick={handleButtonClick}
            disabled={isLoading || authLoading}
          >
            {buttonContent}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
