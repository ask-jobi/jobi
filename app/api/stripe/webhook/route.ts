import { NextResponse } from 'next/server'
import { stripe } from '@/lib/payment/stripe'
import { QUOTA } from '@/lib/payment/quota'
import { createServerRoleClient } from '@/lib/supabase/serverRoleClinet'

// 禁用 Next.js 的 bodyParser
export const config = {
    api: {
      bodyParser: false,
    },
  }

export async function POST(req: Request) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
  // 确保获得原始数据来解码
  const rawBody = await req.arrayBuffer()
  const sig = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig!, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    console.log('session', session)
    const stripeCustomerId = session.customer
    const supabaseUserId = session.metadata?.supabase_user_id
    console.log('supabaseUserId', supabaseUserId)
    const plan = session.metadata?.plan as 'FREE' | 'LITE' | 'PRO'
    console.log('plan', plan)

    const supabase = await createServerRoleClient()
    // 1. 更新 user_profiles
    // TODO: 不存在应该创建用户 profile， 或者应该在注册时创建该用户 record
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', supabaseUserId)
      .single()
    console.log('profile', profile)
    if (!profile) {
      await supabase.from('user_profiles').insert({
        id: supabaseUserId,
        stripe_customer_id: stripeCustomerId,
      })
    } else if (profile.stripe_customer_id !== stripeCustomerId) {
        console.log('update profile')
      await supabase.from('user_profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', supabaseUserId)
    }

    // 2. 覆盖 access_passes 只删除了未过期的 access_passes
    await supabase
      .from('access_passes')
      .delete()
      .eq('user_id', supabaseUserId)
      .gt('end_at', new Date().toISOString())

    // 3. 计算有效期
    const startAt = new Date()
    let endAt = new Date()
    if (plan === 'LITE') {
        endAt.setDate(startAt.getDate() + 14)
    } else if (plan === 'PRO') {
        endAt.setDate(startAt.getDate() + 30)
    } else if (plan === 'FREE') {
        endAt.setDate(startAt.getDate() + 3)
    }
    console.log('QUOTA', QUOTA[plan])
    console.log('insert access_passes')
    // TODO: 这里需要处理 error
    // TODO: 直接使用 access_passes 管理用量删掉 user_quotas 表
    const { data, error } = await supabase.from('access_passes').insert({
      user_id: supabaseUserId,
      plan,
      source: 'stripe',
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      stripe_checkout_session_id: session.id,
      quota_full_optimize: QUOTA[plan].quota_full_optimize,
      quota_block_optimize: QUOTA[plan].quota_block_optimize,
      quota_motivation_letter: QUOTA[plan].quota_motivation_letter,
    })
    console.log('data', data)
    console.log('error', error)
    console.log('insert access_passes done')
  }
  return NextResponse.json({ received: true })
} 