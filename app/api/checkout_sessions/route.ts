import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/payment/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const origin = headersList.get('origin')
    console.log(origin)
    const body = await request.json()
    const { priceId, mode = 'subscription' } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // 检查用户是否已登录（中间件已经处理了会话更新）
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录后再进行购买' },
        { status: 401 }
      )
    }

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as 'subscription' | 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      automatic_tax: {enabled: true},
    });
    
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    )
  }
}