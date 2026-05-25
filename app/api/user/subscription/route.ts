import { NextResponse } from "next/server"

import { handleApiError } from "@/server/auth-helper"
import { getUserTokenBalance } from "@/server/quota"

export async function GET() {
  try {
    const tokenBalance = await getUserTokenBalance()
    return NextResponse.json(tokenBalance)
  } catch (error) {
    return handleApiError(error)
  }
}
