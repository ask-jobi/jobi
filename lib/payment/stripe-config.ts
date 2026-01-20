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
  // TODO: Handle free plan logic - if user hasn't tried before, create free pass for 3 days trial
  // If user already has a pass, check if expired, if expired guide user to purchase, if not go directly to DASHBOARD
  FREE: {
    title: "pricing.plans.free.title",
    price: "Free",
    description: "pricing.plans.free.description",
    features: [
      "pricing.plans.free.features.0",
      "pricing.plans.free.features.1",
      "pricing.plans.free.features.2",
      "pricing.plans.free.features.3"
    ],
    plan: "FREE",
    buttonText: "pricing.plans.free.buttonText"
  },
  PRO: {
    title: "pricing.plans.pro.title",
    price: "€24.99",
    description: "pricing.plans.pro.description",
    features: [
      "pricing.plans.pro.features.0",
      "pricing.plans.pro.features.1",
      "pricing.plans.pro.features.2",
      "pricing.plans.pro.features.3",
      "pricing.plans.pro.features.4",
      "pricing.plans.pro.features.5",
      "pricing.plans.pro.features.6"
    ],
    plan: "PRO",
    priceId: STRIPE_PRICE_IDS.PRO_PASS,
    mode: "payment" as const,
    isPopular: true,
    buttonText: "pricing.plans.pro.buttonText",
    buttonVariant: "default" as const
  },
  LITE: {
    title: "pricing.plans.lite.title",
    price: "€19.99",
    description: "pricing.plans.lite.description",
    features: [
      "pricing.plans.lite.features.0",
      "pricing.plans.lite.features.1",
      "pricing.plans.lite.features.2",
      "pricing.plans.lite.features.3"
    ],
    plan: "LITE",
    priceId: STRIPE_PRICE_IDS.LITE_PASS,
    mode: "payment" as const,
    buttonText: "pricing.plans.lite.buttonText"
  }
} as const
