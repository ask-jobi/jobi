import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getStripe } from "@/lib/payment/stripe"
import { requireAuthContext } from "@/server/auth-helper"

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const origin = headersList.get("origin")
    const body = await request.json()
    const { priceId, plan } = body

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      )
    }

    // 检查用户是否已登录（中间件已经处理了会话更新）
    const { supabase, user } = await requireAuthContext()

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      throw new Error(profileError.message)
    }

    const checkoutSessionParams = {
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: "payment" as const,
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      automatic_tax: { enabled: true },
      metadata: {
        supabase_user_id: user.id,
        plan: plan
      }
    }

    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create(
      profile?.stripe_customer_id
        ? {
            ...checkoutSessionParams,
            customer: profile.stripe_customer_id
          }
        : {
            ...checkoutSessionParams,
            customer_creation: "always",
            customer_email: user.email
          }
    )

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    )
  }
}
