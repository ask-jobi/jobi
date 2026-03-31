// Stripe价格ID配置
// 请根据您的Stripe产品ID进行更新
export const STRIPE_PRICE_IDS = {
  // 专业版 - 30天
  PRO_PASS:
    process.env.STRIPE_PRO_PASS_PRICE_ID || "price_1RnozgQAnDbV3CHR81Io7diw",

  // 专业版 - 7天
  LITE_PASS:
    process.env.STRIPE_LITE_PASS_PRICE_ID || "price_1Rnp0bQAnDbV3CHRbiNbPMrl"
} as const

// 基础价格配置（不包含文本内容）
export const BASE_PRICING_CONFIG = {
  FREE: {
    plan: "FREE"
  },
  PRO: {
    plan: "PRO",
    priceId: STRIPE_PRICE_IDS.PRO_PASS,
    mode: "payment" as const,
    isPopular: true,
    buttonVariant: "default" as const
  },
  LITE: {
    plan: "LITE",
    priceId: STRIPE_PRICE_IDS.LITE_PASS,
    mode: "payment" as const
  }
} as const

// 价格配置（包含文本内容，需要国际化）
export const PRICING_CONFIG = {
  FREE: {
    title: "pricing.plans.free.title",
    price: "pricing.plans.free.price",
    tokenAmount: "pricing.plans.free.tokenAmount",
    description: "pricing.plans.free.description",
    features: [],
    plan: "FREE",
    buttonText: "pricing.plans.free.buttonText"
  },
  PRO: {
    title: "pricing.plans.pro.title",
    price: "pricing.plans.pro.price",
    tokenAmount: "pricing.plans.pro.tokenAmount",
    description: "pricing.plans.pro.description",
    features: [],
    plan: "PRO",
    priceId: STRIPE_PRICE_IDS.PRO_PASS,
    mode: "payment" as const,
    isPopular: true,
    buttonText: "pricing.plans.pro.buttonText",
    buttonVariant: "default" as const
  },
  LITE: {
    title: "pricing.plans.lite.title",
    price: "pricing.plans.lite.price",
    tokenAmount: "pricing.plans.lite.tokenAmount",
    description: "pricing.plans.lite.description",
    features: [],
    plan: "LITE",
    priceId: STRIPE_PRICE_IDS.LITE_PASS,
    mode: "payment" as const,
    buttonText: "pricing.plans.lite.buttonText"
  }
} as const
