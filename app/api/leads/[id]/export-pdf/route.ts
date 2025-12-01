// PDF export API endpoint - generates a simple text-based PDF summary

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { BATTERY_SPECS } from '@/config/battery-specs'

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

  // Helper function to get add-on display name
  const getAddOnName = (addOnId: string): string => {
    const names: Record<string, string> = {
      'ev_charger': 'EV Charger',
      'heat_pump': 'Heat Pump',
      'new_roof': 'New Roof',
      'water_heater': 'Water Heater',
      'battery': 'Battery Storage'
    }
    return names[addOnId] || addOnId.replace(/_/g, ' ')
  }

  // Extract program type first (needed for cost calculations)
  // Check multiple sources for program type - same as results page
  const programType = lead.program_type ?? 
                      lead.programType ?? 
                      fullDataJson?.programType ?? 
                      fullDataJson?.program_type ?? 
                      null
  const isNetMetering = programType === 'net_metering'

  // Extract cost values - match ResultsPage logic exactly
  // Get combined total cost (solar + battery)
  const combinedTotalCost = fullDataJson?.combinedTotalCost ?? 
                            (() => {
                              const fromCosts = (fullDataJson?.costs?.systemCost ?? 0) + (fullDataJson?.costs?.batteryCost ?? 0)
                              if (fromCosts > 0) return fromCosts
                              const fromLead = (lead.system_cost ?? 0) + (lead.battery_cost ?? 0)
                              return fromLead > 0 ? fromLead : 0
                            })()
  
  // Solar cost: prefer totalCost, then systemCost, then fallback
  const finalTotalCost = fullDataJson?.costs?.totalCost ?? fullDataJson?.estimate?.costs?.totalCost ?? lead.system_cost ?? 0
  const solarSystemCost = fullDataJson?.estimate?.costs?.totalCost ?? fullDataJson?.estimate?.costs?.systemCost ?? fullDataJson?.costs?.systemCost ?? lead.system_cost ?? finalTotalCost ?? 0
  
  // Battery cost: try multiple sources
  // 1. Explicit battery price from batteryDetails
  // 2. Battery cost from costs
  // 3. Lead battery_cost field
  // 4. Calculate from selected battery IDs
  // 5. Infer from combined total
  let explicitBatteryPrice = fullDataJson?.batteryDetails?.battery?.price ?? 
                            fullDataJson?.costs?.batteryCost ?? 
                            lead.battery_cost ?? 0
  
  // If no explicit price, try to calculate from selected battery IDs
  if (!explicitBatteryPrice) {
    const selectedBatteryIds: string[] = Array.isArray(fullDataJson?.selectedBatteryIds) && fullDataJson.selectedBatteryIds.length > 0
      ? fullDataJson.selectedBatteryIds
      : Array.isArray(fullDataJson?.selectedBatteries) && fullDataJson.selectedBatteries.length > 0
      ? fullDataJson.selectedBatteries
      : fullDataJson?.selectedBattery && typeof fullDataJson.selectedBattery === 'string'
      ? [fullDataJson.selectedBattery]
      : []
    
    if (selectedBatteryIds.length > 0) {
      explicitBatteryPrice = selectedBatteryIds
        .map(id => BATTERY_SPECS.find(b => b.id === id))
        .filter(Boolean)
        .reduce((sum, battery) => sum + (battery?.price || 0), 0)
    }
  }
  
  // Infer from combined total if still no price
  const inferredBatteryCost = combinedTotalCost > solarSystemCost ? combinedTotalCost - solarSystemCost : 0
  const batterySystemCost = explicitBatteryPrice > 0 ? explicitBatteryPrice : inferredBatteryCost
  
  const totalSystemCost = solarSystemCost + (batterySystemCost || 0)
  
  // Get battery name(s) for display - match results page extraction logic
  const getBatteryName = (): string | null => {
    // Priority 1: batteryDetails from simplified data (same as results page)
    if (fullDataJson?.batteryDetails?.battery) {
      const battery = fullDataJson.batteryDetails.battery
      // Try brand + model first
      if (battery.brand && battery.model) {
        return `${battery.brand} ${battery.model}`
      }
      // Try name field
      if (battery.name) {
        return battery.name
      }
      // Try just brand
      if (battery.brand) {
        return battery.brand
      }
    }
    
    // Priority 2: selectedBatteryIds from simplified data (same as results page)
    const selectedBatteryIds: string[] = Array.isArray(fullDataJson?.selectedBatteryIds) && fullDataJson.selectedBatteryIds.length > 0
      ? fullDataJson.selectedBatteryIds
      : Array.isArray(fullDataJson?.selectedBatteries) && fullDataJson.selectedBatteries.length > 0
      ? fullDataJson.selectedBatteries
      : fullDataJson?.selectedBattery && typeof fullDataJson.selectedBattery === 'string'
      ? [fullDataJson.selectedBattery]
      : fullDataJson?.peakShaving?.selectedBattery && typeof fullDataJson.peakShaving.selectedBattery === 'string'
      ? fullDataJson.peakShaving.selectedBattery.split(',').map((id: string) => id.trim())
      : []
    
    if (selectedBatteryIds.length > 0) {
      const batteryNames = selectedBatteryIds
        .map(id => {
          const battery = BATTERY_SPECS.find(b => b.id === id)
          return battery ? `${battery.brand} ${battery.model}` : null
        })
        .filter(Boolean)
      
      if (batteryNames.length > 0) {
        return batteryNames.join(', ')
      }
    }
    
    // Priority 3: Try from lead table
    if (lead.selected_battery_ids && Array.isArray(lead.selected_battery_ids) && lead.selected_battery_ids.length > 0) {
      const batteryNames = lead.selected_battery_ids
        .map((id: string) => {
          const battery = BATTERY_SPECS.find(b => b.id === id)
          return battery ? `${battery.brand} ${battery.model}` : null
        })
        .filter(Boolean)
      
      if (batteryNames.length > 0) {
        return batteryNames.join(', ')
      }
    }
    
    return null
  }
  
  const batteryName = getBatteryName()
  
  // Rebates - net metering has NO rebates
  const solarRebateAmount = isNetMetering ? 0 : (lead.solar_rebate ?? fullDataJson?.costs?.solarRebate ?? fullDataJson?.estimate?.costs?.solarRebate ?? fullDataJson?.estimate?.costs?.incentives ?? 0)
  const batteryRebateAmount = isNetMetering ? 0 : (lead.battery_rebate ?? fullDataJson?.costs?.batteryRebate ?? fullDataJson?.estimate?.costs?.batteryRebate ?? 0)
  const totalRebates = solarRebateAmount + batteryRebateAmount
  
  // Net cost - for net metering, equals total system cost (no rebates)
  const finalNetCost = isNetMetering 
    ? totalSystemCost
    : (lead.net_cost ?? fullDataJson?.costs?.netCost ?? fullDataJson?.estimate?.costs?.netCost ?? (totalSystemCost - totalRebates))
  const hasBattery = batterySystemCost > 0 || fullDataJson?.hasBattery || fullDataJson?.selectedBattery || fullDataJson?.selectedBatteries || (Array.isArray(fullDataJson?.selectedBatteryIds) && fullDataJson.selectedBatteryIds.length > 0)
  
  // Determine system type label - be more explicit about detection
  let systemTypeLabel = ''
  if (programType === 'net_metering') {
    systemTypeLabel = 'Net Metering Program'
  } else if (programType === 'hrs_residential' || programType === 'quick') {
    if (hasBattery || batterySystemCost > 0 || batteryName) {
      systemTypeLabel = 'Solar + Battery HRS Program'
    } else {
      systemTypeLabel = 'Solar HRS Program'
    }
  } else if (hasBattery || batterySystemCost > 0 || batteryName) {
    systemTypeLabel = 'Solar + Battery System'
  } else if (programType) {
    // If we have a program type but it's not one of the above, create a label
    systemTypeLabel = programType === 'hrs_residential' ? 'HRS Residential Program' :
                      programType === 'net_metering' ? 'Net Metering Program' :
                      programType === 'quick' ? 'Quick Estimate' :
                      'Solar System'
  } else {
    // Default fallback
    systemTypeLabel = hasBattery || batterySystemCost > 0 || batteryName ? 'Solar + Battery System' : 'Solar System'
  }

  // Extract add-ons
  const selectedAddOns = fullDataJson?.selectedAddOns ?? fullDataJson?.selected_add_ons ?? lead.selected_add_ons ?? []

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
  // Always show program type - prioritize systemTypeLabel, then programType, then infer from context
  let displayProgramType = systemTypeLabel
  if (!displayProgramType && programType) {
    // Create label from programType
    displayProgramType = programType === 'hrs_residential' ? 'HRS Residential Program' : 
                        programType === 'net_metering' ? 'Net Metering Program' : 
                        programType === 'quick' ? 'Quick Estimate' : 
                        programType === 'hrs' ? 'HRS Program' :
                        'Solar System'
    // Add battery suffix if applicable
    if ((hasBattery || batterySystemCost > 0 || batteryName) && programType !== 'net_metering') {
      if (displayProgramType.includes('HRS')) {
        displayProgramType = displayProgramType.replace('HRS Program', 'Solar + Battery HRS Program').replace('HRS Residential Program', 'Solar + Battery HRS Program')
      } else if (!displayProgramType.includes('Battery')) {
        displayProgramType = 'Solar + Battery ' + displayProgramType
      }
    }
  } else if (!displayProgramType && (hasBattery || batterySystemCost > 0 || batteryName)) {
    // If no program type but we have a battery, show "Solar + Battery System"
    displayProgramType = 'Solar + Battery System'
  } else if (!displayProgramType) {
    // Last resort default
    displayProgramType = 'Solar System'
  }
  
  // Always show program type
  if (displayProgramType) {
    addText(`Program Type: ${displayProgramType}`, 11, true)
  }
  if (lead.system_size_kw) addText(`System Size: ${parseFloat(String(lead.system_size_kw))} kW`, 11)
  if (lead.num_panels) addText(`Number of Panels: ${parseInt(String(lead.num_panels))}`, 11)
  if (lead.production_annual_kwh) {
    addText(`Annual Production: ${parseFloat(String(lead.production_annual_kwh)).toLocaleString()} kWh`, 11)
  }
  // Show battery name if it exists, regardless of cost (cost might be in different field)
  // Always show battery if hasBattery is true or batterySystemCost > 0
  if (batteryName) {
    addText(`Battery: ${batteryName}`, 11)
  } else if (hasBattery || batterySystemCost > 0) {
    // If we have a battery but no name, try to get it from other sources
    const fallbackBatteryName = fullDataJson?.batteryDetails?.battery?.name || 
                                 fullDataJson?.selectedBatteryName ||
                                 (lead.selected_battery_ids && Array.isArray(lead.selected_battery_ids) && lead.selected_battery_ids.length > 0
                                   ? lead.selected_battery_ids.map((id: string) => {
                                       const battery = BATTERY_SPECS.find(b => b.id === id)
                                       return battery ? `${battery.brand} ${battery.model}` : null
                                     }).filter(Boolean).join(', ')
                                   : null) ||
                                 (fullDataJson?.selectedBatteryIds && fullDataJson.selectedBatteryIds.length > 0 
                                   ? fullDataJson.selectedBatteryIds.map((id: string) => {
                                       const battery = BATTERY_SPECS.find(b => b.id === id)
                                       return battery ? `${battery.brand} ${battery.model}` : null
                                     }).filter(Boolean).join(', ')
                                   : null)
    if (fallbackBatteryName) {
      addText(`Battery: ${fallbackBatteryName}`, 11)
    } else {
      // Last resort: show battery info if we know there's a battery
      if (batterySystemCost > 0) {
        addText(`Battery: Included ($${parseFloat(String(batterySystemCost)).toLocaleString()})`, 11)
      } else {
        addText(`Battery: Battery Included`, 11)
      }
    }
  }
  yPosition += 5

  // Cost Breakdown - match ResultsPage format exactly
  addText('COST BREAKDOWN', 14, true)
  if (solarSystemCost > 0) addText(`Solar System Cost: $${parseFloat(String(solarSystemCost)).toLocaleString()}`, 11)
  if (batterySystemCost > 0) addText(`Battery Cost: $${parseFloat(String(batterySystemCost)).toLocaleString()}`, 11)
  if (totalSystemCost > 0) addText(`Total System Cost: $${parseFloat(String(totalSystemCost)).toLocaleString()}`, 11, true)
  
  // Only show rebates for non-net-metering programs
  if (!isNetMetering) {
    if (solarRebateAmount > 0) addText(`Solar Rebates: -$${parseFloat(String(solarRebateAmount)).toLocaleString()}`, 11)
    if (batteryRebateAmount > 0) addText(`Battery Rebates: -$${parseFloat(String(batteryRebateAmount)).toLocaleString()}`, 11)
    if (totalRebates > 0) addText(`Total Rebates: -$${parseFloat(String(totalRebates)).toLocaleString()}`, 11, true)
  }
  
  // Your Net Investment (always shown)
  if (finalNetCost > 0) {
    addText('', 0) // Small spacing
    addText(`Your Net Investment: $${parseFloat(String(finalNetCost)).toLocaleString()}`, 12, true)
  }
  yPosition += 5

  // Add-ons
  if (Array.isArray(selectedAddOns) && selectedAddOns.length > 0) {
    addText('SELECTED ADD-ONS', 14, true)
    selectedAddOns.forEach((addOnId: string) => {
      addText(`• ${getAddOnName(addOnId)}`, 11)
    })
    yPosition += 5
  }

  // Net Metering Results (if program is net metering)
  if (isNetMetering && fullDataJson?.netMetering) {
    const netMetering = fullDataJson.netMetering
    
    // TOU Plan Net Metering Results
    if (netMetering.tou?.annual) {
      const tou = netMetering.tou.annual
      addText('TIME-OF-USE (TOU) PLAN', 14, true)
      if (tou.totalLoad) {
        // Calculate current bill estimate (load * average rate)
        const avgRate = 0.12 // Approximate average TOU rate
        const currentBill = (tou.totalLoad * avgRate).toFixed(2)
        addText(`Current Annual Bill (Estimate): $${currentBill}`, 11)
      }
      if (tou.netAnnualBill !== undefined) {
        const netBill = parseFloat(String(tou.netAnnualBill))
        addText(`Net Annual Bill: $${netBill.toFixed(2)}`, 11)
        if (tou.totalLoad && tou.totalLoad > 0) {
          const savings = (tou.totalLoad * 0.12) - netBill // Approximate savings
          if (savings > 0) {
            addText(`Annual Savings: $${savings.toFixed(2)}`, 11, true)
            addText(`Monthly Savings: $${(savings / 12).toFixed(2)}`, 11)
          }
        }
      }
      if (tou.exportCredits) {
        addText(`Export Credits: $${parseFloat(String(tou.exportCredits)).toFixed(2)}`, 11)
      }
      if (tou.importCost) {
        addText(`Import Cost: $${parseFloat(String(tou.importCost)).toFixed(2)}`, 11)
      }
      if (tou.billOffsetPercent !== undefined) {
        addText(`Bill Offset: ${parseFloat(String(tou.billOffsetPercent)).toFixed(1)}%`, 11)
      }
      yPosition += 5
    }
    
    // ULO Plan Net Metering Results
    if (netMetering.ulo?.annual) {
      const ulo = netMetering.ulo.annual
      addText('ULTRA-LOW OVERNIGHT (ULO) PLAN', 14, true)
      if (ulo.totalLoad) {
        // Calculate current bill estimate (load * average rate)
        const avgRate = 0.10 // Approximate average ULO rate
        const currentBill = (ulo.totalLoad * avgRate).toFixed(2)
        addText(`Current Annual Bill (Estimate): $${currentBill}`, 11)
      }
      if (ulo.netAnnualBill !== undefined) {
        const netBill = parseFloat(String(ulo.netAnnualBill))
        addText(`Net Annual Bill: $${netBill.toFixed(2)}`, 11)
        if (ulo.totalLoad && ulo.totalLoad > 0) {
          const savings = (ulo.totalLoad * 0.10) - netBill // Approximate savings
          if (savings > 0) {
            addText(`Annual Savings: $${savings.toFixed(2)}`, 11, true)
            addText(`Monthly Savings: $${(savings / 12).toFixed(2)}`, 11)
          }
        }
      }
      if (ulo.exportCredits) {
        addText(`Export Credits: $${parseFloat(String(ulo.exportCredits)).toFixed(2)}`, 11)
      }
      if (ulo.importCost) {
        addText(`Import Cost: $${parseFloat(String(ulo.importCost)).toFixed(2)}`, 11)
      }
      if (ulo.billOffsetPercent !== undefined) {
        addText(`Bill Offset: ${parseFloat(String(ulo.billOffsetPercent)).toFixed(1)}%`, 11)
      }
      yPosition += 5
    }
    
    // Tiered Plan Net Metering Results
    if (netMetering.tiered?.annual) {
      const tiered = netMetering.tiered.annual
      addText('TIERED PLAN', 14, true)
      if (tiered.totalLoad) {
        // Calculate current bill estimate (load * average rate)
        const avgRate = 0.11 // Approximate average tiered rate
        const currentBill = (tiered.totalLoad * avgRate).toFixed(2)
        addText(`Current Annual Bill (Estimate): $${currentBill}`, 11)
      }
      if (tiered.netAnnualBill !== undefined) {
        const netBill = parseFloat(String(tiered.netAnnualBill))
        addText(`Net Annual Bill: $${netBill.toFixed(2)}`, 11)
        if (tiered.totalLoad && tiered.totalLoad > 0) {
          const savings = (tiered.totalLoad * 0.11) - netBill // Approximate savings
          if (savings > 0) {
            addText(`Annual Savings: $${savings.toFixed(2)}`, 11, true)
            addText(`Monthly Savings: $${(savings / 12).toFixed(2)}`, 11)
          }
        }
      }
      if (tiered.exportCredits) {
        addText(`Export Credits: $${parseFloat(String(tiered.exportCredits)).toFixed(2)}`, 11)
      }
      if (tiered.importCost) {
        addText(`Import Cost: $${parseFloat(String(tiered.importCost)).toFixed(2)}`, 11)
      }
      if (tiered.billOffsetPercent !== undefined) {
        addText(`Bill Offset: ${parseFloat(String(tiered.billOffsetPercent)).toFixed(1)}%`, 11)
      }
      yPosition += 5
    }
  } else {
    // Regular HRS Plan Savings (non-net-metering)
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
  addText(`View your results online: https://www.solarcalculatorcanada.org/track/${leadId}`, 11)

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
