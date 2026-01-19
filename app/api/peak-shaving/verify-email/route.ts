import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { sendInternalNotificationEmail } from '@/lib/internal-email'

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Resend API key not configured')
  }
  return new Resend(apiKey)
}

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST - Send verification code to email
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

    // Check if email already exists
    const { data: existingLead, error: checkError } = await supabase
      .from('peak_shaving_leads')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Check if it's a solar-x.ca email
    const isSolarXEmail = normalizedEmail.endsWith('@solar-x.ca')

    if (existingLead) {
      // Update existing lead with new verification code
      const { error: updateError } = await supabase
        .from('peak_shaving_leads')
        .update({
          verification_code: verificationCode,
          verification_code_expires_at: expiresAt.toISOString(),
          verification_attempts: 0, // Reset attempts
          email_verified: false, // Reset verification status
        })
        .eq('email', normalizedEmail)

      if (updateError) {
        console.error('Error updating lead:', updateError)
        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        )
      }
    } else {
      // Create new lead
      const { error: insertError } = await supabase
        .from('peak_shaving_leads')
        .insert({
          email: normalizedEmail,
          verification_code: verificationCode,
          verification_code_expires_at: expiresAt.toISOString(),
          is_solar_x_email: isSolarXEmail,
        })

      if (insertError) {
        console.error('Error creating lead:', insertError)
        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        )
      }
    }

      // For Solar-X emails, still send verification code (don't auto-verify)
      // This ensures only legitimate Solar-X employees can access
      if (isSolarXEmail) {
        // Send verification email to Solar-X email (same process as regular users)
        // Don't auto-verify - they still need to enter the code
        try {
          const resend = createResendClient()
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solarcalculatorcanada.org'

          await resend.emails.send({
            from: 'Solar Calculator Canada <info@solarcalculatorcanada.org>',
            to: normalizedEmail,
            subject: 'Verify your Solar-X email for Peak Shaving Calculator',
            html: `
              <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
                  Verify your Solar-X email address
                </h1>
                <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 16px;">
                  Please use the verification code below to access the Peak Shaving Calculator. Solar-X employees have unlimited access.
                </p>
                <div style="background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${verificationCode}
                  </div>
                </div>
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 8px;">
                  This code will expire in 15 minutes.
                </p>
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
                  If you didn't request this code, you can safely ignore this email.
                </p>
                <p style="font-size: 13px; color: #94a3b8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                  — Solar Calculator Canada<br>
                  <a href="${appUrl}" style="color: #2D5F3F; text-decoration: none;">${appUrl}</a>
                </p>
              </div>
            `,
            text: `Verify your Solar-X email address\n\nPlease use the verification code below to access the Peak Shaving Calculator. Solar-X employees have unlimited access.\n\n${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, you can safely ignore this email.\n\n— Solar Calculator Canada\n${appUrl}`,
          })
        } catch (emailError) {
          console.error('Error sending verification email:', emailError)
          // Don't fail the request if email fails - code is still stored in DB
        }

        return NextResponse.json({
          success: true,
          message: 'Verification code sent to your email',
          isSolarXEmail: true,
        })
      } else {
        // Send verification email via Resend (only for non-solar-x emails)
        try {
          const resend = createResendClient()
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solarcalculatorcanada.org'

          await resend.emails.send({
            from: 'Solar Calculator Canada <info@solarcalculatorcanada.org>',
            to: normalizedEmail,
            subject: 'Verify your email for Peak Shaving Calculator',
            html: `
              <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
                  Verify your email address
                </h1>
                <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 16px;">
                  Thanks for your interest in the Peak Shaving Calculator. Please use the verification code below to access the calculator:
                </p>
                <div style="background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${verificationCode}
                  </div>
                </div>
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 8px;">
                  This code will expire in 15 minutes.
                </p>
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
                  If you didn't request this code, you can safely ignore this email.
                </p>
                <p style="font-size: 13px; color: #94a3b8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                  — Solar Calculator Canada<br>
                  <a href="${appUrl}" style="color: #2D5F3F; text-decoration: none;">${appUrl}</a>
                </p>
              </div>
            `,
            text: `Verify your email address\n\nThanks for your interest in the Peak Shaving Calculator. Please use the verification code below to access the calculator:\n\n${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, you can safely ignore this email.\n\n— Solar Calculator Canada\n${appUrl}`,
          })
        } catch (emailError) {
          console.error('Error sending verification email:', emailError)
          // Don't fail the request if email fails - code is still stored in DB
        }
      }

    // Fire-and-forget internal notification only for non-solar-x access requests
    if (!isSolarXEmail) {
      ;(async () => {
        try {
          const subject = `New Peak-Shaving Access Request: ${normalizedEmail}`
          const textLines: string[] = []
          textLines.push(`Email: ${normalizedEmail}`)
          textLines.push(`Existing lead: ${existingLead ? 'Yes' : 'No'}`)
          textLines.push(`Solar-X email: ${isSolarXEmail ? 'Yes' : 'No'}`)
          textLines.push('')
          textLines.push(
            `Admin link (leads): ${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/admin/peak-shaving-leads`
          )

          await sendInternalNotificationEmail({
            subject,
            text: textLines.join('\n'),
          })
        } catch (err) {
          console.error('Internal peak-shaving access notification email error:', err)
        }
      })()
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    })
  } catch (error: any) {
    console.error('Error in verify-email route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

