// API route to send estimate email to customer
// This route sends a professional email with the solar estimate details using Resend
// Uses the same data extraction logic as the PDF export to ensure consistency

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { BATTERY_SPECS } from '@/config/battery-specs'

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.')
  }

  return new Resend(apiKey)
}

// Email template for the estimate
// Uses the same data extraction logic as the PDF export to ensure consistency
function generateEstimateEmailTemplate(lead: any, leadId: string) {
  // Parse full_data_json if it's a string
  let fullDataJson = lead.full_data_json
  if (typeof fullDataJson === 'string') {
    try {
      fullDataJson = JSON.parse(fullDataJson)
    } catch (e) {
      fullDataJson = {}
    }
  }

  const fullName = lead.full_name || ''
  const address = lead.address || ''
  const email = lead.email || ''
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-CA').format(Math.round(value))
  }
  
  // Extract program type first (needed for cost calculations) - same as PDF
  const programType = lead.program_type ?? 
                      lead.programType ?? 
                      fullDataJson?.programType ?? 
                      fullDataJson?.program_type ?? 
                      null
  const isNetMetering = programType === 'net_metering'

  // Extract cost values - match PDF logic exactly
  // Get combined total cost (solar + battery)
  const combinedTotalCost = fullDataJson?.combinedTotalCost ?? 
                            (() => {
                              const fromCosts = (fullDataJson?.costs?.systemCost ?? 0) + (fullDataJson?.costs?.batteryCost ?? 0)
                              if (fromCosts > 0) return fromCosts
                              const fromLead = (lead.system_cost ?? 0) + (lead.battery_cost ?? 0)
                              return fromLead > 0 ? fromLead : 0
                            })()
  
  // Solar cost: prefer totalCost, then systemCost, then fallback - same as PDF
  const finalTotalCost = fullDataJson?.costs?.totalCost ?? fullDataJson?.estimate?.costs?.totalCost ?? lead.system_cost ?? 0
  const solarSystemCost = fullDataJson?.estimate?.costs?.totalCost ?? fullDataJson?.estimate?.costs?.systemCost ?? fullDataJson?.costs?.systemCost ?? lead.system_cost ?? finalTotalCost ?? 0
  
  // Battery cost: try multiple sources - same as PDF
  let explicitBatteryPrice = fullDataJson?.batteryDetails?.battery?.price ?? 
                            fullDataJson?.costs?.batteryCost ?? 
                            lead.battery_cost ?? 0
  
  // If no explicit price, try to calculate from selected battery IDs - same as PDF
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
  
  // Infer from combined total if still no price - same as PDF
  const inferredBatteryCost = combinedTotalCost > solarSystemCost ? combinedTotalCost - solarSystemCost : 0
  const batterySystemCost = explicitBatteryPrice > 0 ? explicitBatteryPrice : inferredBatteryCost
  
  const totalSystemCost = solarSystemCost + (batterySystemCost || 0)
  
  // Get battery name(s) for display - same as PDF
  const getBatteryName = (): string | null => {
    if (fullDataJson?.batteryDetails?.battery) {
      const battery = fullDataJson.batteryDetails.battery
      if (battery.brand && battery.model) {
        return `${battery.brand} ${battery.model}`
      }
      if (battery.name) {
        return battery.name
      }
      if (battery.brand) {
        return battery.brand
      }
    }
    
    const selectedBatteryIds: string[] = Array.isArray(fullDataJson?.selectedBatteryIds) && fullDataJson.selectedBatteryIds.length > 0
      ? fullDataJson.selectedBatteryIds
      : Array.isArray(fullDataJson?.selectedBatteries) && fullDataJson.selectedBatteries.length > 0
      ? fullDataJson.selectedBatteries
      : fullDataJson?.selectedBattery && typeof fullDataJson.selectedBattery === 'string'
      ? [fullDataJson.selectedBattery]
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
  
  // Rebates - net metering has NO rebates - same as PDF
  const solarRebateAmount = isNetMetering ? 0 : (lead.solar_rebate ?? fullDataJson?.costs?.solarRebate ?? fullDataJson?.estimate?.costs?.solarRebate ?? fullDataJson?.estimate?.costs?.incentives ?? 0)
  const batteryRebateAmount = isNetMetering ? 0 : (lead.battery_rebate ?? fullDataJson?.costs?.batteryRebate ?? fullDataJson?.estimate?.costs?.batteryRebate ?? 0)
  const totalRebates = solarRebateAmount + batteryRebateAmount
  
  // Net cost - for net metering, equals total system cost (no rebates) - same as PDF
  const finalNetCost = isNetMetering 
    ? totalSystemCost
    : (lead.net_cost ?? fullDataJson?.costs?.netCost ?? fullDataJson?.estimate?.costs?.netCost ?? (totalSystemCost - totalRebates))
  const hasBattery = batterySystemCost > 0 || fullDataJson?.hasBattery || fullDataJson?.selectedBattery || fullDataJson?.selectedBatteries || (Array.isArray(fullDataJson?.selectedBatteryIds) && fullDataJson.selectedBatteryIds.length > 0)

  // Determine system type label - same as PDF
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
    systemTypeLabel = programType === 'hrs_residential' ? 'HRS Residential Program' :
                      programType === 'net_metering' ? 'Net Metering Program' :
                      programType === 'quick' ? 'Quick Estimate' :
                      'Solar System'
  } else {
    systemTypeLabel = hasBattery || batterySystemCost > 0 || batteryName ? 'Solar + Battery System' : 'Solar System'
  }

  // System details - same as PDF
  const systemSize = lead.system_size_kw ?? fullDataJson?.systemSizeKw ?? fullDataJson?.estimate?.system?.sizeKw ?? 0
  const numPanels = lead.num_panels ?? fullDataJson?.numPanels ?? fullDataJson?.estimate?.system?.numPanels ?? 0
  const annualProduction = lead.production_annual_kwh ?? fullDataJson?.production?.annualKwh ?? fullDataJson?.estimate?.production?.annualKwh ?? 0

  // Battery info for display
  const batteryBrand = fullDataJson?.batteryDetails?.battery?.brand || ''
  const batteryModel = fullDataJson?.batteryDetails?.battery?.model || ''
  const batteryKwh = fullDataJson?.batteryDetails?.battery?.usableKwh ?? fullDataJson?.batteryDetails?.battery?.nominalKwh ?? 0

  // Savings data from lead - same as PDF (for HRS programs)
  const touBeforeSolar = lead.tou_before_solar ?? 0
  const touAfterSolar = lead.tou_after_solar ?? 0
  const touAnnualSavings = lead.tou_annual_savings ?? 0
  const touMonthlySavings = touAnnualSavings > 0 ? touAnnualSavings / 12 : 0
  const touTotalBillSavingsPercent = lead.tou_total_bill_savings_percent ?? 0
  const touPayback = lead.tou_payback_period ?? 0
  const tou25YearProfit = lead.tou_profit_25_year ?? 0
  const touTotalOffset = lead.tou_total_offset ?? 0

  const uloBeforeSolar = lead.ulo_before_solar ?? 0
  const uloAfterSolar = lead.ulo_after_solar ?? 0
  const uloAnnualSavings = lead.ulo_annual_savings ?? 0
  const uloMonthlySavings = uloAnnualSavings > 0 ? uloAnnualSavings / 12 : 0
  const uloTotalBillSavingsPercent = lead.ulo_total_bill_savings_percent ?? 0
  const uloPayback = lead.ulo_payback_period ?? 0
  const ulo25YearProfit = lead.ulo_profit_25_year ?? 0
  const uloTotalOffset = lead.ulo_total_offset ?? 0

  const hasBothPlans = (touAnnualSavings > 0 || touBeforeSolar > 0) && (uloAnnualSavings > 0 || uloBeforeSolar > 0)

  // Environmental data - same as PDF
  const co2Offset = lead.co2_offset_tons_per_year ?? fullDataJson?.environmental?.co2OffsetTonsPerYear ?? fullDataJson?.estimate?.environmental?.co2OffsetTonsPerYear ?? 0
  const treesEquivalent = lead.trees_equivalent ?? fullDataJson?.environmental?.treesEquivalent ?? fullDataJson?.estimate?.environmental?.treesEquivalent ?? 0
  const carsOffRoad = lead.cars_off_road_equivalent ?? fullDataJson?.environmental?.carsOffRoadEquivalent ?? 0

  // Net metering data - same as PDF
  const netMetering = isNetMetering ? fullDataJson?.netMetering : null
  const touNetMetering = netMetering?.tou?.annual
  const uloNetMetering = netMetering?.ulo?.annual
  const tieredNetMetering = netMetering?.tiered?.annual

  // Selected add-ons - same as PDF
  const selectedAddOns = fullDataJson?.selectedAddOns ?? fullDataJson?.selected_add_ons ?? lead.selected_add_ons ?? []
  
  return {
    subject: `Your Solar Estimate - ${systemSize}kW System`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Solar Estimate</title>
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
                  Your Solar Estimate is Ready! ✨
                </h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 12px 0;">
                  Hi ${fullName},
                </p>
                <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0;">
                  Thank you for using our solar savings estimator! We've prepared a detailed solar estimate for${address ? ` <strong style="color: #1e293b;">${address}</strong>` : ' your property'}. Here's what we found:
                </p>
              </div>
        
              <!-- System Overview Card -->
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    System Overview
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${systemTypeLabel ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Program Type:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${systemTypeLabel}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">System Size:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${systemSize} kW (${numPanels} panels)
                    </td>
                  </tr>
                  ${hasBattery && batteryKwh > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Battery Storage:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${batteryBrand} ${batteryModel} (${batteryKwh} kWh)
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Annual Production:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px;">
                      ${formatNumber(annualProduction)} kWh/year
                    </td>
                  </tr>
                </table>
              </div>
        
              <!-- Financial Summary Card -->
              <div style="background: linear-gradient(135deg, #FEF5F3 0%, #FDEBE7 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #FBD7CF; box-shadow: 0 1px 3px rgba(201, 74, 58, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #C94A3A 0%, #A13B2E 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Financial Summary
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${solarSystemCost > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #FBD7CF;">Solar System Cost:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #FBD7CF;">
                      ${formatCurrency(solarSystemCost)}
                    </td>
                  </tr>
                  ` : ''}
                  ${hasBattery && batterySystemCost > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #FBD7CF;">Battery Cost:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #FBD7CF;">
                      ${formatCurrency(batterySystemCost)}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; font-weight: 600; border-bottom: 1px solid #FBD7CF;">Total System Cost:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 15px; border-bottom: 1px solid #FBD7CF;">
                      ${formatCurrency(totalSystemCost)}
                    </td>
                  </tr>
                  ${!isNetMetering && solarRebateAmount > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #FBD7CF;">Solar Rebates:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #FBD7CF;">
                      -${formatCurrency(solarRebateAmount)}
                    </td>
                  </tr>
                  ` : ''}
                  ${!isNetMetering && hasBattery && batteryRebateAmount > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #FBD7CF;">Battery Rebates:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #FBD7CF;">
                      -${formatCurrency(batteryRebateAmount)}
                    </td>
                  </tr>
                  ` : ''}
                  ${!isNetMetering && totalRebates > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; font-weight: 600; border-bottom: 1px solid #FBD7CF;">Total Rebates:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 700; font-size: 15px; border-bottom: 1px solid #FBD7CF;">
                      -${formatCurrency(totalRebates)}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 16px 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700; border-top: 2px solid #C94A3A;">
                      Your Net Investment:
                    </td>
                    <td style="padding: 16px 0 12px 0; text-align: right; color: #C94A3A; font-weight: 700; font-size: 22px; border-top: 2px solid #C94A3A;">
                      ${formatCurrency(finalNetCost)}
                    </td>
                  </tr>
                </table>
              </div>
        
              ${isNetMetering && netMetering ? `
              <!-- Net Metering Plans Card -->
              ${touNetMetering ? `
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    TIME-OF-USE (TOU) PLAN
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${touNetMetering.totalLoad ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Current Annual Bill (Estimate):</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency((touNetMetering.totalLoad * 0.12))}
                    </td>
                  </tr>
                  ` : ''}
                  ${touNetMetering.netAnnualBill !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Net Annual Bill:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(touNetMetering.netAnnualBill)))}
                    </td>
                  </tr>
                  ${touNetMetering.totalLoad && touNetMetering.totalLoad > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Annual Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency((touNetMetering.totalLoad * 0.12) - parseFloat(String(touNetMetering.netAnnualBill)))}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Monthly Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(((touNetMetering.totalLoad * 0.12) - parseFloat(String(touNetMetering.netAnnualBill))) / 12)}
                    </td>
                  </tr>
                  ` : ''}
                  ` : ''}
                  ${touNetMetering.exportCredits !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Export Credits:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(touNetMetering.exportCredits)))}
                    </td>
                  </tr>
                  ` : ''}
                  ${touNetMetering.importCost !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Import Cost:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(touNetMetering.importCost)))}
                    </td>
                  </tr>
                  ` : ''}
                  ${touNetMetering.billOffsetPercent !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Bill Offset:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px;">
                      ${parseFloat(String(touNetMetering.billOffsetPercent)).toFixed(1)}%
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              
              ${uloNetMetering ? `
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    ULTRA-LOW OVERNIGHT (ULO) PLAN
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${uloNetMetering.totalLoad ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Current Annual Bill (Estimate):</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency((uloNetMetering.totalLoad * 0.10))}
                    </td>
                  </tr>
                  ` : ''}
                  ${uloNetMetering.netAnnualBill !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Net Annual Bill:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(uloNetMetering.netAnnualBill)))}
                    </td>
                  </tr>
                  ${uloNetMetering.totalLoad && uloNetMetering.totalLoad > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Annual Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency((uloNetMetering.totalLoad * 0.10) - parseFloat(String(uloNetMetering.netAnnualBill)))}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Monthly Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(((uloNetMetering.totalLoad * 0.10) - parseFloat(String(uloNetMetering.netAnnualBill))) / 12)}
                    </td>
                  </tr>
                  ` : ''}
                  ` : ''}
                  ${uloNetMetering.exportCredits !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Export Credits:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(uloNetMetering.exportCredits)))}
                    </td>
                  </tr>
                  ` : ''}
                  ${uloNetMetering.importCost !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Import Cost:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(uloNetMetering.importCost)))}
                    </td>
                  </tr>
                  ` : ''}
                  ${uloNetMetering.billOffsetPercent !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Bill Offset:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px;">
                      ${parseFloat(String(uloNetMetering.billOffsetPercent)).toFixed(1)}%
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              
              ${tieredNetMetering ? `
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    TIERED PLAN
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${tieredNetMetering.totalLoad ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Current Annual Bill (Estimate):</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency((tieredNetMetering.totalLoad * 0.11))}
                    </td>
                  </tr>
                  ` : ''}
                  ${tieredNetMetering.netAnnualBill !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Net Annual Bill:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(tieredNetMetering.netAnnualBill)))}
                    </td>
                  </tr>
                  ${tieredNetMetering.totalLoad && tieredNetMetering.totalLoad > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Annual Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency((tieredNetMetering.totalLoad * 0.11) - parseFloat(String(tieredNetMetering.netAnnualBill)))}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Monthly Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(((tieredNetMetering.totalLoad * 0.11) - parseFloat(String(tieredNetMetering.netAnnualBill))) / 12)}
                    </td>
                  </tr>
                  ` : ''}
                  ` : ''}
                  ${tieredNetMetering.exportCredits !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Export Credits:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(tieredNetMetering.exportCredits)))}
                    </td>
                  </tr>
                  ` : ''}
                  ${tieredNetMetering.importCost !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Import Cost:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(parseFloat(String(tieredNetMetering.importCost)))}
                    </td>
                  </tr>
                  ` : ''}
                  ${tieredNetMetering.billOffsetPercent !== undefined ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Bill Offset:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px;">
                      ${parseFloat(String(tieredNetMetering.billOffsetPercent)).toFixed(1)}%
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              ` : `
              <!-- HRS Program Savings (Non-Net Metering) -->
              ${(touAnnualSavings > 0 || touBeforeSolar > 0) ? `
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    TIME-OF-USE (TOU) PLAN
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${touBeforeSolar > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Current Annual Bill:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(touBeforeSolar)}
                    </td>
                  </tr>
                  ` : ''}
                  ${touAfterSolar > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">With Solar + Battery:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(touAfterSolar)}
                    </td>
                  </tr>
                  ` : ''}
                  ${touAnnualSavings > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Annual Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(touAnnualSavings)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Monthly Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(touMonthlySavings)}
                    </td>
                  </tr>
                  ` : ''}
                  ${touTotalBillSavingsPercent > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Total Bill Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${touTotalBillSavingsPercent.toFixed(1)}%
                    </td>
                  </tr>
                  ` : ''}
                  ${touPayback > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Payback Period:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${touPayback.toFixed(1)} years
                    </td>
                  </tr>
                  ` : ''}
                  ${tou25YearProfit > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">25-Year Profit:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(tou25YearProfit)}
                    </td>
                  </tr>
                  ` : ''}
                  ${touTotalOffset > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Energy Offset:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px;">
                      ${touTotalOffset.toFixed(1)}%
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              
              ${(uloAnnualSavings > 0 || uloBeforeSolar > 0) ? `
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    ULTRA-LOW OVERNIGHT (ULO) PLAN
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${uloBeforeSolar > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Current Annual Bill:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(uloBeforeSolar)}
                    </td>
                  </tr>
                  ` : ''}
                  ${uloAfterSolar > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">With Solar + Battery:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(uloAfterSolar)}
                    </td>
                  </tr>
                  ` : ''}
                  ${uloAnnualSavings > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Annual Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(uloAnnualSavings)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Monthly Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(uloMonthlySavings)}
                    </td>
                  </tr>
                  ` : ''}
                  ${uloTotalBillSavingsPercent > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Total Bill Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${uloTotalBillSavingsPercent.toFixed(1)}%
                    </td>
                  </tr>
                  ` : ''}
                  ${uloPayback > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Payback Period:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${uloPayback.toFixed(1)} years
                    </td>
                  </tr>
                  ` : ''}
                  ${ulo25YearProfit > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">25-Year Profit:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatCurrency(ulo25YearProfit)}
                    </td>
                  </tr>
                  ` : ''}
                  ${uloTotalOffset > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Energy Offset:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px;">
                      ${uloTotalOffset.toFixed(1)}%
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              `}
        
              <!-- Environmental Impact Card -->
              ${co2Offset > 0 ? `
              <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E1EFE9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #C3DFD3; box-shadow: 0 1px 3px rgba(45, 95, 63, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Environmental Impact
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">CO₂ Offset:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${co2Offset.toFixed(1)} tons/year
                    </td>
                  </tr>
                  ${treesEquivalent > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #C3DFD3;">Equivalent to planting:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px; border-bottom: 1px solid #C3DFD3;">
                      ${formatNumber(treesEquivalent)} trees
                    </td>
                  </tr>
                  ` : ''}
                  ${carsOffRoad > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Equivalent to taking:</td>
                    <td style="padding: 12px 0; text-align: right; color: #2D5F3F; font-weight: 600; font-size: 15px;">
                      ${carsOffRoad.toFixed(1)} cars off the road
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              
              ${selectedAddOns.length > 0 ? `
              <!-- Selected Add-ons Card -->
              <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Selected Add-ons
                  </h3>
                </div>
                <ul style="color: #64748b; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px; list-style: none;">
                  ${selectedAddOns.map((addOnId: string) => {
                    const names: Record<string, string> = {
                      'ev_charger': 'EV Charger',
                      'heat_pump': 'Heat Pump',
                      'new_roof': 'New Roof',
                      'water_heater': 'Water Heater',
                      'battery': 'Battery Storage'
                    }
                    const addOnName = names[addOnId] || addOnId.replace(/_/g, ' ')
                    return `<li style="margin-bottom: 8px; padding-left: 24px; position: relative;">
                      <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">•</span>
                      ${addOnName}
                    </li>`
                  }).join('')}
                </ul>
              </div>
              ` : ''}
              
              <!-- Next Steps Card -->
              <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #2D5F3F 0%, #244C32 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    What Happens Next?
                  </h3>
                </div>
                <ul style="color: #64748b; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px; list-style: none;">
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">✓</span>
                    A solar specialist will contact you within 24 hours
                  </li>
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">✓</span>
                    We'll answer any questions and discuss your options
                  </li>
                  <li style="padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #2D5F3F; font-weight: 700;">✓</span>
                    Schedule a free site assessment if you'd like to proceed
                  </li>
                </ul>
              </div>
              
              <!-- Reference ID and Tracking Link -->
              <div style="text-align: center; margin: 40px 0 24px 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 12px 0; letter-spacing: 0.5px;">
                  Reference ID: <span style="color: #64748b; font-weight: 600;">${leadId}</span>
                </p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  <a href="https://www.solarcalculatorcanada.org/track/${leadId}" style="color: #2D5F3F; text-decoration: none; font-weight: 600;">View your results online →</a>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                  Questions? Reply to this email or contact us at 
                  <a href="mailto:info@solarcalculatorcanada.org" style="color: #2D5F3F; text-decoration: none; font-weight: 600;">info@solarcalculatorcanada.org</a>
                </p>
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
Your Solar Estimate

Hi ${fullName},

Thank you for using our solar savings estimator! We've prepared a detailed solar estimate for${address ? ` ${address}` : ' your property'}.

SYSTEM OVERVIEW
${systemTypeLabel ? `Program Type: ${systemTypeLabel}\n` : ''}
System Size: ${systemSize} kW (${numPanels} panels)
Annual Production: ${formatNumber(annualProduction)} kWh/year
${hasBattery && batteryKwh > 0 ? `Battery: ${batteryBrand} ${batteryModel} (${batteryKwh} kWh)\n` : ''}
FINANCIAL SUMMARY
Solar System Cost: ${formatCurrency(solarSystemCost)}
${hasBattery && batterySystemCost > 0 ? `Battery Cost: ${formatCurrency(batterySystemCost)}\n` : ''}
Total System Cost: ${formatCurrency(totalSystemCost)}
${!isNetMetering && solarRebateAmount > 0 ? `Solar Rebates: -${formatCurrency(solarRebateAmount)}\n` : ''}
${!isNetMetering && hasBattery && batteryRebateAmount > 0 ? `Battery Rebates: -${formatCurrency(batteryRebateAmount)}\n` : ''}
${!isNetMetering && totalRebates > 0 ? `Total Rebates: -${formatCurrency(totalRebates)}\n` : ''}
Your Net Investment: ${formatCurrency(finalNetCost)}

${isNetMetering && netMetering ? `
NET METERING RESULTS
${touNetMetering ? `
TIME-OF-USE (TOU) PLAN
${touNetMetering.totalLoad ? `Current Annual Bill (Estimate): ${formatCurrency((touNetMetering.totalLoad * 0.12))}\n` : ''}${touNetMetering.netAnnualBill !== undefined ? `Net Annual Bill: ${formatCurrency(parseFloat(String(touNetMetering.netAnnualBill)))}\n` : ''}${touNetMetering.totalLoad && touNetMetering.totalLoad > 0 ? `Annual Savings: ${formatCurrency((touNetMetering.totalLoad * 0.12) - parseFloat(String(touNetMetering.netAnnualBill)))}\nMonthly Savings: ${formatCurrency(((touNetMetering.totalLoad * 0.12) - parseFloat(String(touNetMetering.netAnnualBill))) / 12)}\n` : ''}${touNetMetering.exportCredits !== undefined ? `Export Credits: ${formatCurrency(parseFloat(String(touNetMetering.exportCredits)))}\n` : ''}${touNetMetering.importCost !== undefined ? `Import Cost: ${formatCurrency(parseFloat(String(touNetMetering.importCost)))}\n` : ''}${touNetMetering.billOffsetPercent !== undefined ? `Bill Offset: ${parseFloat(String(touNetMetering.billOffsetPercent)).toFixed(1)}%\n` : ''}
` : ''}
${uloNetMetering ? `
ULTRA-LOW OVERNIGHT (ULO) PLAN
${uloNetMetering.totalLoad ? `Current Annual Bill (Estimate): ${formatCurrency((uloNetMetering.totalLoad * 0.10))}\n` : ''}${uloNetMetering.netAnnualBill !== undefined ? `Net Annual Bill: ${formatCurrency(parseFloat(String(uloNetMetering.netAnnualBill)))}\n` : ''}${uloNetMetering.totalLoad && uloNetMetering.totalLoad > 0 ? `Annual Savings: ${formatCurrency((uloNetMetering.totalLoad * 0.10) - parseFloat(String(uloNetMetering.netAnnualBill)))}\nMonthly Savings: ${formatCurrency(((uloNetMetering.totalLoad * 0.10) - parseFloat(String(uloNetMetering.netAnnualBill))) / 12)}\n` : ''}${uloNetMetering.exportCredits !== undefined ? `Export Credits: ${formatCurrency(parseFloat(String(uloNetMetering.exportCredits)))}\n` : ''}${uloNetMetering.importCost !== undefined ? `Import Cost: ${formatCurrency(parseFloat(String(uloNetMetering.importCost)))}\n` : ''}${uloNetMetering.billOffsetPercent !== undefined ? `Bill Offset: ${parseFloat(String(uloNetMetering.billOffsetPercent)).toFixed(1)}%\n` : ''}
` : ''}
${tieredNetMetering ? `
TIERED PLAN
${tieredNetMetering.totalLoad ? `Current Annual Bill (Estimate): ${formatCurrency((tieredNetMetering.totalLoad * 0.11))}\n` : ''}${tieredNetMetering.netAnnualBill !== undefined ? `Net Annual Bill: ${formatCurrency(parseFloat(String(tieredNetMetering.netAnnualBill)))}\n` : ''}${tieredNetMetering.totalLoad && tieredNetMetering.totalLoad > 0 ? `Annual Savings: ${formatCurrency((tieredNetMetering.totalLoad * 0.11) - parseFloat(String(tieredNetMetering.netAnnualBill)))}\nMonthly Savings: ${formatCurrency(((tieredNetMetering.totalLoad * 0.11) - parseFloat(String(tieredNetMetering.netAnnualBill))) / 12)}\n` : ''}${tieredNetMetering.exportCredits !== undefined ? `Export Credits: ${formatCurrency(parseFloat(String(tieredNetMetering.exportCredits)))}\n` : ''}${tieredNetMetering.importCost !== undefined ? `Import Cost: ${formatCurrency(parseFloat(String(tieredNetMetering.importCost)))}\n` : ''}${tieredNetMetering.billOffsetPercent !== undefined ? `Bill Offset: ${parseFloat(String(tieredNetMetering.billOffsetPercent)).toFixed(1)}%\n` : ''}
` : ''}
` : `
${(touAnnualSavings > 0 || touBeforeSolar > 0) ? `
TIME-OF-USE (TOU) PLAN
${touBeforeSolar > 0 ? `Current Annual Bill: ${formatCurrency(touBeforeSolar)}\n` : ''}${touAfterSolar > 0 ? `With Solar + Battery: ${formatCurrency(touAfterSolar)}\n` : ''}${touAnnualSavings > 0 ? `Annual Savings: ${formatCurrency(touAnnualSavings)}\nMonthly Savings: ${formatCurrency(touMonthlySavings)}\n` : ''}${touTotalBillSavingsPercent > 0 ? `Total Bill Savings: ${touTotalBillSavingsPercent.toFixed(1)}%\n` : ''}${touPayback > 0 ? `Payback Period: ${touPayback.toFixed(1)} years\n` : ''}${tou25YearProfit > 0 ? `25-Year Profit: ${formatCurrency(tou25YearProfit)}\n` : ''}${touTotalOffset > 0 ? `Energy Offset: ${touTotalOffset.toFixed(1)}%\n` : ''}
` : ''}
${(uloAnnualSavings > 0 || uloBeforeSolar > 0) ? `
ULTRA-LOW OVERNIGHT (ULO) PLAN
${uloBeforeSolar > 0 ? `Current Annual Bill: ${formatCurrency(uloBeforeSolar)}\n` : ''}${uloAfterSolar > 0 ? `With Solar + Battery: ${formatCurrency(uloAfterSolar)}\n` : ''}${uloAnnualSavings > 0 ? `Annual Savings: ${formatCurrency(uloAnnualSavings)}\nMonthly Savings: ${formatCurrency(uloMonthlySavings)}\n` : ''}${uloTotalBillSavingsPercent > 0 ? `Total Bill Savings: ${uloTotalBillSavingsPercent.toFixed(1)}%\n` : ''}${uloPayback > 0 ? `Payback Period: ${uloPayback.toFixed(1)} years\n` : ''}${ulo25YearProfit > 0 ? `25-Year Profit: ${formatCurrency(ulo25YearProfit)}\n` : ''}${uloTotalOffset > 0 ? `Energy Offset: ${uloTotalOffset.toFixed(1)}%\n` : ''}
` : ''}
`}
${selectedAddOns.length > 0 ? `
SELECTED ADD-ONS
${selectedAddOns.map((addOnId: string) => {
  const names: Record<string, string> = {
    'ev_charger': 'EV Charger',
    'heat_pump': 'Heat Pump',
    'new_roof': 'New Roof',
    'water_heater': 'Water Heater',
    'battery': 'Battery Storage'
  }
  return `• ${names[addOnId] || addOnId.replace(/_/g, ' ')}`
}).join('\n')}
` : ''}
${co2Offset > 0 ? `
ENVIRONMENTAL IMPACT
CO₂ Offset: ${co2Offset.toFixed(1)} tons/year
${treesEquivalent > 0 ? `Equivalent to planting ${formatNumber(treesEquivalent)} trees\n` : ''}${carsOffRoad > 0 ? `Equivalent to taking ${carsOffRoad.toFixed(1)} cars off the road\n` : ''}
` : ''}
WHAT HAPPENS NEXT?
- A solar specialist will contact you within 24 hours
- We'll answer any questions and discuss your options
- Schedule a free site assessment if you'd like to proceed

Reference ID: ${leadId}

View your results online: https://www.solarcalculatorcanada.org/track/${leadId}

Questions? Reply to this email or contact us at info@solarcalculatorcanada.org

© ${new Date().getFullYear()} Solar Calculator Canada. All rights reserved.
    `.trim(),
  }
}

