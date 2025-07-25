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
    // TODO: 看看要不要把整个流程的 mode 都给删了
    const { priceId, plan, mode = 'payment' } = body

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
      mode: 'payment', // 一次性支付
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      automatic_tax: {enabled: true},
      //TODO: 需要测试 是否需要创建客户？ 不加这个在 payment 模式不会创建客户，加了这个每次会创新用户
      // 如果改用 email 在 user_profiles 表中, 那么用户改邮箱了咋办？
      // 为什么需要这个特殊值？为了后期分析用户复购？ 为了用户订单有问题时排查？ 有没有其他办法
      // 检查 stripe 是不是按 Customer收费的
      customer_creation: 'always', // 创建客户
      customer_email: user.email,
      metadata: {
        supabase_user_id: user.id,
        plan: plan,
      },
    });
    
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    )
  }
}