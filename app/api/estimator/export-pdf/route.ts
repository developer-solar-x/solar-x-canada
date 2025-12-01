// Export estimator review as PDF API endpoint - Complete clone of StepReview component

import { NextResponse } from 'next/server'
import { BATTERY_SPECS } from '@/config/battery-specs'

// Helper function to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '$0'
  return `$${value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Helper function to format kW
const formatKw = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '0 kW'
  return `${value.toFixed(1)} kW`
}

// Helper function to safely convert to number
const asNumber = (value: any): number | null => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }
  return null
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, estimate } = body

    if (!data || !estimate) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

    // Extract values from data and estimate
    const address = data.address || 'N/A'
    const city = data.city || ''
    const province = data.province || 'ON'
    
    // Solar values
    const solarTotalCost = estimate.costs?.totalCost || 0
    const solarNetCost = estimate.costs?.netCost || 0
    const solarIncentives = estimate.costs?.incentives || 0
    const solarAnnualSavings = estimate.savings?.annualSavings || 0
    const solarMonthlySavings = estimate.savings?.monthlySavings || 0
    const systemSizeKw = estimate.system?.sizeKw || 0
    const numPanels = estimate.system?.numPanels || 0
    const annualProduction = estimate.production?.annualKwh || 0
    const monthlyProduction = estimate.production?.monthlyKwh || []
    
    // Battery values - match StepReview logic exactly
    const hasBatteryDetails = !!(data.batteryDetails && (data.peakShaving?.tou || data.peakShaving?.ulo))
    
    // Selected batteries (support multiple) – fallback to single selection
    const selectedBatteryIds: string[] = Array.isArray(data.selectedBatteries) && data.selectedBatteries.length > 0
      ? data.selectedBatteries
      : (data.selectedBattery ? [data.selectedBattery] : [])
    
    // Include battery section whenever any battery is selected or details exist
    const includeBattery = selectedBatteryIds.length > 0 || hasBatteryDetails
    
    // Aggregate battery pricing and capacity when multiple are selected
    const aggregatedBattery = selectedBatteryIds.length > 0
      ? selectedBatteryIds.reduce((acc: any, id: string) => {
          // First try to get battery info from batteryDetails, then look up from BATTERY_SPECS
          let batteryInfo = data.batteryDetails?.battery
          if (!batteryInfo) {
            // Look up battery from specs by ID
            const batterySpec = BATTERY_SPECS.find(b => b.id === id)
            if (batterySpec) {
              batteryInfo = {
                price: batterySpec.price,
                nominalKwh: batterySpec.nominalKwh,
                usableKwh: batterySpec.usableKwh,
                brand: batterySpec.brand,
                model: batterySpec.model
              }
            }
          }
          // Fallback to empty object if no battery info found
          batteryInfo = batteryInfo || {}
          return {
            price: (acc.price || 0) + (batteryInfo.price || 0),
            nominalKwh: (acc.nominalKwh || 0) + (batteryInfo.nominalKwh || 0),
            usableKwh: (acc.usableKwh || 0) + (batteryInfo.usableKwh || 0),
            labels: [...(acc.labels || []), batteryInfo.brand && batteryInfo.model ? `${batteryInfo.brand} ${batteryInfo.model}` : 'Battery']
          }
        }, { price: 0, nominalKwh: 0, usableKwh: 0, labels: [] })
      : null
    
    const batteryDetails = data.batteryDetails
    // Calculate battery price - prefer batteryDetails, then aggregatedBattery, then try peakShaving data
    let batteryPrice = 0
    let batteryNominalKwh = 0
    
    if (hasBatteryDetails && batteryDetails?.battery?.price) {
      batteryPrice = batteryDetails.battery.price
      batteryNominalKwh = batteryDetails.battery.nominalKwh || 0
    } else if (aggregatedBattery?.price) {
      batteryPrice = aggregatedBattery.price
      batteryNominalKwh = aggregatedBattery.nominalKwh || 0
    } else if (data.peakShaving?.selectedBattery) {
      // Try to get battery from peakShaving selectedBattery
      const peakShavingBatteryId = data.peakShaving.selectedBattery
      const batterySpec = BATTERY_SPECS.find(b => b.id === peakShavingBatteryId)
      if (batterySpec) {
        batteryPrice = batterySpec.price
        batteryNominalKwh = batterySpec.nominalKwh
      }
    } else if (selectedBatteryIds.length > 0) {
      // Last resort: try to get first selected battery from specs
      const firstBatteryId = selectedBatteryIds[0]
      const batterySpec = BATTERY_SPECS.find(b => b.id === firstBatteryId)
      if (batterySpec) {
        batteryPrice = batterySpec.price
        batteryNominalKwh = batterySpec.nominalKwh
      }
    }
    
    const batteryNetCost = hasBatteryDetails
      ? (batteryDetails?.multiYearProjection?.netCost || 0)
      : Math.max(0, batteryPrice - Math.min(batteryNominalKwh * 300, 5000))
    const batteryRebate = batteryPrice > 0 ? Math.max(0, batteryPrice - batteryNetCost) : 0
    
    // Peak shaving / rate plan data
    const peakShaving = data.peakShaving || {}
    const tou = peakShaving.tou || {}
    const ulo = peakShaving.ulo || {}
    const selectedPlan: 'tou' | 'ulo' | undefined = peakShaving.ratePlan
    const betterPlan = (() => {
      const touAnnual = tou?.result?.annualSavings || 0
      const uloAnnual = ulo?.result?.annualSavings || 0
      return touAnnual >= uloAnnual ? 'tou' : 'ulo'
    })()
    const planData: any = (betterPlan === 'tou' ? tou : ulo) || tou || ulo
    const displayPlan = selectedPlan || betterPlan
    
    const batteryAnnualSavings = planData?.result?.annualSavings || 0
    const batteryMonthlySavings = batteryAnnualSavings > 0 ? Math.round(batteryAnnualSavings / 12) : 0
    
    // Program battery rebate (explicit) for clear breakdown (aggregated across batteries)
    const batteryProgramRebate = aggregatedBattery 
      ? Math.min((aggregatedBattery.nominalKwh || 0) * 300, 5000) 
      : Math.min(batteryNominalKwh * 300, 5000)
    const batteryProgramNet = includeBattery ? Math.max(0, batteryPrice - batteryProgramRebate) : 0
    
    // Combined values - match StepReview exactly
    const combinedTotalCost = solarTotalCost + (includeBattery ? batteryPrice : 0)
    // Use program-based battery net for transparency in Review
    const combinedNetCost = solarNetCost + (includeBattery ? batteryProgramNet : 0)
    const combinedMonthlySavings = solarMonthlySavings + (includeBattery ? batteryMonthlySavings : 0)
    const combinedAnnualSavings = solarAnnualSavings + (includeBattery ? batteryAnnualSavings : 0)
    
    // Peak shaving combined totals - match StepReview logic exactly
    const touCombined = tou.combined || {}
    const uloCombined = ulo.combined || {}
    
    // Prefer combined results from peak shaving, fallback to calculating
    let touCombinedAnnual = touCombined.annual || 0
    let touCombinedNet = touCombined.netCost || 0
    let uloCombinedAnnual = uloCombined.annual || 0
    let uloCombinedNet = uloCombined.netCost || 0
    
    if (!(touCombined && uloCombined && touCombined.annual && uloCombined.annual)) {
      // Fallback: derive from estimate and battery savings if combined missing - match StepReview exactly
      const solarAnnual = solarAnnualSavings
      const touAnnual = (tou?.result?.annualSavings || 0) + solarAnnual
      const uloAnnual = (ulo?.result?.annualSavings || 0) + solarAnnual
      touCombinedAnnual = touAnnual
      uloCombinedAnnual = uloAnnual
      // Use combinedNetCost directly to ensure consistency with displayed value
      touCombinedNet = combinedNetCost
      uloCombinedNet = combinedNetCost
    }
    
    // Use the calculated values for payback - these will be from combined data if available, or combinedNetCost if not
    const finalTouCombinedNet = touCombinedNet
    const finalUloCombinedNet = uloCombinedNet
    
    const touPayback = finalTouCombinedNet <= 0 ? 0 : (touCombinedAnnual > 0 ? finalTouCombinedNet / touCombinedAnnual : Infinity)
    const uloPayback = finalUloCombinedNet <= 0 ? 0 : (uloCombinedAnnual > 0 ? finalUloCombinedNet / uloCombinedAnnual : Infinity)
    
    // Calculate 25-year profit using same logic as StepReview
    // Import calculateSimpleMultiYear logic (simplified)
    const calculateProfit25 = (annualSavings: number, netCost: number, escalation: number, years: number) => {
      let cumulative = 0
      for (let y = 1; y <= years; y++) {
        const annual = annualSavings * Math.pow(1 + escalation, y - 1)
        cumulative += annual
      }
      return cumulative - netCost
    }
    
    const touProfit25 = touCombined.projection?.netProfit25Year || 
      (includeBattery ? calculateProfit25(touCombinedAnnual, finalTouCombinedNet, 0.05, 25) : 0)
    const uloProfit25 = uloCombined.projection?.netProfit25Year || 
      (includeBattery ? calculateProfit25(uloCombinedAnnual, finalUloCombinedNet, 0.05, 25) : 0)
    
    // Environmental values
    const co2Offset = estimate.environmental?.co2OffsetTonsPerYear || 0
    const treesEquivalent = estimate.environmental?.treesEquivalent || 0
    const carsOffRoad = estimate.environmental?.carsOffRoadEquivalent || 0
    
    // Generate savings chart data (25 years) - match StepReview exactly
    const years = 25
    const escalation = 0.05
    const haveTouAndUlo = Boolean(includeBattery && tou?.result?.annualSavings != null && ulo?.result?.annualSavings != null)
    
    let savingsChartData: any[] = []
    if (haveTouAndUlo) {
      // Prefer combined totals from peak-shaving results if available
      const finalTouCombinedAnnual = touCombined.annual ?? touCombinedAnnual
      const finalUloCombinedAnnual = uloCombined.annual ?? uloCombinedAnnual
      const finalTouCombinedNet = touCombined.netCost ?? touCombinedNet
      const finalUloCombinedNet = uloCombined.netCost ?? uloCombinedNet
      
      // Build TOU and ULO cumulative series
      const series = Array.from({ length: years }, (_, idx) => {
        const y = idx + 1
        const touYear = finalTouCombinedAnnual * Math.pow(1 + escalation, idx)
        const uloYear = finalUloCombinedAnnual * Math.pow(1 + escalation, idx)
        return { year: y, touAnnual: touYear, uloAnnual: uloYear }
      })
      // Accumulate cumulatives and calculate profit (cumulative - net investment)
      let cumTou = 0
      let cumUlo = 0
      savingsChartData = series.map(row => {
        cumTou += row.touAnnual
        cumUlo += row.uloAnnual
        return { 
          year: row.year, 
          touCumulative: cumTou, 
          uloCumulative: cumUlo,
          touProfit: cumTou - finalTouCombinedNet,
          uloProfit: cumUlo - finalUloCombinedNet
        }
      })
    } else {
      // Fallback: single plan (selected/best)
      const planAnnual = planData?.result?.annualSavings || 0
      const finalCombinedAnnual = solarAnnualSavings + (includeBattery ? planAnnual : 0)
      let cumulative = 0
      for (let y = 1; y <= years; y++) {
        const annual = finalCombinedAnnual * Math.pow(1 + escalation, y - 1)
        cumulative += annual
        savingsChartData.push({ 
          year: y, 
          annual, 
          cumulative, 
          profit: cumulative - combinedNetCost 
        })
      }
    }
    
    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solar Estimate - ${address}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      background: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1B4E7C 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 15px;
    }
    .card h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .info-item {
      margin-bottom: 10px;
    }
    .info-label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 15px;
      text-align: left;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .metric-label {
      font-size: 12px;
      color: #6b7280;
    }
    .section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .comparison-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 15px;
    }
    .comparison-card h3 {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .plan-comparison {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .plan-label {
      font-size: 11px;
      color: #6b7280;
    }
    .plan-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Your Solar Estimate</h1>
      <p>${address}</p>
    </div>

    <div class="grid">
      <!-- Left Sidebar -->
      <div class="sidebar">
        <!-- Property Location -->
        <div class="card">
          <h3>Property Location</h3>
          <div class="info-item">
            <div class="info-label">Address</div>
            <div class="info-value">${address}</div>
          </div>
          ${city ? `
          <div class="info-item">
            <div class="info-label">City</div>
            <div class="info-value">${city}</div>
          </div>
          ` : ''}
          <div class="info-item">
            <div class="info-label">Province</div>
            <div class="info-value">${province}</div>
          </div>
        </div>

        <!-- Map Snapshot -->
        ${data.mapSnapshot ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Your Roof</h3>
          <img src="${data.mapSnapshot}" alt="Roof drawing on satellite map" style="width: 100%; max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 4px;" />
        </div>
        ` : ''}

        <!-- Roof Details -->
        ${data.roofAreaSqft ? `
        <div class="card">
          <h3>Roof Details</h3>
          <div class="info-item">
            <div class="info-label">Total Area</div>
            <div class="info-value">${data.roofAreaSqft.toLocaleString()} sq ft</div>
          </div>
          ${data.roofType ? `
          <div class="info-item">
            <div class="info-label">Type</div>
            <div class="info-value">${data.roofType}</div>
          </div>
          ` : ''}
          ${data.roofPitch ? `
          <div class="info-item">
            <div class="info-label">Pitch</div>
            <div class="info-value">${data.roofPitch}</div>
          </div>
          ` : ''}
          ${data.shadingLevel ? `
          <div class="info-item">
            <div class="info-label">Shading</div>
            <div class="info-value" style="text-transform: capitalize;">${data.shadingLevel}</div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Energy Usage -->
        ${data.monthlyBill ? `
        <div class="card">
          <h3>Energy Usage</h3>
          <div class="info-item">
            <div class="info-label">Monthly Bill</div>
            <div class="info-value">${formatCurrency(parseFloat(data.monthlyBill))}</div>
          </div>
          ${data.energyUsage?.annualKwh ? `
          <div class="info-item">
            <div class="info-label">Annual Usage</div>
            <div class="info-value">${data.energyUsage.annualKwh.toLocaleString()} kWh</div>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Right Content -->
      <div>
        <!-- Key Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${formatKw(systemSizeKw)}</div>
            <div class="metric-label">Recommended System</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">~${numPanels} solar panels</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatCurrency(combinedTotalCost)}</div>
            <div class="metric-label">Total System Cost</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatCurrency(combinedNetCost)}</div>
            <div class="metric-label">Your Net Investment</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">After ${formatCurrency(solarIncentives + (includeBattery ? batteryRebate : 0))} in rebates</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatCurrency(combinedMonthlySavings)}</div>
            <div class="metric-label">Monthly Savings</div>
          </div>
        </div>

        <!-- Cost Breakdown -->
        <div class="section">
          <h2>Cost Breakdown</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px;">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 10px; font-size: 14px;">Solar</div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span>Total (before rebates)</span>
                <span style="font-weight: 500;">${formatCurrency(solarTotalCost)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span>Solar rebate</span>
                <span style="font-weight: 500;">-${formatCurrency(solarIncentives)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px; font-size: 13px;">
                <span style="font-weight: 600;">Solar net</span>
                <span style="font-weight: 600;">${formatCurrency(solarNetCost)}</span>
              </div>
            </div>
            ${includeBattery ? `
            <div style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px;">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 10px; font-size: 14px;">Battery</div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span>Battery price</span>
                <span style="font-weight: 500;">${formatCurrency(batteryPrice)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span>Battery rebate</span>
                <span style="font-weight: 500;">-${formatCurrency(batteryRebate)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px; font-size: 13px;">
                <span style="font-weight: 600;">Battery net</span>
                <span style="font-weight: 600;">${formatCurrency(batteryNetCost)}</span>
              </div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Rate Plan Comparison -->
        ${includeBattery && (tou.result || ulo.result) ? `
        <div class="section">
          <h2>Rate Plan Comparison</h2>
          <div class="comparison-grid">
            <div class="comparison-card">
              <h3>Annual Savings</h3>
              <div class="plan-comparison">
                <div>
                  <div class="plan-label">TOU Plan</div>
                  <div class="plan-value">${formatCurrency(Math.round(touCombinedAnnual))}</div>
                </div>
              </div>
              <div class="plan-comparison" style="border-bottom: none;">
                <div>
                  <div class="plan-label">ULO Plan</div>
                  <div class="plan-value">${formatCurrency(Math.round(uloCombinedAnnual))}</div>
                </div>
              </div>
            </div>
            <div class="comparison-card">
              <h3>Payback Period</h3>
              <div class="plan-comparison">
                <div>
                  <div class="plan-label">TOU Plan</div>
                  <div class="plan-value">${touPayback > 0 ? touPayback.toFixed(1) + ' yrs' : 'N/A'}</div>
                </div>
              </div>
              <div class="plan-comparison" style="border-bottom: none;">
                <div>
                  <div class="plan-label">ULO Plan</div>
                  <div class="plan-value">${uloPayback > 0 ? uloPayback.toFixed(1) + ' yrs' : 'N/A'}</div>
                </div>
              </div>
            </div>
            <div class="comparison-card">
              <h3>25-Year Profit</h3>
              <div class="plan-comparison">
                <div>
                  <div class="plan-label">TOU Plan</div>
                  <div class="plan-value">${formatCurrency(Math.round(touProfit25))}</div>
                </div>
              </div>
              <div class="plan-comparison" style="border-bottom: none;">
                <div>
                  <div class="plan-label">ULO Plan</div>
                  <div class="plan-value">${formatCurrency(Math.round(uloProfit25))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Environmental Impact -->
        <div class="section">
          <h2>Environmental Impact</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="text-align: center; padding: 15px;">
              <div style="font-size: 32px; margin-bottom: 8px;">🌿</div>
              <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">${co2Offset} tons</div>
              <div style="font-size: 12px; color: #6b7280;">CO₂ offset per year</div>
            </div>
            <div style="text-align: center; padding: 15px;">
              <div style="font-size: 32px; margin-bottom: 8px;">🌲</div>
              <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">${treesEquivalent}</div>
              <div style="font-size: 12px; color: #6b7280;">Trees planted equivalent</div>
            </div>
            <div style="text-align: center; padding: 15px;">
              <div style="font-size: 32px; margin-bottom: 8px;">🚗</div>
              <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">${carsOffRoad}</div>
              <div style="font-size: 12px; color: #6b7280;">Cars off road equivalent</div>
            </div>
          </div>
        </div>

        <!-- Selected Add-ons -->
        ${data.selectedAddOns && data.selectedAddOns.length > 0 ? `
        <div class="section">
          <h2>Selected Add-ons</h2>
          <ul style="list-style: none; padding: 0;">
            ${data.selectedAddOns.map((addOn: string) => `
            <li style="padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 6px; border-radius: 4px; font-size: 13px;">
              ${getAddOnName(addOn)}
            </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Notes & Limitations -->
    <div class="section" style="margin-top: 10px;">
      <h2>Notes &amp; Limitations</h2>
      <p style="font-size: 12px; color: #4b5563; margin-bottom: 6px;">
        This PDF includes your core solar and battery system details, costs, savings, and environmental impact.
      </p>
      <ul style="font-size: 11px; color: #6b7280; padding-left: 18px; margin-top: 4px;">
        <li style="margin-bottom: 4px;">
          It does <strong>not</strong> include net metering–specific metrics like export credits, bill‑offset %, or the detailed net metering plan breakdown shown in the online results.
        </li>
        <li>
          It also does <strong>not</strong> include the chosen payment method / financing option displayed in the web interface.
        </li>
      </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>This estimate was generated by SolarX Solar Estimator</strong></p>
      <p>For questions, please contact: developer@solar-x.ca</p>
      <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">Report generated on ${new Date().toLocaleString('en-CA')}</p>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