// Helper function to send email without PDF attachment
async function sendEstimateEmail(
  emailContent: { subject: string; html: string; text: string },
  email: string,
  leadId: string
) {
  // Send email using Resend (without PDF attachment)
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
    console.error('❌ Estimate email send error via Resend:', resendError)
    throw new Error('Failed to send email')
  }

  return { success: true }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId } = body

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing required field: leadId' },
        { status: 400 }
      )
    }

    // Fetch lead from database - same as PDF export
    const supabase = getSupabaseAdmin()
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
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }

      // Generate email template using lead data - same extraction logic as PDF
      const emailContent = generateEstimateEmailTemplate(altLead, leadId)
      const email = altLead.email || body.email

      if (!email) {
      return NextResponse.json(
          { error: 'Email address not found for lead' },
          { status: 400 }
        )
      }

      await sendEstimateEmail(emailContent, email, leadId)
      return NextResponse.json({
        success: true,
        message: 'Estimate email sent successfully',
      })
    }

    // Generate email template using lead data - same extraction logic as PDF
    const emailContent = generateEstimateEmailTemplate(lead, leadId)
    const email = lead.email || body.email

    if (!email) {
      return NextResponse.json(
        { error: 'Email address not found for lead' },
        { status: 400 }
      )
    }

    await sendEstimateEmail(emailContent, email, leadId)
    return NextResponse.json({
      success: true,
      message: 'Estimate email sent successfully',
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

