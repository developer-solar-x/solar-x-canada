// Export lead as PDF API endpoint - Complete clone of overview modal

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Helper function to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '$0'
  return `$${value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  return names[addOnId] || addOnId
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    // Fetch lead data
    const { data: lead, error: fetchError } = await supabase
      .from('leads_v3')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Parse JSONB fields
    const parseJson = (value: any): any => {
      if (typeof value === 'string') {
        try { return JSON.parse(value) } catch { return null }
      }
      return value
    }

    const estimateData = parseJson(lead.solar_estimate) || parseJson(lead.estimator_data) || null
    const peakShaving = parseJson(lead.peak_shaving) || null
    const coordinates = parseJson(lead.coordinates) || null
    const photoUrls = parseJson(lead.photo_urls) || []
    const selectedAddOns = parseJson(lead.selected_add_ons) || []
    const selectedBatteries = parseJson(lead.selected_batteries) || []

    // Extract city from various sources
    let city = lead.city
    if (!city && lead.address) {
      const addressParts = lead.address.split(',').map((p: string) => p.trim())
      if (addressParts.length >= 2) {
        const potentialCity = addressParts[1]
        if (potentialCity && potentialCity.length > 2 && !/^[A-Z]{2}\s*[A-Z0-9]/.test(potentialCity)) {
          city = potentialCity
        } else if (addressParts.length >= 3) {
          city = addressParts[addressParts.length - 2]
        }
      }
    }
    if (!city && estimateData?.city) {
      city = estimateData.city
    }
    const displayCity = city || 'N/A'

    // Extract solar estimate values
    const displayTotalCost = asNumber(lead.solar_total_cost) || asNumber(estimateData?.costs?.totalCost) || asNumber(lead.estimated_cost)
    const displayIncentives = asNumber(lead.solar_incentives) || asNumber(estimateData?.costs?.incentives)
    const displayNetCost = asNumber(lead.solar_net_cost) || asNumber(estimateData?.costs?.netCost) || asNumber(lead.net_cost_after_incentives)
    const displayAnnualSavings = asNumber(lead.solar_annual_savings) || asNumber(estimateData?.savings?.annualSavings) || asNumber(lead.annual_savings)
    const displayAnnualProduction = asNumber(lead.production_annual_kwh) || asNumber(estimateData?.production?.annualKwh)
    const numPanels = asNumber(lead.num_panels) || (lead.system_size_kw ? Math.round(lead.system_size_kw / 0.5) : null)

    // Battery values
    const batteryPrice = asNumber(lead.battery_price)
    const batteryRebate = asNumber(lead.battery_rebate)
    const batteryNet = asNumber(lead.battery_net_cost)
    const batteryAnnualSavings = asNumber(lead.battery_annual_savings)
    const hasBattery = lead.has_battery || batteryPrice != null || selectedBatteries?.length > 0

    // Combined totals
    const combinedTotalSystemCost = (displayTotalCost ?? 0) + (batteryPrice ?? 0)
    const combinedTotalIncentives = (displayIncentives ?? 0) + (batteryRebate ?? 0)
    const combinedNetAfterIncentives = (displayNetCost ?? 0) + (batteryNet ?? 0)
    const combinedAnnualSavings = (displayAnnualSavings ?? 0) + (batteryAnnualSavings ?? 0)

    // Peak Shaving values
    const touAnnual = asNumber(lead.tou_annual_savings)
    const uloAnnual = asNumber(lead.ulo_annual_savings)
    const touPayback = asNumber(lead.tou_payback_years)
    const uloPayback = asNumber(lead.ulo_payback_years)
    const touProfit25y = asNumber(lead.tou_profit_25y)
    const uloProfit25y = asNumber(lead.ulo_profit_25y)

    // Helper to get combined block from peak shaving
    const getCombinedBlock = (plan: any) => {
      return plan?.allResults?.combined?.combined
        ?? plan?.allResults?.combined
        ?? plan?.combined
        ?? null
    }

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Solar Estimate - ${lead.full_name}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
      background: #fff;
    }
    .header {
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e3a8a;
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: bold;
    }
    .header p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #1e3a8a;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 22px;
      font-weight: bold;
    }
    .section h3 {
      color: #374151;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0 15px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .info-value {
      font-size: 15px;
      color: #111827;
      font-weight: 500;
    }
    .highlight-box {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #1e3a8a;
      margin: 20px 0;
    }
    .highlight-box.green {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-left-color: #10b981;
    }
    .highlight-box.red {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-left-color: #ef4444;
    }
    .highlight-label {
      font-size: 12px;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .highlight-value {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .highlight-box.green .highlight-value {
      color: #059669;
    }
    .highlight-box.red .highlight-value {
      color: #dc2626;
    }
    .cost-breakdown {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .cost-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 16px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
    }
    .cost-label {
      color: #6b7280;
      font-size: 14px;
    }
    .cost-value {
      color: #111827;
      font-weight: 600;
      font-size: 14px;
    }
    .plan-comparison {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .plan-box {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      background: #f9fafb;
    }
    .plan-title {
      font-weight: bold;
      color: #1e3a8a;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .plan-detail {
      font-size: 13px;
      margin: 5px 0;
      color: #374151;
    }
    .plan-detail strong {
      color: #111827;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin: 2px;
    }
    .badge-blue {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-green {
      background: #d1fae5;
      color: #065f46;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .three-column {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .roof-image {
      width: 100%;
      max-width: 100%;
      height: 400px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
      margin: 15px 0;
    }
    .roof-placeholder {
      width: 100%;
      height: 400px;
      background: #f3f4f6;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #9ca3af;
      margin: 15px 0;
    }
    .roof-placeholder-content {
      padding: 20px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
      .roof-image {
        max-height: 300px;
      }
      .roof-placeholder {
        max-height: 300px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Solar Energy Estimate Report</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Lead ID:</strong> ${lead.id}</p>
  </div>

  <div class="two-column">
    <!-- Left Column -->
    <div>
      <!-- Contact Information -->
      <div class="section">
        <h2>Contact Information</h2>
        <div class="info-item">
          <div class="info-label">Full Name</div>
          <div class="info-value">${lead.full_name || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${lead.email || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${lead.phone || 'N/A'}</div>
        </div>
        ${lead.preferred_contact_method ? `
        <div class="info-item">
          <div class="info-label">Preferred Contact Method</div>
          <div class="info-value" style="text-transform: capitalize;">${lead.preferred_contact_method}</div>
        </div>
        ` : ''}
        ${lead.preferred_contact_time ? `
        <div class="info-item">
          <div class="info-label">Best Time to Contact</div>
          <div class="info-value" style="text-transform: capitalize;">${lead.preferred_contact_time}</div>
        </div>
        ` : ''}
        ${lead.comments ? `
        <div class="info-item">
          <div class="info-label">Comments</div>
          <div class="info-value" style="font-style: italic;">"${lead.comments}"</div>
        </div>
        ` : ''}
      </div>

      <!-- Property Location -->
      <div class="section">
        <h2>Property Location</h2>
        <div class="info-item">
          <div class="info-label">Address</div>
          <div class="info-value">${lead.address || 'N/A'}</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">City</div>
            <div class="info-value">${displayCity}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Province</div>
            <div class="info-value">${lead.province || 'N/A'}</div>
          </div>
        </div>
        ${lead.postal_code ? `
        <div class="info-item">
          <div class="info-label">Postal Code</div>
          <div class="info-value">${lead.postal_code}</div>
        </div>
        ` : ''}
        ${coordinates && coordinates.lat && coordinates.lng ? `
        <div class="info-item">
          <div class="info-label">Coordinates</div>
          <div class="info-value">${coordinates.lat}, ${coordinates.lng}</div>
        </div>
        ` : ''}
      </div>

      <!-- Timeline -->
      <div class="section">
        <h2>Timeline</h2>
        <div class="info-item">
          <div class="info-label">Submitted</div>
          <div class="info-value">${new Date(lead.created_at).toLocaleString('en-CA')}</div>
        </div>
        ${lead.hubspot_synced_at ? `
        <div class="info-item">
          <div class="info-label">Synced to HubSpot</div>
          <div class="info-value">${new Date(lead.hubspot_synced_at).toLocaleString('en-CA')}</div>
        </div>
        ` : ''}
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value" style="text-transform: capitalize;">${lead.status || 'new'}</div>
        </div>
      </div>
    </div>

    <!-- Right Column -->
    <div>
      <!-- Roof Information -->
      ${lead.roof_area_sqft || lead.roof_type || lead.map_snapshot_url ? `
      <div class="section">
        <h2>Roof Information</h2>
        
        ${lead.map_snapshot_url ? `
        <div>
          <h3 style="margin-bottom: 10px; font-size: 16px; color: #374151;">Roof Snapshot</h3>
          <img 
            src="${typeof lead.map_snapshot_url === 'string' ? lead.map_snapshot_url : ''}" 
            alt="Roof snapshot" 
            class="roof-image"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="roof-placeholder" style="display: none;">
            <div class="roof-placeholder-content">
              <p style="font-size: 14px; margin: 0;">Image failed to load</p>
              <p style="font-size: 12px; margin: 5px 0 0 0; color: #6b7280;">Roof polygon data stored: ${lead.roof_polygon ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
        ` : lead.roof_polygon ? `
        <div class="roof-placeholder">
          <div class="roof-placeholder-content">
            <p style="font-size: 14px; margin: 0;">Satellite View Not Available</p>
            <p style="font-size: 12px; margin: 5px 0 0 0;">Roof polygon data stored: Yes</p>
          </div>
        </div>
        ` : ''}
        
        <div class="info-grid" style="margin-top: 20px;">
          ${lead.roof_area_sqft ? `
          <div class="info-item">
            <div class="info-label">Total Area</div>
            <div class="info-value">${lead.roof_area_sqft.toLocaleString()} sq ft</div>
          </div>
          ` : ''}
          ${lead.roof_type ? `
          <div class="info-item">
            <div class="info-label">Type</div>
            <div class="info-value" style="text-transform: capitalize;">${lead.roof_type.replace('_', ' ')}</div>
          </div>
          ` : ''}
          ${lead.roof_pitch ? `
          <div class="info-item">
            <div class="info-label">Pitch</div>
            <div class="info-value" style="text-transform: capitalize;">${lead.roof_pitch}</div>
          </div>
          ` : ''}
          ${lead.roof_age ? `
          <div class="info-item">
            <div class="info-label">Age</div>
            <div class="info-value">${lead.roof_age}</div>
          </div>
          ` : ''}
          ${lead.shading_level ? `
          <div class="info-item">
            <div class="info-label">Shading</div>
            <div class="info-value" style="text-transform: capitalize;">${lead.shading_level}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Energy Usage -->
      ${lead.monthly_bill || lead.annual_usage_kwh ? `
      <div class="section">
        <h2>Energy Usage</h2>
        <div class="info-grid">
          ${lead.monthly_bill ? `
          <div class="info-item">
            <div class="info-label">Monthly Bill</div>
            <div class="info-value">${formatCurrency(lead.monthly_bill)}</div>
          </div>
          ` : ''}
          ${lead.annual_usage_kwh ? `
          <div class="info-item">
            <div class="info-label">Annual Usage</div>
            <div class="info-value">${lead.annual_usage_kwh.toLocaleString()} kWh</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- Solar System Estimate -->
  <div class="section">
    <h2>Solar System Estimate</h2>
    
    <div class="three-column">
      <div class="highlight-box red">
        <div class="highlight-label">System Size</div>
        <div class="highlight-value">${lead.system_size_kw ? lead.system_size_kw.toFixed(1) : 'N/A'} kW</div>
        ${numPanels ? `<div style="font-size: 12px; color: #6b7280; margin-top: 5px;">~${numPanels} panels</div>` : ''}
        ${displayAnnualProduction ? `<div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Annual Production: ${displayAnnualProduction.toLocaleString()} kWh/year</div>` : ''}
      </div>
      <div class="highlight-box green">
        <div class="highlight-label">Total Rebates</div>
        <div class="highlight-value">${formatCurrency(combinedTotalIncentives)}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Solar + Battery incentives</div>
      </div>
      <div class="highlight-box">
        <div class="highlight-label">Net After Incentives</div>
        <div class="highlight-value">${formatCurrency(combinedNetAfterIncentives)}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Based on saved solar and battery costs</div>
      </div>
    </div>

    <!-- Cost Breakdown -->
    <div class="cost-breakdown">
      <h3>Cost Breakdown</h3>
      <div class="cost-row">
        <span class="cost-label">Solar Cost:</span>
        <span class="cost-value">${formatCurrency(displayTotalCost)}</span>
      </div>
      <div class="cost-row">
        <span class="cost-label">Solar Rebate:</span>
        <span class="cost-value" style="color: #059669;">${formatCurrency(displayIncentives)}</span>
      </div>
      ${hasBattery ? `
      <div class="cost-row">
        <span class="cost-label">Battery Cost:</span>
        <span class="cost-value">${formatCurrency(batteryPrice)}</span>
      </div>
      <div class="cost-row">
        <span class="cost-label">Battery Rebate:</span>
        <span class="cost-value" style="color: #059669;">${formatCurrency(batteryRebate)}</span>
      </div>
      ` : ''}
      <div class="cost-row">
        <span class="cost-label">Total System Cost:</span>
        <span class="cost-value">${formatCurrency(combinedTotalSystemCost)}</span>
      </div>
      <div class="cost-row">
        <span class="cost-label">Total Incentives:</span>
        <span class="cost-value" style="color: #059669;">${formatCurrency(combinedTotalIncentives)}</span>
      </div>
      <div class="cost-row">
        <span class="cost-label">Net After Incentives:</span>
        <span class="cost-value" style="color: #059669; font-size: 18px;">${formatCurrency(combinedNetAfterIncentives)}</span>
      </div>
    </div>
  </div>

  <!-- Peak Shaving / Rate Plan Comparison -->
  ${peakShaving && (peakShaving.tou || peakShaving.ulo) ? `
  <div class="section">
    <h2>Rate Plan Comparison</h2>
    <div class="plan-comparison">
      ${peakShaving.tou ? `
      <div class="plan-box">
        <div class="plan-title">TOU (Time-of-Use)</div>
        ${touAnnual ? `<div class="plan-detail">Annual Savings: <strong>${formatCurrency(touAnnual)}</strong></div>` : ''}
        ${touPayback ? `<div class="plan-detail">Payback: <strong>${touPayback.toFixed(1)} years</strong></div>` : ''}
        ${touProfit25y ? `<div class="plan-detail">25-Year Profit: <strong style="color: #059669;">${formatCurrency(touProfit25y)}</strong></div>` : ''}
      </div>
      ` : ''}
      ${peakShaving.ulo ? `
      <div class="plan-box">
        <div class="plan-title">ULO (Ultra-Low Overnight)</div>
        ${uloAnnual ? `<div class="plan-detail">Annual Savings: <strong>${formatCurrency(uloAnnual)}</strong></div>` : ''}
        ${uloPayback ? `<div class="plan-detail">Payback: <strong>${uloPayback.toFixed(1)} years</strong></div>` : ''}
        ${uloProfit25y ? `<div class="plan-detail">25-Year Profit: <strong style="color: #059669;">${formatCurrency(uloProfit25y)}</strong></div>` : ''}
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- Selected Add-ons -->
  ${selectedAddOns && selectedAddOns.length > 0 ? `
  <div class="section">
    <h2>Selected Add-ons</h2>
    <div>
      ${selectedAddOns.map((addOn: string) => `
        <span class="badge badge-blue">${getAddOnName(addOn)}</span>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- Battery Details -->
  ${hasBattery ? `
  <div class="section">
    <h2>Battery Storage</h2>
    <div class="info-grid">
      ${batteryPrice ? `
      <div class="info-item">
        <div class="info-label">Battery Cost</div>
        <div class="info-value">${formatCurrency(batteryPrice)}</div>
      </div>
      ` : ''}
      ${batteryRebate ? `
      <div class="info-item">
        <div class="info-label">Battery Rebate</div>
        <div class="info-value" style="color: #059669;">${formatCurrency(batteryRebate)}</div>
      </div>
      ` : ''}
      ${batteryNet ? `
      <div class="info-item">
        <div class="info-label">Net Battery Cost</div>
        <div class="info-value">${formatCurrency(batteryNet)}</div>
      </div>
      ` : ''}
      ${batteryAnnualSavings ? `
      <div class="info-item">
        <div class="info-label">Annual Battery Savings</div>
        <div class="info-value" style="color: #059669;">${formatCurrency(batteryAnnualSavings)}</div>
      </div>
      ` : ''}
    </div>
    ${selectedBatteries && selectedBatteries.length > 0 ? `
    <div style="margin-top: 15px;">
      <div class="info-label">Selected Batteries</div>
      ${selectedBatteries.map((battery: any) => `
        <div class="info-value" style="margin-top: 5px;">
          ${battery.brand || ''} ${battery.model || ''} ${battery.kwh ? `(${battery.kwh} kWh)` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Environmental Impact -->
  ${lead.env_co2_offset_tpy != null || lead.env_trees_equivalent != null || lead.env_cars_off_road != null ? `
  <div class="section">
    <h2>Environmental Impact</h2>
    <div class="three-column">
      ${lead.env_co2_offset_tpy != null ? `
      <div class="info-item">
        <div class="info-label">CO₂ Offset (tons/year)</div>
        <div class="info-value" style="color: #059669;">${lead.env_co2_offset_tpy}</div>
      </div>
      ` : ''}
      ${lead.env_trees_equivalent != null ? `
      <div class="info-item">
        <div class="info-label">Trees Equivalent</div>
        <div class="info-value" style="color: #059669;">${lead.env_trees_equivalent}</div>
      </div>
      ` : ''}
      ${lead.env_cars_off_road != null ? `
      <div class="info-item">
        <div class="info-label">Cars Off Road</div>
        <div class="info-value" style="color: #059669;">${lead.env_cars_off_road}</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- Financing Preference -->
  ${lead.financing_preference ? `
  <div class="section">
    <h2>Financing Preference</h2>
    <div class="info-item">
      <div class="info-value">${lead.financing_preference}</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>This estimate was generated by SolarX Solar Estimator</strong></p>
    <p>For questions, please contact: developer@solar-x.ca</p>
    <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">Report generated on ${new Date().toLocaleString('en-CA')}</p>
  </div>
</body>
</html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="solar-estimate-${lead.id}.html"`,
      },
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
