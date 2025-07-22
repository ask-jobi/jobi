'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PaymentCancelledAlert } from "@/components/client-components/payment-cancelled-alert";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TestCancelPage() {
  const searchParams = useSearchParams()
  const [showCancelledAlert, setShowCancelledAlert] = useState(false)

  useEffect(() => {
    const cancelled = searchParams.get('cancelled')
    if (cancelled === 'true') {
      setShowCancelledAlert(true)
    }
  }, [searchParams])

  const handleCloseAlert = () => {
    setShowCancelledAlert(false)
    // 清除URL参数
    const url = new URL(window.location.href)
    url.searchParams.delete('cancelled')
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">支付取消测试</h1>
        
        <PaymentCancelledAlert 
          isVisible={showCancelledAlert} 
          onClose={handleCloseAlert} 
        />
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h2 className="text-lg font-semibold mb-2">测试说明：</h2>
            <p className="text-sm text-muted-foreground mb-4">
              点击下面的链接来模拟支付取消的情况
            </p>
            
            <div className="space-y-2">
              <Link href="/test-cancel?cancelled=true">
                <Button variant="outline" size="sm">
                  模拟支付取消
                </Button>
              </Link>
              
              <div className="text-xs text-muted-foreground">
                当前URL参数: cancelled={searchParams.get('cancelled') || 'null'}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">预期行为：</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 点击"模拟支付取消"后，页面顶部会显示橙色提示框</li>
              <li>• 提示框会在5秒后自动消失</li>
              <li>• 可以手动点击X按钮关闭提示框</li>
              <li>• 关闭后URL参数会被清除</li>
            </ul>
          </div>
          
          <Link href="/pricing">
            <Button>返回定价页面</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 