'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Package, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface SubscriptionData {
  plan: 'FREE' | 'LITE' | 'PRO' | null
  planName: string
  expiryDate: string | null
  isActive: boolean
  quotas: {
    fullOptimize: { used: number; total: number }
    blockOptimize: { used: number; total: number }
    motivationLetter: { used: number; total: number }
  }
}


export function CompactPlanDisplay() {
  const t = useTranslations()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const getPlanGradient = (plan: string | null) => {
    switch (plan) {
      case 'PRO':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'LITE':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      case 'FREE':
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500'
    }
  }

  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0
    return Math.round((used / total) * 100)
  }

  // 使用与侧边栏按钮相同的样式类
  const sidebarButtonStyle = cn(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    "h-8 text-sm"
  )

  if (loading) {
    return (
      <div className={sidebarButtonStyle}>
        <div className="flex items-center gap-2 w-full">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('currentPlan')}</span>
        </div>
        <div className="h-5 w-16 bg-muted rounded animate-pulse ml-auto"></div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className={sidebarButtonStyle}>
        <div className="flex items-center gap-2 w-full">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('currentPlan')}</span>
        </div>
        <Badge variant="outline" className="text-xs ml-auto">
          {t('noPlan')}
        </Badge>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={sidebarButtonStyle}>
            {/* 套餐信息 */}
            <div className="flex items-center gap-2 w-full">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('currentPlan')}</span>
            </div>
            <Badge 
              className={`text-white border-0 text-xs ${getPlanGradient(subscription.plan)}`}
            >
              {subscription.planName}
            </Badge>
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="right" className="w-64 p-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <h4 className="font-semibold text-sm">{t('planDetails')}</h4>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('planType')}</span>
                <span className="font-medium">{subscription.planName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('status')}</span>
                <span className="font-medium">
                  {subscription.isActive ? t('active') : t('expired')}
                </span>
              </div>
              
              {subscription.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('validUntil')}</span>
                  <span className="font-medium">
                    {new Date(subscription.expiryDate).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('fullOptimization')}</span>
                <span className="font-medium">
                  {subscription.quotas.fullOptimize.used} / {subscription.quotas.fullOptimize.total}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('blockOptimization')}</span>
                <span className="font-medium">
                  {subscription.quotas.blockOptimize.used} / {subscription.quotas.blockOptimize.total}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('motivationLetter')}</span>
                <span className="font-medium">
                  {subscription.quotas.motivationLetter.used} / {subscription.quotas.motivationLetter.total}
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 