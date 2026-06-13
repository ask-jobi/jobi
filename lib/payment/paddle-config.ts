export const PADDLE_PRICE_IDS = {
  PRO_BUNDLE:
    process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID ||
    process.env.PADDLE_PRO_PRICE_ID ||
    "pri_01kv0qsqh21dt05vtywzeqpnpx",

  LITE_BUNDLE:
    process.env.NEXT_PUBLIC_PADDLE_LITE_PRICE_ID ||
    process.env.PADDLE_LITE_PRICE_ID ||
    "pri_01kv0qngf4mefz87sr4ts0neqp"
} as const

export const PADDLE_PRICING_CONFIG = {
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
    priceId: PADDLE_PRICE_IDS.PRO_BUNDLE,
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
    priceId: PADDLE_PRICE_IDS.LITE_BUNDLE,
    mode: "payment" as const,
    buttonText: "pricing.plans.lite.buttonText"
  }
} as const
