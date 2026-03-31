import { NextResponse } from "next/server"
import { stripe } from "@/lib/payment/stripe"
import { QUOTA } from "@/lib/payment/quota"
import { createServerRoleClient } from "@/lib/supabase/server-role-client"

// 禁用 Next.js 的 bodyParser
export const config = {
  api: {
    bodyParser: false
  }
}

export async function POST(req: Request) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
  // 确保获得原始数据来解码
  const rawBody = await req.arrayBuffer()
  const sig = req.headers.get("stripe-signature")

  let event
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig!,
      endpointSecret
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    console.log("session", session)
    const stripeCustomerId = session.customer
    const supabaseUserId = session.metadata?.supabase_user_id
    console.log("supabaseUserId", supabaseUserId)
    const plan = session.metadata?.plan as "FREE" | "LITE" | "PRO"
    console.log("plan", plan)

    if (!supabaseUserId || !plan) {
      console.error("Missing required metadata: supabase_user_id or plan")
      return new Response("Missing required metadata", { status: 400 })
    }

    if (plan === "FREE") {
      console.error("FREE plan is not supported in Stripe webhook")
      return new Response("FREE plan is not supported", { status: 400 })
    }

    const supabase = await createServerRoleClient()

    try {
      // 1. 找出当前用户的 access passes，并先处理幂等重放
      const { data: accessPasses, error: accessPassError } = await supabase
        .from("access_passes")
        .select("*")
        .eq("user_id", supabaseUserId)
        .order("created_at", { ascending: false })

      if (accessPassError && accessPassError.code !== "PGRST116") {
        console.error("Error querying access passes:", accessPassError)
        throw new Error(
          `Failed to query access passes: ${accessPassError.message}`
        )
      }

      const duplicateSessionPass = Array.isArray(accessPasses)
        ? accessPasses.find(
            (accessPass) =>
              accessPass.stripe_checkout_session_id === session.id
          )
        : null

      if (duplicateSessionPass) {
        return NextResponse.json({ received: true })
      }

      // 2. 查询 user_profiles
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", supabaseUserId)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 是 "not found" 错误
        console.error("Error querying user profile:", profileError)
        throw new Error(`Failed to query user profile: ${profileError.message}`)
      }

      // 3. 处理 user_profiles 的插入或更新
      if (!profile) {
        // 如果用户不存在，则创建用户 profile
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: supabaseUserId,
            stripe_customer_id: stripeCustomerId
          })

        if (insertError) {
          console.error("Error creating user profile:", insertError)
          throw new Error(
            `Failed to create user profile: ${insertError.message}`
          )
        }

        console.log("Created new user profile for:", supabaseUserId)
      } else if (profile.stripe_customer_id !== stripeCustomerId) {
        // 如果用户存在，则更新用户 profile中 stripe_customer_id
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", supabaseUserId)

        if (updateError) {
          console.error("Error updating user profile:", updateError)
          throw new Error(
            `Failed to update user profile: ${updateError.message}`
          )
        }

        console.log("Updated stripe_customer_id for user:", supabaseUserId)
      }

      // 4. 找出当前仍有余额的最新 access pass
      const activeAccessPass = Array.isArray(accessPasses)
        ? accessPasses.find(
            (accessPass) =>
              (accessPass.quota_chat_tokens ?? 0) >
              (accessPass.used_chat_tokens ?? 0)
          )
        : null

      // 5. 计算有效期
      const startAt = new Date()
      const endAt = new Date()
      if (plan === "LITE") {
        endAt.setDate(startAt.getDate() + 14)
      } else if (plan === "PRO") {
        endAt.setDate(startAt.getDate() + 30)
      } else {
        throw new Error(`Invalid plan: ${plan}`)
      }

      const quotaConfig = QUOTA[plan]

      if (activeAccessPass) {
        const { error: updateAccessPassError } = await supabase
          .from("access_passes")
          .update({
            plan,
            source: "stripe",
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            stripe_checkout_session_id: session.id,
            quota_full_optimize: quotaConfig.quota_full_optimize,
            quota_block_optimize: quotaConfig.quota_block_optimize,
            quota_motivation_letter: quotaConfig.quota_motivation_letter,
            quota_chat_tokens:
              (activeAccessPass.quota_chat_tokens ?? 0) +
              quotaConfig.quota_chat_tokens
          })
          .eq("id", activeAccessPass.id)

        if (updateAccessPassError) {
          console.error("Error updating access pass:", updateAccessPassError)
          throw new Error(
            `Failed to update access pass: ${updateAccessPassError.message}`
          )
        }

        console.log(
          "Successfully updated access pass for user:",
          supabaseUserId,
          "plan:",
          plan
        )
      } else {
        // 5. 创建新的 access_pass
        const { error: insertAccessPassError } = await supabase
          .from("access_passes")
          .insert({
            user_id: supabaseUserId,
            plan,
            source: "stripe",
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            stripe_checkout_session_id: session.id,
            quota_full_optimize: quotaConfig.quota_full_optimize,
            quota_block_optimize: quotaConfig.quota_block_optimize,
            quota_motivation_letter: quotaConfig.quota_motivation_letter,
            quota_chat_tokens: quotaConfig.quota_chat_tokens,
            used_full_optimize: 0,
            used_block_optimize: 0,
            used_motivation_letter: 0,
            used_chat_tokens: 0
          })

        if (insertAccessPassError) {
          console.error("Error creating access pass:", insertAccessPassError)
          throw new Error(
            `Failed to create access pass: ${insertAccessPassError.message}`
          )
        }

        console.log(
          "Successfully created access pass for user:",
          supabaseUserId,
          "plan:",
          plan
        )
      }
    } catch (error: any) {
      console.error("Database operation failed:", error.message)
      // 返回 500 错误，但 webhook 仍然被认为是成功的
      // 这样可以避免 Stripe 重试，同时记录错误
      return new Response(`Database Error: ${error.message}`, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
