import { NextResponse } from "next/server"

import { ApiError, requireAuthContext } from "@/server/auth-helper"

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

    const { supabase, user } = await requireAuthContext()

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
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error("Error fetching checkout status:", error)
    return NextResponse.json(
      { error: "Failed to fetch checkout status" },
      { status: 500 }
    )
  }
}
