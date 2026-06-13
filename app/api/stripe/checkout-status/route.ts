import { NextResponse } from "next/server"

import {
  handleApiError,
  requireVerifiedAuthContext
} from "@/server/auth-helper"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      )
    }

    const { supabase, user } = await requireVerifiedAuthContext()

    const { data: checkoutEvent, error } = await supabase
      .from("stripe_checkout_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("checkout_session_id", sessionId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ processed: Boolean(checkoutEvent) })
  } catch (error) {
    return handleApiError(error)
  }
}
