// Contact form API endpoint for sending emails via Resend
//
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Subject mapping for better email organization
const SUBJECT_MAP: Record<string, string> = {
  'calculator-question': 'Calculator Question',
  'installer-inquiry': 'Installer Inquiry',
  'general-question': 'General Question',
  'technical-support': 'Technical Support',
  feedback: 'Feedback',
}

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.')
  }

  return new Resend(apiKey)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      )
    }

    // Get recipient email (default to info@solarcalculatorcanada.org)
    const recipientEmail = process.env.CONTACT_EMAIL || 'info@solarcalculatorcanada.org'

    // Create Resend client
    const resend = createResendClient()

    // Format subject
    const emailSubject = SUBJECT_MAP[subject] || subject || 'Contact Form Submission'

    // Format email body
    const emailBody = `
New contact form submission from ${name}

Email: ${email}
Subject: ${emailSubject}

Message:
${message}

---
This email was sent from the contact form on ${process.env.NEXT_PUBLIC_APP_URL || 'solarcalculatorcanada.org'}
    `.trim()

    // Send email via Resend
    const { error: resendError } = await resend.emails.send({
      from: 'Solar Calculator Canada <info@solarcalculatorcanada.org>',
      replyTo: email,
      to: recipientEmail,
      subject: `[Contact Form] ${emailSubject}`,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${emailSubject}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #2c5530; margin: 20px 0;">
            <p style="white-space: pre-wrap; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This email was sent from the contact form on ${process.env.NEXT_PUBLIC_APP_URL || 'solarcalculatorcanada.org'}</p>
          </div>
        </div>
      `,
    })

    if (resendError) {
      console.error('Error sending contact email via Resend:', resendError)
      return NextResponse.json(
        {
          error: 'Failed to send message. Please try again later or contact us directly.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    })
  } catch (error) {
    console.error('Error sending contact email:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to send email'

    return NextResponse.json(
      {
        error: 'Failed to send message. Please try again later or contact us directly.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    )
  }
}


