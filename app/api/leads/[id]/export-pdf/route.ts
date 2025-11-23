// PDF export API endpoint - generates a simple text-based PDF summary

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
    
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Fetch lead data
    const { data: lead, error } = await supabase
      .from('hrs_residential_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (error || !lead) {
      // Try alternative table
      const { data: altLead, error: altError } = await supabase
        .from('leads_v3')
        .select('*')
        .eq('id', leadId)
        .single()
      
      if (altError || !altLead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      
      return generatePDF(altLead, leadId)
    }

    return generatePDF(lead, leadId)
  } catch (error: any) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}

async function generatePDF(lead: any, leadId: string) {
  // Import jsPDF
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF()
  let yPosition = 20
  const lineHeight = 7
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - (margin * 2)

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, margin, yPosition)
    yPosition += lines.length * (fontSize * 0.4) + lineHeight
  }

  // Parse full_data_json if it's a string
  let fullDataJson = lead.full_data_json
  if (typeof fullDataJson === 'string') {
    try {
      fullDataJson = JSON.parse(fullDataJson)
    } catch (e) {
      fullDataJson = {}
    }
  }

  // Title
  addText('Solar Savings Estimate Summary', 18, true)
  yPosition += 5

  // Property Information
  addText('PROPERTY INFORMATION', 14, true)
  if (lead.address) addText(`Address: ${lead.address}`, 11)
  if (lead.city) addText(`City: ${lead.city}`, 11)
  if (lead.province) addText(`Province: ${lead.province}`, 11)
  yPosition += 5

  // System Details
  addText('SYSTEM DETAILS', 14, true)
  if (lead.system_size_kw) addText(`System Size: ${parseFloat(String(lead.system_size_kw))} kW`, 11)
  if (lead.num_panels) addText(`Number of Panels: ${parseInt(String(lead.num_panels))}`, 11)
  if (lead.production_annual_kwh) {
    addText(`Annual Production: ${parseFloat(String(lead.production_annual_kwh)).toLocaleString()} kWh`, 11)
  }
  yPosition += 5

  // Cost Breakdown
  addText('COST BREAKDOWN', 14, true)
  if (lead.system_cost) addText(`System Cost: $${parseFloat(String(lead.system_cost)).toLocaleString()}`, 11)
  if (lead.battery_cost) addText(`Battery Cost: $${parseFloat(String(lead.battery_cost)).toLocaleString()}`, 11)
  if (lead.solar_rebate) addText(`Solar Rebate: $${parseFloat(String(lead.solar_rebate)).toLocaleString()}`, 11)
  if (lead.battery_rebate) addText(`Battery Rebate: $${parseFloat(String(lead.battery_rebate)).toLocaleString()}`, 11)
  if (lead.net_cost) addText(`Net Cost After Incentives: $${parseFloat(String(lead.net_cost)).toLocaleString()}`, 11, true)
  yPosition += 5

  // TOU Plan Savings
  if (lead.tou_annual_savings || lead.tou_before_solar) {
    addText('TIME-OF-USE (TOU) PLAN', 14, true)
    if (lead.tou_before_solar) addText(`Current Annual Bill: $${parseFloat(String(lead.tou_before_solar)).toFixed(2)}`, 11)
    if (lead.tou_after_solar) addText(`With Solar + Battery: $${parseFloat(String(lead.tou_after_solar)).toFixed(2)}`, 11)
    if (lead.tou_annual_savings) {
      const touAnnual = parseFloat(String(lead.tou_annual_savings))
      addText(`Annual Savings: $${touAnnual.toFixed(2)}`, 11, true)
      addText(`Monthly Savings: $${(touAnnual / 12).toFixed(2)}`, 11)
    }
    if (lead.tou_total_bill_savings_percent) {
      addText(`Total Bill Savings: ${parseFloat(String(lead.tou_total_bill_savings_percent)).toFixed(1)}%`, 11)
    }
    if (lead.tou_payback_period) {
      addText(`Payback Period: ${parseFloat(String(lead.tou_payback_period))} years`, 11)
    }
    if (lead.tou_profit_25_year) {
      addText(`25-Year Profit: $${parseFloat(String(lead.tou_profit_25_year)).toLocaleString()}`, 11)
    }
    if (lead.tou_total_offset) {
      addText(`Energy Offset: ${parseFloat(String(lead.tou_total_offset)).toFixed(1)}%`, 11)
    }
    yPosition += 5
  }

  // ULO Plan Savings
  if (lead.ulo_annual_savings || lead.ulo_before_solar) {
    addText('ULTRA-LOW OVERNIGHT (ULO) PLAN', 14, true)
    if (lead.ulo_before_solar) addText(`Current Annual Bill: $${parseFloat(String(lead.ulo_before_solar)).toFixed(2)}`, 11)
    if (lead.ulo_after_solar) addText(`With Solar + Battery: $${parseFloat(String(lead.ulo_after_solar)).toFixed(2)}`, 11)
    if (lead.ulo_annual_savings) {
      const uloAnnual = parseFloat(String(lead.ulo_annual_savings))
      addText(`Annual Savings: $${uloAnnual.toFixed(2)}`, 11, true)
      addText(`Monthly Savings: $${(uloAnnual / 12).toFixed(2)}`, 11)
    }
    if (lead.ulo_total_bill_savings_percent) {
      addText(`Total Bill Savings: ${parseFloat(String(lead.ulo_total_bill_savings_percent)).toFixed(1)}%`, 11)
    }
    if (lead.ulo_payback_period) {
      addText(`Payback Period: ${parseFloat(String(lead.ulo_payback_period))} years`, 11)
    }
    if (lead.ulo_profit_25_year) {
      addText(`25-Year Profit: $${parseFloat(String(lead.ulo_profit_25_year)).toLocaleString()}`, 11)
    }
    if (lead.ulo_total_offset) {
      addText(`Energy Offset: ${parseFloat(String(lead.ulo_total_offset)).toFixed(1)}%`, 11)
    }
    yPosition += 5
  }

  // Environmental Impact
  if (lead.co2_offset_tons_per_year) {
    addText('ENVIRONMENTAL IMPACT', 14, true)
    addText(`CO₂ Offset: ${parseFloat(String(lead.co2_offset_tons_per_year)).toFixed(2)} tons per year`, 11)
    if (lead.trees_equivalent) {
      addText(`Equivalent to planting ${parseInt(String(lead.trees_equivalent))} trees`, 11)
    }
    if (lead.cars_off_road_equivalent) {
      addText(`Equivalent to taking ${parseFloat(String(lead.cars_off_road_equivalent)).toFixed(1)} cars off the road`, 11)
    }
    yPosition += 5
  }

  // Contact Information
  if (lead.full_name || lead.email || lead.phone) {
    addText('CONTACT INFORMATION', 14, true)
    if (lead.full_name) addText(`Name: ${lead.full_name}`, 11)
    if (lead.email) addText(`Email: ${lead.email}`, 11)
    if (lead.phone) addText(`Phone: ${lead.phone}`, 11)
  }

  // Tracking Link
  yPosition += 5
  addText('TRACK YOUR ESTIMATE', 14, true)
  addText(`View your results online: https://solarclaculatorcanada.org/track/${leadId}`, 11)

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    )
  }

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  // Return PDF as response
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="solar-estimate-${leadId}.pdf"`,
    },
  })
}
