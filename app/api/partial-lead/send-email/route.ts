// API route to send follow-up email to partial leads
// This route sends a friendly reminder email encouraging users to complete their estimate

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { getPartialLeadDisplaySteps, getPartialLeadTotalSteps } from '@/app/admin/partial-lead-steps'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.')
  }

  return new Resend(apiKey)
}

// Generate follow-up email template for partial leads
function generateFollowUpEmailTemplate(partialLead: any, partialLeadId: string) {
  const email = partialLead.email || ''
  const estimatorData = partialLead.estimator_data || {}
  const address = partialLead.address || estimatorData.address || ''
  const currentStep = partialLead.current_step || 0
  
  // Get step information
  const stepMeta = {
    estimatorMode: estimatorData.estimatorMode,
    programType: partialLead.program_type || estimatorData.programType,
    systemType: estimatorData.systemType,
  }
  
  const stepNames = getPartialLeadDisplaySteps(stepMeta)
  const totalSteps = getPartialLeadTotalSteps(stepMeta)
  const currentStepName = stepNames[currentStep] || 'Unknown'
  const completion = Math.round(((currentStep + 1) / totalSteps) * 100)
  
  // Determine program type label
  const programType = partialLead.program_type || estimatorData.programType || ''
  const isNetMetering = programType === 'net_metering'
  const isHRS = programType === 'hrs_residential'
  const estimatorMode = estimatorData.estimatorMode || ''
  const isQuick = estimatorMode === 'quick' || estimatorMode === 'easy'
  const isDetailed = estimatorMode === 'detailed'
  
  const programLabel = isNetMetering 
    ? 'Net Metering' 
    : isHRS
    ? 'Solar HRS'
    : programType?.replace(/_/g, ' ') || 'Solar'
  
  const flowType = isQuick ? 'Quick Estimate' : isDetailed ? 'Detailed' : estimatorMode || 'Estimate'
  
  // Get base URL for continue link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.solarcalculatorcanada.org'
  const continueUrl = `${baseUrl}/estimator`
  
  return {
    subject: `Complete Your Solar ${programLabel} Estimate - You're ${completion}% Done!`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Solar Estimate</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
    <!-- Header with gradient -->
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%);">
          <tr>
            <td style="padding: 48px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Solar Calculator Canada</h1>
              <div style="width: 60px; height: 3px; background-color: #ffffff; margin: 0 auto; border-radius: 2px;"></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff;">
          <tr>
            <td style="padding: 48px 40px 40px 40px;">
              <!-- Greeting Section -->
              <div style="margin-bottom: 40px;">
                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;">
                  You're Almost There! 🎯
                </h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 12px 0;">
                  Hi there,
                </p>
                <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0;">
                  We noticed you started a <strong style="color: #1e293b;">${programLabel} ${flowType}</strong>${address ? ` for <strong style="color: #1e293b;">${address}</strong>` : ''}, but didn't finish. You're already <strong style="color: #2D5F3F;">${completion}% complete</strong> - just a few more steps to get your personalized solar estimate!
                </p>
              </div>
        
              <!-- Progress Card -->
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Your Progress
                  </h3>
                </div>
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Completion</span>
                    <span style="color: #2D5F3F; font-size: 14px; font-weight: 700;">${completion}%</span>
                  </div>
                  <div style="width: 100%; height: 12px; background-color: #e5e7eb; border-radius: 6px; overflow: hidden;">
                    <div style="width: ${completion}%; height: 100%; background: linear-gradient(90deg, #2D5F3F 0%, #244C32 100%); border-radius: 6px; transition: width 0.3s ease;"></div>
                  </div>
                </div>
                <div style="padding-top: 16px; border-top: 1px solid #C3DFD3;">
                  <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Current Step:</div>
                  <div style="color: #0f172a; font-size: 16px; font-weight: 600;">${currentStepName}</div>
                  <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Step ${currentStep + 1} of ${totalSteps}</div>
                </div>
              </div>
        
              <!-- Why Complete Card -->
              <div style="background: linear-gradient(135deg, #FEF5F3 0%, #FDEBE7 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #FBD7CF; box-shadow: 0 1px 3px rgba(201, 74, 58, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #C94A3A 0%, #A13B2E 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Why Complete Your Estimate?
                  </h3>
                </div>
                <ul style="color: #64748b; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px; list-style: none;">
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">✓</span>
                    Get a personalized solar estimate with accurate savings calculations
                  </li>
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">✓</span>
                    See your potential energy savings and environmental impact
                  </li>
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">✓</span>
                    Connect with a solar specialist who can answer your questions
                  </li>
                  <li style="padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">✓</span>
                    It only takes a few minutes to finish - your progress is saved!
                  </li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0 32px 0;">
                <a href="${continueUrl}" style="display: inline-block; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(45, 95, 63, 0.2); transition: transform 0.2s;">
                  Continue Your Estimate →
                </a>
              </div>
              
              <!-- Help Section -->
              <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius: 12px; padding: 24px; margin: 0 0 32px 0; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                  <strong style="color: #0f172a;">Need help?</strong> Reply to this email or contact us at 
                  <a href="mailto:info@solarcalculatorcanada.org" style="color: #2D5F3F; text-decoration: none; font-weight: 600;">info@solarcalculatorcanada.org</a>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                  © ${new Date().getFullYear()} Solar Calculator Canada. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Complete Your Solar ${programLabel} Estimate - You're ${completion}% Done!

Hi there,

We noticed you started a ${programLabel} ${flowType}${address ? ` for ${address}` : ''}, but didn't finish. You're already ${completion}% complete - just a few more steps to get your personalized solar estimate!

YOUR PROGRESS
Completion: ${completion}%
Current Step: ${currentStepName}
Step ${currentStep + 1} of ${totalSteps}

WHY COMPLETE YOUR ESTIMATE?
✓ Get a personalized solar estimate with accurate savings calculations
✓ See your potential energy savings and environmental impact
✓ Connect with a solar specialist who can answer your questions
✓ It only takes a few minutes to finish - your progress is saved!

Continue Your Estimate: ${continueUrl}

Need help? Reply to this email or contact us at info@solarcalculatorcanada.org

© ${new Date().getFullYear()} Solar Calculator Canada. All rights reserved.
    `.trim(),
  }
}

// Helper function to send follow-up email
async function sendFollowUpEmail(
  emailContent: { subject: string; html: string; text: string },
  email: string,
  partialLeadId: string
) {
  const resend = createResendClient()
  const internalEmail = process.env.CONTACT_EMAIL || 'info@solarcalculatorcanada.org'

  const { error: resendError } = await resend.emails.send({
    from: 'Solar Calculator Canada <info@solarcalculatorcanada.org>',
    to: email,
    bcc: internalEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  })

  if (resendError) {
    console.error('❌ Follow-up email send error via Resend:', resendError)
    throw new Error('Failed to send email')
  }

  return { success: true }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { partialLeadId } = body

    // Validate required fields
    if (!partialLeadId) {
      return NextResponse.json(
        { error: 'Missing required field: partialLeadId' },
        { status: 400 }
      )
    }

    // Fetch partial lead from database
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: partialLead, error } = await supabase
      .from('partial_leads_v3')
      .select('*')
      .eq('id', partialLeadId)
      .single()

    if (error || !partialLead) {
      return NextResponse.json(
        { error: 'Partial lead not found' },
        { status: 404 }
      )
    }

    // Validate email exists
    const email = partialLead.email || body.email
    if (!email) {
      return NextResponse.json(
        { error: 'Email address not found for partial lead' },
        { status: 400 }
      )
    }

    // Generate email template
    const emailContent = generateFollowUpEmailTemplate(partialLead, partialLeadId)

    // Send email
    await sendFollowUpEmail(emailContent, email, partialLeadId)

    return NextResponse.json({
      success: true,
      message: 'Follow-up email sent successfully',
    })

  } catch (error) {
    console.error('Follow-up email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

