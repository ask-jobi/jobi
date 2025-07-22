'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Lock, UserPlus, LogIn } from 'lucide-react'
import Link from 'next/link'

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  planName: string
}

export function LoginRequiredModal({ isOpen, onClose, planName }: LoginRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">需要登录</DialogTitle>
          <DialogDescription className="text-center">
            购买 {planName} 需要先登录您的账户
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            登录后您可以：
            <ul className="mt-2 space-y-1 text-left">
              <li>• 安全完成支付</li>
              <li>• 管理您的订阅</li>
              <li>• 查看购买历史</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full" onClick={onClose}>
                <LogIn className="w-4 h-4 mr-2" />
                登录
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="flex-1">
              <Button variant="outline" className="w-full" onClick={onClose}>
                <UserPlus className="w-4 h-4 mr-2" />
                注册
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onClose}>
              稍后再说
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
