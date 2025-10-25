// Quick calculator API for landing page

import { NextResponse } from 'next/server'
import { calculateQuickEstimate } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { monthlyBill } = body

    // Validate input
    if (!monthlyBill || typeof monthlyBill !== 'number') {
      return NextResponse.json(
        { error: 'Invalid monthly bill amount' },
        { status: 400 }
      )
    }

    // Validate range
    if (monthlyBill < 0 || monthlyBill > 1000) {
      return NextResponse.json(
        { error: 'Monthly bill must be between $0 and $1000' },
        { status: 400 }
      )
    }

    // Calculate estimate
    const estimate = calculateQuickEstimate(monthlyBill)

    // Return results
    return NextResponse.json({
      success: true,
      data: estimate
    })

  } catch (error) {
    console.error('Calculator API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

