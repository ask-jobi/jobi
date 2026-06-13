import { NextResponse } from "next/server"
import { Paddle } from "@paddle/paddle-node-sdk"

import { QUOTA } from "@/lib/payment/quota"
import { createServerRoleClient } from "@/lib/supabase/server-role-client"

type PaddleTransactionEvent = {
  eventType?: string
  data?: {
    id?: string
    customData?: Record<string, unknown> | null
    custom_data?: Record<string, unknown> | null
  }
}

const getRequiredEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get("paddle-signature") ?? ""

  let event: PaddleTransactionEvent
  try {
    const paddle = new Paddle(getRequiredEnv("PADDLE_API_KEY"))
    event = (await paddle.webhooks.unmarshal(
      rawBody,
      getRequiredEnv("PADDLE_WEBHOOK_SECRET"),
      signature
    )) as PaddleTransactionEvent
  } catch (error: any) {
    console.error(
      "Paddle webhook signature verification failed.",
      error.message
    )
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }

  if (event.eventType !== "transaction.completed") {
    return NextResponse.json({ received: true })
  }

  const transaction = event.data
  const customData = transaction?.customData ?? transaction?.custom_data
  const supabaseUserId = customData?.supabase_user_id
  const plan = customData?.plan as "FREE" | "LITE" | "PRO" | undefined

  if (
    !transaction?.id ||
    typeof supabaseUserId !== "string" ||
    typeof plan !== "string"
  ) {
    return new Response("Missing required custom data", { status: 400 })
  }

  if (plan === "FREE") {
    return new Response("FREE plan is not supported", { status: 400 })
  }

  if (!(plan in QUOTA)) {
    return new Response(`Invalid plan: ${plan}`, { status: 400 })
  }

  const supabase = await createServerRoleClient()

  try {
    const quotaConfig = QUOTA[plan]

    const { error: insertCheckoutEventError } = await supabase
      .from("stripe_checkout_events")
      .insert({
        user_id: supabaseUserId,
        checkout_session_id: transaction.id,
        plan,
        granted_tokens: quotaConfig.quota_chat_tokens
      })

    if (insertCheckoutEventError) {
      if (insertCheckoutEventError.code === "23505") {
        return NextResponse.json({ received: true })
      }

      throw new Error(
        `Failed to create paddle checkout event: ${insertCheckoutEventError.message}`
      )
    }

    const { data: existingAccessPass, error: accessPassError } = await supabase
      .from("access_passes")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle()

    if (accessPassError) {
      throw new Error(`Failed to query access pass: ${accessPassError.message}`)
    }

    if (existingAccessPass) {
      const { error: updateAccessPassError } = await supabase
        .from("access_passes")
        .update({
          plan,
          quota_chat_tokens:
            (existingAccessPass.quota_chat_tokens ?? 0) +
            quotaConfig.quota_chat_tokens
        })
        .eq("id", existingAccessPass.id)

      if (updateAccessPassError) {
        await supabase
          .from("stripe_checkout_events")
          .delete()
          .eq("checkout_session_id", transaction.id)
        throw new Error(
          `Failed to update access pass: ${updateAccessPassError.message}`
        )
      }
    } else {
      const { error: insertAccessPassError } = await supabase
        .from("access_passes")
        .insert({
          user_id: supabaseUserId,
          plan,
          quota_chat_tokens: quotaConfig.quota_chat_tokens,
          used_chat_tokens: 0
        })

      if (insertAccessPassError) {
        await supabase
          .from("stripe_checkout_events")
          .delete()
          .eq("checkout_session_id", transaction.id)
        throw new Error(
          `Failed to create access pass: ${insertAccessPassError.message}`
        )
      }
    }
  } catch (error: any) {
    console.error("Paddle webhook database operation failed:", error.message)
    return new Response(`Database Error: ${error.message}`, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
