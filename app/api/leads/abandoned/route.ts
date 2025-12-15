import { NextResponse } from 'next/server'
import { sendInternalNotificationEmail } from '@/lib/internal-email'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      email,
      address,
      province,
      city,
      programType,
      estimatorMode,
      systemSizeKw,
      numPanels,
      monthlyBill,
      annualUsageKwh,
    } = body || {}

    const subject = `Abandoned Estimate: ${programType || 'unknown program'} / ${
      estimatorMode || 'unknown mode'
    }`

    const textLines: string[] = []
    textLines.push('A user viewed results but did not submit the lead form.')
    textLines.push('')
    if (email) textLines.push(`Email (if captured earlier): ${email}`)
    if (address) textLines.push(`Address: ${address}`)
    if (city || province) {
      textLines.push(`City/Province: ${city || 'N/A'}, ${province || 'N/A'}`)
    }
    if (systemSizeKw) textLines.push(`System size: ${systemSizeKw} kW`)
    if (numPanels) textLines.push(`Number of panels: ${numPanels}`)
    if (monthlyBill) textLines.push(`Monthly bill: ~$${Math.round(monthlyBill)}`)
    if (annualUsageKwh) {
      textLines.push(
        `Estimated annual usage: ~${Math.round(annualUsageKwh).toLocaleString()} kWh`
      )
    }

    // Best-effort: if email sending fails, swallow error so UI never breaks
    try {
      await sendInternalNotificationEmail({
        subject,
        text: textLines.join('\n'),
      })
    } catch (err) {
      console.error('Abandoned estimate internal email failed (non-fatal):', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Abandoned estimate handler error:', error)
    // Never block the client just because of internal tracking issues
    return NextResponse.json({ success: false }, { status: 200 })
  }
}


