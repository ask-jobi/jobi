import { NextResponse } from 'next/server'
import { getUserSubscription } from '@/server/quota'

export async function GET() {
  try {
    const subscription = await getUserSubscription()
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
} 