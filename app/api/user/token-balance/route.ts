import { NextResponse } from "next/server"
import { getUserTokenBalance } from "@/server/quota"

export async function GET() {
  try {
    const tokenBalance = await getUserTokenBalance()
    return NextResponse.json(tokenBalance)
  } catch (error) {
    console.error("Error fetching token balance:", error)
    return NextResponse.json(
      { error: "Failed to fetch token balance" },
      { status: 500 }
    )
  }
}
