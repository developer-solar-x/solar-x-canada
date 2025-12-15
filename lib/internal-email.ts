import { Resend } from 'resend'

function createResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error(
      'Resend API key not configured. Please set RESEND_API_KEY environment variable. Internal notification email will be skipped.'
    )
    return null
  }

  return new Resend(apiKey)
}

export interface InternalEmailOptions {
  subject: string
  html?: string
  text?: string
}

/**
 * Send an internal notification email to the Solar Calculator Canada team.
 * Uses CONTACT_EMAIL if set, otherwise falls back to info@solarcalculatorcanada.org.
 */
export async function sendInternalNotificationEmail(options: InternalEmailOptions) {
  const resend = createResendClient()
  if (!resend) {
    // Already logged; fail silently so we don't break API routes in dev
    return
  }
  const internalEmail = process.env.CONTACT_EMAIL || 'info@solarcalculatorcanada.org'

  const { subject, html, text } = options

  await resend.emails.send({
    from: 'Solar Calculator Canada <info@solarcalculatorcanada.org>',
    to: internalEmail,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  })
}

