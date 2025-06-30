'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, X } from 'lucide-react'

interface PaymentErrorProps {
  error?: string
  onClose?: () => void
}

export function PaymentError({ error, onClose }: PaymentErrorProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      // 5秒后自动隐藏
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, onClose])

  if (!error || !isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-800 text-lg">支付错误</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false)
                onClose?.()
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-red-700">
            {error}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
} 