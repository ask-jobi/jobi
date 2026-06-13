import { NextResponse } from "next/server"

import {
  handleApiError,
  requireVerifiedAuthContext
} from "@/server/auth-helper"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transaction_id")

    if (!transactionId) {
      return NextResponse.json(
        { error: "transaction_id is required" },
        { status: 400 }
      )
    }

    const { supabase, user } = await requireVerifiedAuthContext()

    const { data: checkoutEvent, error } = await supabase
      .from("stripe_checkout_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("checkout_session_id", transactionId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ processed: Boolean(checkoutEvent) })
  } catch (error) {
    return handleApiError(error)
  }
}
