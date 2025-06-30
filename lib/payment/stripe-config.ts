// Stripe价格ID配置
// 请根据您的Stripe产品ID进行更新
export const STRIPE_PRICE_IDS = {
  // 专业版 - 月付订阅
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_1RfneaQAnDbV3CHRBJiDcgBW',
  
  // 专业版 - 年付订阅（可选）
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  
  // 企业版 - 月付订阅
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
  
  // 企业版 - 年付订阅（可选）
  ENTERPRISE_YEARLY: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
} as const

// 价格配置
export const PRICING_CONFIG = {
  FREE: {
    title: '免费版',
    price: '¥0',
    description: '适合个人用户试用',
    features: [
      '每月 3 次简历优化',
      '基础 AI 分析',
      '5 个简历模板',
      '邮件支持'
    ],
    buttonText: '开始免费试用',
    buttonHref: '/auth/sign-up'
  },
  PRO: {
    title: '专业版',
    price: '¥99',
    description: '每月，适合求职者',
    features: [
      '每月 50 次简历优化',
      '高级 AI 分析',
      '50+ 个简历模板',
      '个性化建议',
      '优先客服支持',
      '导出 PDF 格式'
    ],
    priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    mode: 'subscription' as const,
    isPopular: true,
    buttonText: '选择专业版',
    buttonVariant: 'default' as const
  },
  ENTERPRISE: {
    title: '企业版',
    price: '¥299',
    description: '每月，适合企业',
    features: [
      '无限次简历优化',
      '企业级 AI 分析',
      '所有简历模板',
      '团队协作功能',
      '专属客户经理',
      'API 接口'
    ],
    priceId: STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY,
    mode: 'subscription' as const,
    buttonText: '联系销售',
    buttonHref: '/auth/sign-up'
  }
} as const 