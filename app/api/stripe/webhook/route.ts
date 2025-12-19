import { NextResponse } from 'next/server'
import { stripe } from '@/lib/payment/stripe'
import { QUOTA } from '@/lib/payment/quota'
import { createServerRoleClient } from '@/lib/supabase/server-role-client'

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

    if (!supabaseUserId || !plan) {
      console.error('Missing required metadata: supabase_user_id or plan')
      return new Response('Missing required metadata', { status: 400 })
    }

    const supabase = await createServerRoleClient()

    try {
      // 1. 查询 user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUserId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 是 "not found" 错误
        console.error('Error querying user profile:', profileError)
        throw new Error(`Failed to query user profile: ${profileError.message}`)
      }

      // 2. 处理 user_profiles 的插入或更新
      if (!profile) {
        // 如果用户不存在，则创建用户 profile
        const { error: insertError } = await supabase.from('user_profiles').insert({
          id: supabaseUserId,
          stripe_customer_id: stripeCustomerId,
        })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          throw new Error(`Failed to create user profile: ${insertError.message}`)
        }

        console.log('Created new user profile for:', supabaseUserId)
      } else if (profile.stripe_customer_id !== stripeCustomerId) {
        // 如果用户存在，则更新用户 profile中 stripe_customer_id
        const { error: updateError } = await supabase.from('user_profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', supabaseUserId)

        if (updateError) {
          console.error('Error updating user profile:', updateError)
          throw new Error(`Failed to update user profile: ${updateError.message}`)
        }

        console.log('Updated stripe_customer_id for user:', supabaseUserId)
      }

      // 3. 删除当前未过期的 access_passes
      const { error: deleteError } = await supabase
        .from('access_passes')
        .delete()
        .eq('user_id', supabaseUserId)
        .gt('end_at', new Date().toISOString())

      if (deleteError) {
        console.error('Error deleting existing access passes:', deleteError)
        throw new Error(`Failed to delete existing access passes: ${deleteError.message}`)
      }

      console.log('Deleted existing access passes for user:', supabaseUserId)

      // 4. 计算有效期
      const startAt = new Date()
      const endAt = new Date()
      if (plan === 'LITE') {
          endAt.setDate(startAt.getDate() + 14)
      } else if (plan === 'PRO') {
          endAt.setDate(startAt.getDate() + 30)
      } else if (plan === 'FREE') {
          endAt.setDate(startAt.getDate() + 3)
      } else {
          throw new Error(`Invalid plan: ${plan}`)
      }

      // 5. 创建新的 access_pass
      const { error: insertAccessPassError } = await supabase.from('access_passes').insert({
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

      if (insertAccessPassError) {
        console.error('Error creating access pass:', insertAccessPassError)
        throw new Error(`Failed to create access pass: ${insertAccessPassError.message}`)
      }

      console.log('Successfully created access pass for user:', supabaseUserId, 'plan:', plan)

    } catch (error: any) {
      console.error('Database operation failed:', error.message)
      // 返回 500 错误，但 webhook 仍然被认为是成功的
      // 这样可以避免 Stripe 重试，同时记录错误
      return new Response(`Database Error: ${error.message}`, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
