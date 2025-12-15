import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST - Record calculator access and increment usage count
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
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    // Verify email is verified
    if (!lead.email_verified) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      )
    }

    // Check usage limit (only for non-solar-x emails)
    if (!lead.is_solar_x_email && lead.usage_count >= 2) {
      return NextResponse.json(
        { error: 'Usage limit reached' },
        { status: 403 }
      )
    }

    // For Solar-X emails, don't log or increment usage
    if (lead.is_solar_x_email) {
      // Solar-X emails have unlimited access - no logging needed
      return NextResponse.json({
        success: true,
        usageCount: lead.usage_count,
        remainingUses: null, // Unlimited
      })
    }

    // Get IP address and user agent from request (only for regular users)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Increment usage count (only for non-solar-x emails)
    const newUsageCount = lead.usage_count + 1

    const { error: updateError } = await supabase
      .from('peak_shaving_leads')
      .update({
        usage_count: newUsageCount,
        last_used_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail)

    if (updateError) {
      console.error('Error updating usage count:', updateError)
      return NextResponse.json(
        { error: 'Failed to record access' },
        { status: 500 }
      )
    }

    // Log the access (only for regular users)
    const { error: logError } = await supabase
      .from('peak_shaving_access_logs')
      .insert({
        lead_id: lead.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (logError) {
      console.error('Error logging access:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      usageCount: newUsageCount,
      remainingUses: lead.is_solar_x_email ? null : 2 - newUsageCount,
    })
  } catch (error: any) {
    console.error('Error in record-access route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

