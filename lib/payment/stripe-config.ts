// Stripe价格ID配置
// 请根据您的Stripe产品ID进行更新
export const STRIPE_PRICE_IDS = {
  // 专业版 - 30天
  PRO_PASS: process.env.STRIPE_PRO_PASS_PRICE_ID || 'price_1RnozgQAnDbV3CHR81Io7diw',
  
  // 专业版 - 7天
  LITE_PASS: process.env.STRIPE_LITE_PASS_PRICE_ID || 'price_1Rnp0bQAnDbV3CHRbiNbPMrl',
} as const

// 价格配置
export const PRICING_CONFIG = {
  FREE: {
    title: 'Free Pass',
    price: 'Free',
    description: '适合个人用户试用，3 天完整功能',
    features: [
      '每月 3 次简历优化',
      '基础 AI 分析',
      '动机信生成',
      '邮件支持'
    ],
    plan: 'FREE',
    buttonText: '开始免费试用',
    buttonHref: '/auth/sign-up'
  },
  PRO: {
    title: 'Pro Pass',
    price: '€24.99',
    description: '最受欢迎！一次付费，享受 30 天的完整功能 + 简历优化高亮建议',
    features: [
      '每月 50 次简历优化',
      '高级 AI 分析',
      '简历优化高亮建议',
      '优先客服支持',
      '导出 PDF 格式',
      '30 天完整功能',
      '24h 邮件支持'
    ],
    plan: 'PRO',
    priceId: STRIPE_PRICE_IDS.PRO_PASS,
    mode: 'payment' as const,
    isPopular: true,
    buttonText: '选择 Pro Pass',
    buttonVariant: 'default' as const
  },
  LITE: {
    title: 'Lite Pass',
    price: '€19.99',
    description: '短期冲刺，一次付费，享受 7 天的完整功能',
    features: [
      '每月 3 次简历优化',
      '基础 AI 分析',
      '动机信生成',
      '24h 邮件支持'
    ],
    plan: 'LITE',
    priceId: STRIPE_PRICE_IDS.LITE_PASS,
    mode: 'payment' as const,
    buttonText: '选择 Lite Pass',
    buttonHref: '/auth/sign-up'
  }
} as const 