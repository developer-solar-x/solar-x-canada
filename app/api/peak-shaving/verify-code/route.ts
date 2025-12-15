import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST - Verify the code and mark email as verified
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json(
        { error: 'Valid 6-digit verification code is required' },
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
        { error: 'Email not found. Please request a new verification code.' },
        { status: 404 }
      )
    }

    // Check if code has expired
    if (lead.verification_code_expires_at) {
      const expiresAt = new Date(lead.verification_code_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        )
      }
    }

    // Check verification attempts (max 5 attempts)
    if (lead.verification_attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new verification code.' },
        { status: 429 }
      )
    }

    // Verify the code
    if (lead.verification_code !== code) {
      // Increment failed attempts
      await supabase
        .from('peak_shaving_leads')
        .update({
          verification_attempts: (lead.verification_attempts || 0) + 1,
        })
        .eq('email', normalizedEmail)

      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      )
    }

    // Code is valid - mark email as verified and reset attempts
    const { data: updatedLead, error: updateError } = await supabase
      .from('peak_shaving_leads')
      .update({
        email_verified: true,
        verification_attempts: 0,
        verification_code: null, // Clear the code after successful verification
        verification_code_expires_at: null,
      })
      .eq('email', normalizedEmail)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      lead: {
        email: updatedLead.email,
        emailVerified: updatedLead.email_verified,
        usageCount: updatedLead.usage_count,
        isSolarXEmail: updatedLead.is_solar_x_email,
      },
    })
  } catch (error: any) {
    console.error('Error in verify-code route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

