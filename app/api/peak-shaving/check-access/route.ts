import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST - Check if email can access the calculator
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const supabase = getSupabaseAdmin()

    // Find the lead
    const { data: lead, error: findError } = await supabase
      .from('peak_shaving_leads')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (findError || !lead) {
      return NextResponse.json({
        canAccess: false,
        reason: 'Email not verified',
        needsVerification: true,
      })
    }

    // Check if email is verified
    if (!lead.email_verified) {
      return NextResponse.json({
        canAccess: false,
        reason: 'Email not verified',
        needsVerification: true,
      })
    }

    // If it's a solar-x.ca email, unlimited access
    if (lead.is_solar_x_email) {
      return NextResponse.json({
        canAccess: true,
        reason: 'Solar-X employee - unlimited access',
        usageCount: lead.usage_count,
        isSolarXEmail: true,
        remainingUses: null, // Unlimited
      })
    }

    // Check usage count (max 2 for regular users)
    if (lead.usage_count >= 2) {
      return NextResponse.json({
        canAccess: false,
        reason: 'Usage limit reached (2 uses)',
        usageCount: lead.usage_count,
        remainingUses: 0,
      })
    }

    // Can access
    return NextResponse.json({
      canAccess: true,
      reason: 'Access granted',
      usageCount: lead.usage_count,
      remainingUses: 2 - lead.usage_count,
    })
  } catch (error: any) {
    console.error('Error in check-access route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

