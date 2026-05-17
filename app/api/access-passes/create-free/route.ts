import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { QUOTA } from "@/lib/payment/quota"

export async function POST() {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "用户未登录" }, { status: 401 })
    }

    // 只允许从未拥有过任何 access pass 历史的用户领取一次免费包
    const { data: accessPassHistory, error: historyError } = await supabase
      .from("access_passes")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (historyError) {
      if (historyError.code !== "PGRST116") {
        console.error("Error checking access pass history:", historyError)
        return NextResponse.json(
          { error: "检查通行证历史失败" },
          { status: 500 }
        )
      }
    }

    // 只要存在任何历史记录，就不能再次领取 FREE
    if (accessPassHistory) {
      return NextResponse.json(
        {
          error: "您已经试用过该产品，请选择付费套餐继续使用",
          code: "ALREADY_TRIED"
        },
        { status: 400 }
      )
    }

    // 创建一次性免费 token 赠送记录
    const { data: accessPass, error: insertError } = await supabase
      .from("access_passes")
      .insert({
        user_id: user.id,
        plan: "FREE",
        quota_chat_tokens: QUOTA.FREE.quota_chat_tokens,
        used_chat_tokens: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating free access pass:", insertError)
      return NextResponse.json(
        { error: "Failed to create free pass" },
        { status: 500 }
      )
    }

    console.log("Successfully created free access pass for user:", user.id)

    return NextResponse.json({
      message: "Free token grant created successfully",
      accessPass
    })
  } catch (error: any) {
    console.error("Create free access pass failed:", error.message)
    return NextResponse.json({ error: "创建免费通行证失败" }, { status: 500 })
  }
}
