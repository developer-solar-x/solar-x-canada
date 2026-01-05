// Lead submission and management API

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendInternalNotificationEmail } from '@/lib/internal-email'

// Helper function to round numbers to 2 decimal places
function roundTo2Decimals(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

// Helper function to round to whole number (for integer columns)
function roundToInteger(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0
  return Math.round(value)
}

// Fields that should be integers (not decimals)
const INTEGER_FIELDS = new Set([
  'num_panels',
  'numPanels',
  'trees_equivalent',
  'treesEquivalent',
  'cars_off_road_equivalent',
  'carsOffRoadEquivalent',
  'env_trees_equivalent',
  'env_cars_off_road',
  'payback_years',
  'paybackYears',
  'payback_period',
  'paybackPeriod',
  'tou_payback_years',
  'ulo_payback_years',
  'tou_payback_period',
  'ulo_payback_period',
  'combined_payback_years',
  'roi_percent', // ROI is typically shown as integer percentage
  'tou_total_bill_savings_percent',
  'ulo_total_bill_savings_percent',
  'tou_total_offset',
  'ulo_total_offset',
  // Percentage fields should be integers
  'total_bill_savings_percent',
  'total_offset',
  'offset',
  // Production fields that might be integers in some schemas
  'production_daily_average_kwh',
  'production_annual_kwh', // If stored as integer
  'production_monthly_kwh', // Array elements should remain decimals
  // Count fields
  'co2_offset_tons_per_year', // Might be integer
  // Roof area fields (stored as integers in database)
  'roof_area_sqft',
  'roof_area_square_feet',
  'roofAreaSqft',
  'roofArea.squareFeet',
  // Any field ending with _percent or Percent
])

// Check if a field name suggests it should be an integer
function isIntegerField(key: string): boolean {
  // Check exact match
  if (INTEGER_FIELDS.has(key)) return true
  
  // Check patterns
  if (key.endsWith('_percent') || key.endsWith('Percent')) return true
  if (key.endsWith('_years') || key.endsWith('Years')) return true
  if (key.endsWith('_period') || key.endsWith('Period')) return true
  if (key.includes('num_') || key.includes('Num')) return true
  if (key.includes('count') || key.includes('Count')) return true
  if (key.includes('trees') || key.includes('Trees')) return true
  if (key.includes('cars') || key.includes('Cars')) return true
  
  // Roof area fields (typically stored as integers)
  if (key.includes('roof_area') || key.includes('roofArea')) {
    if (key.includes('sqft') || key.includes('square_feet') || key.includes('squareFeet')) {
      return true
    }
  }
  
  // kWh fields that might be stored as integers
  // Be cautious - only round if very close to integer
  if (key.includes('kwh') || key.includes('Kwh') || key.includes('KWh')) {
    // Production fields are often stored as integers in database schemas
    if (key.includes('production') || key.includes('Production')) {
      return true
    }
    // Daily average might be integer
    if (key.includes('daily') || key.includes('Daily')) {
      return true
    }
    // Annual totals might be integers
    if (key.includes('annual') || key.includes('Annual')) {
      return true
    }
  }
  
  return false
}

// Helper function to round all numeric values in an object appropriately
function roundNumericFields(obj: any, parentKey?: string): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(item => roundNumericFields(item, parentKey))
  }
  
  const rounded: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    
    if (typeof value === 'number') {
      // Check if this field should be an integer
      if (isIntegerField(key) || isIntegerField(fullKey)) {
        rounded[key] = roundToInteger(value)
      } else {
        rounded[key] = roundTo2Decimals(value)
      }
    } else if (typeof value === 'object' && value !== null) {
      rounded[key] = roundNumericFields(value, fullKey)
    } else {
      rounded[key] = value
    }
  }
  return rounded
}

// Helper function to upload base64 image to Supabase Storage
async function uploadBase64ToStorage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  base64Data: string,
  fileName: string,
  bucket: string = 'photos'
): Promise<string | null> {
  try {
    // Check if it's a data URL (data:image/...)
    let base64String = base64Data
    if (base64Data.startsWith('data:')) {
      // Extract base64 part after comma
      base64String = base64Data.split(',')[1]
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64')
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'png'
    const uniqueFileName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`
    const filePath = `map-snapshots/${uniqueFileName}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: base64Data.startsWith('data:image/') 
          ? base64Data.split(';')[0].split(':')[1] 
          : 'image/png',
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading map snapshot to storage:', error)
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error in uploadBase64ToStorage:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      // Contact information
      fullName,
      email,
      phone,
      preferredContactTime,
      preferredContactMethod,
      comments,
      
      // Property details
      address,
      city,
      province,
      postalCode,
      coordinates,
      
      // Roof information
      roofPolygon,
      roofAreaSqft,
      roofType,
      roofAge,
      roofPitch,
      shadingLevel,
      appliances,
      
      // Energy information
      monthlyBill,
      annualUsageKwh,
      
      // Estimate data
      estimateData,
      systemSizeKw,
      estimatedCost,
      netCostAfterIncentives,
      annualSavings,
      paybackYears,
      annualProductionKwh,
      
      // Source tracking (not stored in v2 table)
      source = 'estimator'
    } = body

    // Validate required fields
    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, phone' },
        { status: 400 }
      )
    }

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Upload map snapshot to Supabase Storage if provided
    // and ensure we don't persist large base64 blobs in JSON columns
    let mapSnapshotUrl: string | null = null
    if (body.mapSnapshot || body.mapSnapshotUrl) {
      const mapSnapshot = body.mapSnapshot || body.mapSnapshotUrl
      if (mapSnapshot.startsWith('data:image/')) {
        // Base64 data URL - upload to storage
        mapSnapshotUrl = await uploadBase64ToStorage(
          supabase,
          mapSnapshot,
          `map-snapshot-${email?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}.png`,
          'photos'
        )
      } else if (mapSnapshot.startsWith('http')) {
        // Already a URL (Supabase Storage or external) - use it directly
        mapSnapshotUrl = mapSnapshot
      } else {
        // Fallback: use as-is (might be a path or other format)
        mapSnapshotUrl = mapSnapshot
      }
    }

    // Create a sanitized copy of the request body that never stores base64 snapshots
    // in the database JSON (estimator_data / full_data_json).
    const sanitizedBody: any = { ...body }
    if (mapSnapshotUrl) {
      // Prefer storing the public URL instead of the original snapshot payload
      sanitizedBody.mapSnapshot = mapSnapshotUrl
      sanitizedBody.mapSnapshotUrl = mapSnapshotUrl
    } else if (typeof sanitizedBody.mapSnapshot === 'string' && sanitizedBody.mapSnapshot.startsWith('data:image/')) {
      // If for some reason upload failed, avoid persisting the huge base64 string
      delete sanitizedBody.mapSnapshot
    }

    // Calculate peak shaving data before insert
    // Helper to safely extract combined values supporting both shapes:
    // allResults.combined.annual and allResults.combined.combined.annual
    const getCombinedAnnual = (plan: any) =>
      plan?.allResults?.combined?.combined?.annual
      ?? plan?.allResults?.combined?.annual
      ?? plan?.combined?.annual
      ?? null
    const getCombinedMonthly = (plan: any) =>
      plan?.allResults?.combined?.combined?.monthly
      ?? plan?.allResults?.combined?.monthly
      ?? plan?.combined?.monthly
      ?? null
    const getCombinedNetCost = (plan: any) =>
      plan?.allResults?.combined?.combined?.netCost
      ?? plan?.allResults?.combined?.netCost
      ?? plan?.combined?.netCost
      ?? null
    const getCombinedProjection = (plan: any) =>
      plan?.allResults?.combined?.combined?.projection
      ?? plan?.allResults?.combined?.projection
      ?? plan?.combined?.projection
      ?? plan?.projection
      ?? null

    const touCombinedAnnual = getCombinedAnnual(body.peakShaving?.tou) || 0
    const uloCombinedAnnual = getCombinedAnnual(body.peakShaving?.ulo) || 0
    // Do not persist a "best" rate plan; users don't select a plan
    const bestRatePlan: string | null = null
    
    // Save full peak_shaving object including all comparisons, distributions, results, and projections
    // This includes: tou/ulo distributions, results, projections, allResults (with combined data)
    const fullPeakShaving = body.peakShaving ? {
      ...body.peakShaving,
      // Do not write a derived ratePlan
      // Include battery comparisons if available (from detailed StepBatteryPeakShaving)
      comparisons: body.peakShaving?.comparisons || null,
      // Include monthly savings data if available (from detailed StepBatteryPeakShaving)
      monthlySavings: body.peakShaving?.monthlySavings || null,
    } : null
    
    // Determine best combined totals (for combined_totals JSONB)
    const bestCombinedPlan = uloCombinedAnnual > touCombinedAnnual ? body.peakShaving?.ulo : body.peakShaving?.tou
    const bestCombined = bestCombinedPlan?.allResults?.combined?.combined
      ?? bestCombinedPlan?.allResults?.combined
      ?? bestCombinedPlan?.combined

    // Insert lead into database (v3 schema)
    // Build insert object - conditionally include city (column may not exist in older databases)
    const insertData: any = {
      // Contact
      full_name: fullName,
      email,
      phone,
      preferred_contact_time: preferredContactTime,
      preferred_contact_method: preferredContactMethod,
      comments,
      
      // Property
      address,
      province: province || 'ON',
      postal_code: postalCode,
      coordinates,
      
      // Roof
      roof_polygon: roofPolygon,
      roof_area_sqft: roofAreaSqft,
      roof_type: roofType,
      roof_age: roofAge,
      roof_pitch: roofPitch,
      shading_level: shadingLevel,
      
      // Energy / usage
      monthly_bill: monthlyBill ?? body.monthlyBill ?? body.full_data_json?.monthlyBill ?? 0,
      annual_usage_kwh: annualUsageKwh || body.energyUsage?.annualKwh || body.peakShaving?.tou?.result?.totalUsageKwh || body.peakShaving?.ulo?.result?.totalUsageKwh || 0,
      energy_usage: body.energyUsage || (annualUsageKwh ? { annualKwh: annualUsageKwh } : {}),
      
      // Selections / add-ons
      system_type: body.systemType || 'grid_tied',
      has_battery: Boolean((body.selectedAddOns || body.selected_add_ons || []).includes?.('battery') || body.hasBattery || body.selectedBattery || body.selectedBatteries),
      selected_add_ons: body.selectedAddOns || body.selected_add_ons || [],
      selected_battery_ids: body.selectedBatteryIds || body.selected_battery_ids || body.selectedBatteries?.map((b: any) => b.id || b) || (body.selectedBattery ? [body.selectedBattery] : []),
      
      // Estimate (only for non-HRS tables)
      system_size_kw: systemSizeKw,
      num_panels: body.numPanels || body.num_panels || estimateData?.system?.numPanels || 0,
      production_annual_kwh: annualProductionKwh ?? 0,
      production_monthly_kwh: estimateData?.production?.monthlyKwh || [],
      
      // Additional metadata
      estimator_mode: body.estimatorMode || body.estimator_mode || '',
      program_type: body.programType || body.program_type || '',
      // Use map_snapshot for hrs_residential_leads, map_snapshot_url for leads_v3
      map_snapshot: mapSnapshotUrl || body.mapSnapshot || body.mapSnapshotUrl || null,
      photo_urls: body.photos?.map((p: any) => p.url || p.uploadedUrl || p.preview).filter(Boolean) || body.photoUrls || [],
      photo_summary: body.photoSummary || body.photo_summary || {},
      
      // Status
      status: 'new',
      
      // Contact fields (for HRS)
      consent: body.consent ?? body.full_data_json?.consent ?? false,
      financing_option: body.financingOption || body.financingPreference || body.financing_preference || 
                       body.full_data_json?.financingOption || body.full_data_json?.financingPreference || null,
    }
    
    // For hrs_residential_leads table, add HRS-specific fields and exclude non-existent columns
    // These fields follow the HRS format from detailed analysis
    // Quick estimate and net metering should also follow HRS format
    const isHrsResidential = 
      body.programType === 'hrs_residential' || 
      body.program_type === 'hrs_residential' ||
      body.programType === 'quick' ||
      body.program_type === 'quick' ||
      body.programType === 'net_metering' ||
      body.program_type === 'net_metering'
    
    // For non-HRS tables, add additional columns that don't exist in hrs_residential_leads
    if (!isHrsResidential) {
      insertData.solar_estimate = estimateData
      insertData.solar_total_cost = estimatedCost
      insertData.solar_incentives = body.solarIncentives || estimateData?.costs?.incentives || 0
      insertData.solar_net_cost = netCostAfterIncentives
      insertData.solar_annual_savings = annualSavings
      insertData.solar_monthly_savings = body.monthlySavings || estimateData?.savings?.monthlySavings || 0
      insertData.roi_percent = estimateData?.savings?.roi || 0

      // Peak shaving / rate plan - extract from nested structure
      insertData.rate_plan = ''
      insertData.peak_shaving = fullPeakShaving
      // Extract TOU/ULO combined totals for easy querying
      insertData.tou_annual_savings = touCombinedAnnual || 0
      insertData.ulo_annual_savings = uloCombinedAnnual || 0
      insertData.tou_net_cost = getCombinedNetCost(body.peakShaving?.tou) || 0
      insertData.ulo_net_cost = getCombinedNetCost(body.peakShaving?.ulo) || 0
      insertData.tou_payback_years = getCombinedProjection(body.peakShaving?.tou)?.paybackYears || 0
      insertData.ulo_payback_years = getCombinedProjection(body.peakShaving?.ulo)?.paybackYears || 0
      insertData.tou_profit_25y = getCombinedProjection(body.peakShaving?.tou)?.netProfit25Year || 0
      insertData.ulo_profit_25y = getCombinedProjection(body.peakShaving?.ulo)?.netProfit25Year || 0

      // Combined review totals
      insertData.combined_totals = body.combined || (bestCombined ? {
        total_cost: estimatedCost,
        net_cost: bestCombined?.netCost || 0,
        monthly_savings: bestCombined?.monthly || 0,
        annual_savings: bestCombined?.annual || 0,
        payback_years: (getCombinedProjection(bestCombinedPlan))?.paybackYears || 0,
        profit_25y: (getCombinedProjection(bestCombinedPlan))?.netProfit25Year || 0,
        tou: {
          annual: touCombinedAnnual,
          monthly: getCombinedMonthly(body.peakShaving?.tou),
          net_cost: getCombinedNetCost(body.peakShaving?.tou),
          payback_years: getCombinedProjection(body.peakShaving?.tou)?.paybackYears ?? null,
          profit_25y: getCombinedProjection(body.peakShaving?.tou)?.netProfit25Year ?? null,
        },
        ulo: {
          annual: uloCombinedAnnual,
          monthly: getCombinedMonthly(body.peakShaving?.ulo),
          net_cost: getCombinedNetCost(body.peakShaving?.ulo),
          payback_years: getCombinedProjection(body.peakShaving?.ulo)?.paybackYears ?? null,
          profit_25y: getCombinedProjection(body.peakShaving?.ulo)?.netProfit25Year ?? null,
        },
      } : null)
      insertData.combined_total_cost = body.combined?.total_cost || estimatedCost || 0
      insertData.combined_net_cost = body.combined?.net_cost || body.peakShaving?.ulo?.allResults?.combined?.netCost || body.peakShaving?.tou?.allResults?.combined?.netCost || body.peakShaving?.ulo?.combined?.netCost || body.peakShaving?.tou?.combined?.netCost || 0
      insertData.combined_monthly_savings = body.combined?.monthly_savings || body.peakShaving?.ulo?.allResults?.combined?.monthly || body.peakShaving?.tou?.allResults?.combined?.monthly || body.peakShaving?.ulo?.combined?.monthly || body.peakShaving?.tou?.combined?.monthly || 0
      insertData.combined_annual_savings = body.combined?.annual_savings || body.peakShaving?.ulo?.allResults?.combined?.annual || body.peakShaving?.tou?.allResults?.combined?.annual || body.peakShaving?.ulo?.combined?.annual || body.peakShaving?.tou?.combined?.annual || 0
      insertData.combined_payback_years = body.combined?.payback_years || body.peakShaving?.ulo?.allResults?.combined?.combined?.projection?.paybackYears || body.peakShaving?.tou?.allResults?.combined?.combined?.projection?.paybackYears || body.peakShaving?.ulo?.allResults?.combined?.projection?.paybackYears || body.peakShaving?.tou?.allResults?.combined?.projection?.paybackYears || body.peakShaving?.ulo?.combined?.projection?.paybackYears || body.peakShaving?.tou?.combined?.projection?.paybackYears || 0
      insertData.combined_profit_25y = body.combined?.profit_25y || body.peakShaving?.ulo?.allResults?.combined?.combined?.projection?.netProfit25Year || body.peakShaving?.tou?.allResults?.combined?.combined?.projection?.netProfit25Year || body.peakShaving?.ulo?.allResults?.combined?.projection?.netProfit25Year || body.peakShaving?.tou?.allResults?.combined?.projection?.netProfit25Year || body.peakShaving?.ulo?.combined?.projection?.netProfit25Year || body.peakShaving?.tou?.combined?.projection?.netProfit25Year || 0

      // Financing / environmental (optional)
      insertData.financing_preference = body.financingOption || body.financingPreference || body.financing_preference || ''
      insertData.env_co2_offset_tpy = estimateData?.environmental?.co2OffsetTonsPerYear || 0
      insertData.env_trees_equivalent = estimateData?.environmental?.treesEquivalent || 0
      insertData.env_cars_off_road = estimateData?.environmental?.carsOffRoadEquivalent || 0
      insertData.roof_sections = body.roofSections || []
      insertData.map_snapshot_url = mapSnapshotUrl || body.mapSnapshot || body.mapSnapshotUrl || ''
      insertData.selected_batteries = body.selectedBatteries || (body.selectedBattery ? [body.selectedBattery] : [])
      // Store the sanitized estimator payload so large base64 map snapshots
      // are not duplicated inside JSONB
      insertData.estimator_data = sanitizedBody
    }
    
    if (isHrsResidential) {
      // Extract TOU/ULO data from multiple possible locations
      // For quick estimate: data might be in body.tou/ulo, body.full_data_json, or body.peakShaving
      // For detailed: data is in body.peakShaving
      let touData = body.tou
      let uloData = body.ulo
      
      // If not in body.tou/ulo, check full_data_json (for quick estimate)
      if (!touData && body.full_data_json?.tou) {
        touData = body.full_data_json.tou
      }
      if (!uloData && body.full_data_json?.ulo) {
        uloData = body.full_data_json.ulo
      }
      
      // If still not found, check peakShaving nested structure
      if (!touData && body.peakShaving?.tou) {
        // Extract from peakShaving structure
        const touCombined = body.peakShaving.tou?.allResults?.combined?.combined || 
                           body.peakShaving.tou?.combined?.combined ||
                           body.peakShaving.tou?.combined
        const touResult = body.peakShaving.tou?.result
        
        touData = {
          solar: touResult?.solarProduction || 0,
          batterySolarCapture: touResult?.battSolarCharged || 0,
          totalOffset: touResult?.offsetPercentages ? 
            (touResult.offsetPercentages.solarDirect || 0) + (touResult.offsetPercentages.solarChargedBattery || 0) : 0,
          buyFromGrid: touCombined?.postSolarBatteryAnnualBill || 0,
          actualCostAfterBatteryOptimization: touCombined?.postSolarBatteryAnnualBill || 0,
          savings: touCombined?.combinedAnnualSavings || 0,
          annualSavings: touCombined?.combinedAnnualSavings || 0,
          monthlySavings: touCombined?.combinedMonthlySavings || 0,
          profit25Year: touCombined?.projection?.netProfit25Year || 0,
          paybackPeriod: touCombined?.projection?.paybackYears || 0,
          totalBillSavingsPercent: touCombined?.baselineAnnualBill && touCombined?.postSolarBatteryAnnualBill ?
            ((touCombined.baselineAnnualBill - touCombined.postSolarBatteryAnnualBill) / touCombined.baselineAnnualBill) * 100 : 0,
          beforeSolar: touCombined?.baselineAnnualBill || 0,
          afterSolar: touCombined?.postSolarBatteryAnnualBill || 0,
        }
      }
      
      if (!uloData && body.peakShaving?.ulo) {
        // Extract from peakShaving structure
        const uloCombined = body.peakShaving.ulo?.allResults?.combined?.combined || 
                           body.peakShaving.ulo?.combined?.combined ||
                           body.peakShaving.ulo?.combined
        const uloResult = body.peakShaving.ulo?.result
        
        uloData = {
          solar: uloResult?.solarProduction || 0,
          batterySolarCapture: uloResult?.battSolarCharged || 0,
          totalOffset: uloResult?.offsetPercentages ? 
            (uloResult.offsetPercentages.solarDirect || 0) + (uloResult.offsetPercentages.solarChargedBattery || 0) : 0,
          buyFromGrid: uloCombined?.postSolarBatteryAnnualBill || 0,
          actualCostAfterBatteryOptimization: uloCombined?.postSolarBatteryAnnualBill || 0,
          savings: uloCombined?.combinedAnnualSavings || 0,
          annualSavings: uloCombined?.combinedAnnualSavings || 0,
          monthlySavings: uloCombined?.combinedMonthlySavings || 0,
          profit25Year: uloCombined?.projection?.netProfit25Year || 0,
          paybackPeriod: uloCombined?.projection?.paybackYears || 0,
          totalBillSavingsPercent: uloCombined?.baselineAnnualBill && uloCombined?.postSolarBatteryAnnualBill ?
            ((uloCombined.baselineAnnualBill - uloCombined.postSolarBatteryAnnualBill) / uloCombined.baselineAnnualBill) * 100 : 0,
          beforeSolar: uloCombined?.baselineAnnualBill || 0,
          afterSolar: uloCombined?.postSolarBatteryAnnualBill || 0,
        }
      }
      
      // TOU Plan Data (HRS format) - extract from touData with fallbacks
      const touCombined = touData?.combined || body.peakShaving?.tou?.combined
      const touResult = touData?.result || body.peakShaving?.tou?.result
      const touAllResults = body.peakShaving?.tou?.allResults?.combined?.combined
      
      insertData.tou_solar = touData?.solar || 
                             touResult?.solarProduction || 
                             (touCombined?.breakdown?.solarAllocation ? 
                               ((touCombined.breakdown.solarAllocation.offPeak || 0) + 
                                (touCombined.breakdown.solarAllocation.midPeak || 0) + 
                                (touCombined.breakdown.solarAllocation.onPeak || 0)) : 0) || 0
      
      insertData.tou_battery_solar_capture = touData?.batterySolarCapture || 
                                            touResult?.battSolarCharged || 0
      
      insertData.tou_total_offset = touData?.totalOffset || 
                                    (touResult?.offsetPercentages ? 
                                      ((touResult.offsetPercentages.solarDirect || 0) + 
                                       (touResult.offsetPercentages.solarChargedBattery || 0)) : 0) || 0
      
      insertData.tou_buy_from_grid = touData?.buyFromGrid || 
                                     touCombined?.postSolarBatteryAnnualBill || 
                                     touAllResults?.postSolarBatteryAnnualBill || 0
      
      insertData.tou_actual_cost_after_battery_optimization = touData?.actualCostAfterBatteryOptimization || 
                                                             touCombined?.postSolarBatteryAnnualBill || 
                                                             touAllResults?.postSolarBatteryAnnualBill || 0
      
      insertData.tou_savings = touData?.savings || 
                              touCombined?.combinedAnnualSavings || 
                              touAllResults?.annual || 0
      
      insertData.tou_before_solar = touData?.beforeSolar || 
                                    touCombined?.baselineAnnualBill || 
                                    touAllResults?.baselineAnnualBill || 0
      
      insertData.tou_after_solar = touData?.afterSolar || 
                                   touCombined?.postSolarBatteryAnnualBill || 
                                   touAllResults?.postSolarBatteryAnnualBill || 0
      
      insertData.tou_annual_savings = touData?.annualSavings || 
                                     (insertData.tou_before_solar > 0 && insertData.tou_after_solar >= 0 ? 
                                       insertData.tou_before_solar - insertData.tou_after_solar : 0) ||
                                     touCombined?.combinedAnnualSavings || 
                                     touAllResults?.annual || 0
      
      insertData.tou_monthly_savings = touData?.monthlySavings || 
                                      (insertData.tou_annual_savings / 12) || 
                                      touCombined?.combinedMonthlySavings || 
                                      touAllResults?.monthly || 0
      
      const touProjection = touAllResults?.projection || 
                           touCombined?.projection || 
                           body.peakShaving?.tou?.allResults?.combined?.projection
      
      insertData.tou_profit_25_year = touData?.profit25Year || 
                                     touProjection?.netProfit25Year || 0
      
      insertData.tou_payback_period = touData?.paybackPeriod || 
                                     touProjection?.paybackYears || 0
      
      insertData.tou_total_bill_savings_percent = touData?.totalBillSavingsPercent || 
                                                  (insertData.tou_before_solar > 0 ? 
                                                    ((insertData.tou_before_solar - insertData.tou_after_solar) / insertData.tou_before_solar) * 100 : 0) || 0
      
      // ULO Plan Data (HRS format) - extract from uloData with fallbacks
      const uloCombined = uloData?.combined || body.peakShaving?.ulo?.combined
      const uloResult = uloData?.result || body.peakShaving?.ulo?.result
      const uloAllResults = body.peakShaving?.ulo?.allResults?.combined?.combined
      
      insertData.ulo_solar = uloData?.solar || 
                             uloResult?.solarProduction || 
                             (uloCombined?.breakdown?.solarAllocation ? 
                               ((uloCombined.breakdown.solarAllocation.ultraLow || 0) + 
                                (uloCombined.breakdown.solarAllocation.offPeak || 0) + 
                                (uloCombined.breakdown.solarAllocation.midPeak || 0) + 
                                (uloCombined.breakdown.solarAllocation.onPeak || 0)) : 0) || 0
      
      insertData.ulo_battery_solar_capture = uloData?.batterySolarCapture || 
                                            uloResult?.battSolarCharged || 0
      
      insertData.ulo_total_offset = uloData?.totalOffset || 
                                    (uloResult?.offsetPercentages ? 
                                      ((uloResult.offsetPercentages.solarDirect || 0) + 
                                       (uloResult.offsetPercentages.solarChargedBattery || 0)) : 0) || 0
      
      insertData.ulo_buy_from_grid = uloData?.buyFromGrid || 
                                     uloCombined?.postSolarBatteryAnnualBill || 
                                     uloAllResults?.postSolarBatteryAnnualBill || 0
      
      insertData.ulo_actual_cost_after_battery_optimization = uloData?.actualCostAfterBatteryOptimization || 
                                                             uloCombined?.postSolarBatteryAnnualBill || 
                                                             uloAllResults?.postSolarBatteryAnnualBill || 0
      
      insertData.ulo_savings = uloData?.savings || 
                              uloCombined?.combinedAnnualSavings || 
                              uloAllResults?.annual || 0
      
      insertData.ulo_before_solar = uloData?.beforeSolar || 
                                   uloCombined?.baselineAnnualBill || 
                                   uloAllResults?.baselineAnnualBill || 0
      
      insertData.ulo_after_solar = uloData?.afterSolar || 
                                  uloCombined?.postSolarBatteryAnnualBill || 
                                  uloAllResults?.postSolarBatteryAnnualBill || 0
      
      insertData.ulo_annual_savings = uloData?.annualSavings || 
                                     (insertData.ulo_before_solar > 0 && insertData.ulo_after_solar >= 0 ? 
                                       insertData.ulo_before_solar - insertData.ulo_after_solar : 0) ||
                                     uloCombined?.combinedAnnualSavings || 
                                     uloAllResults?.annual || 0
      
      insertData.ulo_monthly_savings = uloData?.monthlySavings || 
                                      (insertData.ulo_annual_savings / 12) || 
                                      uloCombined?.combinedMonthlySavings || 
                                      uloAllResults?.monthly || 0
      
      const uloProjection = uloAllResults?.projection || 
                           uloCombined?.projection || 
                           body.peakShaving?.ulo?.allResults?.combined?.projection
      
      insertData.ulo_profit_25_year = uloData?.profit25Year || 
                                     uloProjection?.netProfit25Year || 0
      
      insertData.ulo_payback_period = uloData?.paybackPeriod || 
                                     uloProjection?.paybackYears || 0
      
      insertData.ulo_total_bill_savings_percent = uloData?.totalBillSavingsPercent || 
                                                 (insertData.ulo_before_solar > 0 ? 
                                                   ((insertData.ulo_before_solar - insertData.ulo_after_solar) / insertData.ulo_before_solar) * 100 : 0) || 0
      
      // Additional HRS fields
      insertData.system_cost = body.costs?.systemCost || body.estimateData?.costs?.systemCost || 0
      insertData.battery_cost = body.costs?.batteryCost || body.estimateData?.costs?.batteryCost || 0
      insertData.solar_rebate = body.costs?.solarRebate || body.estimateData?.costs?.solarRebate || 0
      insertData.battery_rebate = body.costs?.batteryRebate || body.estimateData?.costs?.batteryRebate || 0
      insertData.net_cost = body.costs?.netCost || body.estimateData?.costs?.netCost || netCostAfterIncentives || 0
      
      // Production data
      insertData.production_annual_kwh = annualProductionKwh || body.production?.annualKwh || 0
      insertData.production_monthly_kwh = body.production?.monthlyKwh || body.estimateData?.production?.monthlyKwh || []
      insertData.production_daily_average_kwh = body.production?.dailyAverageKwh || body.estimateData?.production?.dailyAverageKwh || 0
      
      // Environmental data
      insertData.co2_offset_tons_per_year = body.environmental?.co2OffsetTonsPerYear || body.estimateData?.environmental?.co2OffsetTonsPerYear || 0
      insertData.trees_equivalent = body.environmental?.treesEquivalent || body.estimateData?.environmental?.treesEquivalent || 0
      insertData.cars_off_road_equivalent = body.environmental?.carsOffRoadEquivalent || body.estimateData?.environmental?.carsOffRoadEquivalent || 0
      
      // Roof area data
      insertData.roof_area_square_feet = body.roofArea?.squareFeet || body.roofAreaSqft || 0
      insertData.roof_area_square_meters = body.roofArea?.squareMeters || 0
      insertData.roof_area_usable_square_feet = body.roofArea?.usableSquareFeet || 0
      
      // Net Metering Data (if programType is net_metering)
      // Populate dedicated columns for better querying and analysis
      if (body.netMetering || body.net_metering) {
        const netMetering = body.netMetering || body.net_metering
        // Use tou results (which contains Alberta data for Alberta, or regular net metering for others)
        const netMeteringData = netMetering.tou?.annual || netMetering.ulo?.annual || netMetering.tiered?.annual
        const projection = netMetering.tou?.projection || netMetering.ulo?.projection || netMetering.tiered?.projection
        
        if (netMeteringData) {
          insertData.net_metering_export_credits = netMeteringData.exportCredits || null
          insertData.net_metering_import_cost = netMeteringData.importCost || null
          insertData.net_metering_net_bill = netMeteringData.netAnnualBill || null
          insertData.net_metering_bill_offset_percent = netMeteringData.billOffsetPercent || null
          insertData.net_metering_total_solar_production = netMeteringData.totalSolarProduction || null
          insertData.net_metering_total_load = netMeteringData.totalLoad || null
          insertData.net_metering_total_exported = netMeteringData.totalExported || null
          insertData.net_metering_total_imported = netMeteringData.totalImported || null
          insertData.net_metering_payback_years = projection?.paybackYears || null
          insertData.net_metering_profit_25_year = projection?.netProfit25Year || null
          insertData.net_metering_annual_savings = projection?.annualSavings || null
        }
        
        // Alberta Solar Club specific data
        const isAlberta = province === 'AB' || province === 'Alberta'
        if (isAlberta && netMetering.tou?.alberta) {
          const alberta = netMetering.tou.alberta
          insertData.alberta_solar_club = true
          insertData.alberta_high_season_exported_kwh = alberta.highProductionSeason?.exportedKwh || null
          insertData.alberta_high_season_export_credits = alberta.highProductionSeason?.exportCredits || null
          insertData.alberta_high_season_imported_kwh = alberta.highProductionSeason?.importedKwh || null
          insertData.alberta_high_season_import_cost = alberta.highProductionSeason?.importCost || null
          insertData.alberta_low_season_exported_kwh = alberta.lowProductionSeason?.exportedKwh || null
          insertData.alberta_low_season_export_credits = alberta.lowProductionSeason?.exportCredits || null
          insertData.alberta_low_season_imported_kwh = alberta.lowProductionSeason?.importedKwh || null
          insertData.alberta_low_season_import_cost = alberta.lowProductionSeason?.importCost || null
          insertData.alberta_cash_back_amount = alberta.cashBackAmount || null
          insertData.alberta_estimated_carbon_credits = alberta.estimatedCarbonCredits || null
        } else {
          insertData.alberta_solar_club = false
        }
      } else {
        insertData.alberta_solar_club = false
      }
      
      // Full data JSON (simplified format)
      // For quick estimates, use the full simplifiedData structure if available
      // Otherwise, construct from available fields
      if (body.full_data_json) {
        // If full_data_json is already provided (from StepContact), use it
        // Ensure net metering data is included if present
        insertData.full_data_json = {
          ...body.full_data_json,
          netMetering: body.netMetering || body.net_metering || body.full_data_json.netMetering || undefined,
        }
      } else if (body.tou || body.ulo || body.netMetering || body.net_metering) {
        // Construct from available fields (backward compatibility)
        insertData.full_data_json = {
          tou: body.tou,
          ulo: body.ulo,
          costs: body.costs,
          email: email,
          phone: phone,
          photos: body.photos || [],
          address: address,
          consent: body.consent ?? body.full_data_json?.consent ?? false,
          roofAge: body.roofAge,
          fullName: fullName,
          leadType: body.leadType || 'residential',
          roofArea: body.roofArea || {
            squareFeet: body.roofAreaSqft || 0,
            squareMeters: 0,
            usableSquareFeet: 0,
          },
          roofType: roofType,
          numPanels: body.numPanels || body.num_panels || estimateData?.system?.numPanels || 0,
          roofPitch: roofPitch,
          hasBattery: body.hasBattery || Boolean(body.selectedAddOns?.includes('battery')),
          production: body.production,
          coordinates: coordinates,
          mapSnapshot: mapSnapshotUrl || body.mapSnapshot || body.mapSnapshotUrl,
          // Add missing fields that are in simplifiedData but not in minimal construction
          estimatorMode: body.estimatorMode || body.estimator_mode || 'easy',
          programType: body.programType || body.program_type || 'quick',
          monthlyBill: body.monthlyBill ?? body.full_data_json?.monthlyBill ?? 0,
          annualUsageKwh: body.annualUsageKwh || body.energyUsage?.annualKwh || 0,
          energyUsage: body.energyUsage || (body.annualUsageKwh ? {
            annualKwh: body.annualUsageKwh,
            monthlyKwh: body.annualUsageKwh / 12,
            dailyKwh: body.annualUsageKwh / 365,
          } : undefined),
          selectedAddOns: body.selectedAddOns || body.selected_add_ons || [],
          selectedBatteryIds: body.selectedBatteryIds || body.selected_battery_ids || [],
          systemSizeKw: body.systemSizeKw || body.system_size_kw || systemSizeKw,
          environmental: body.environmental || estimateData?.environmental || undefined,
          financingOption: body.financingOption || body.financingPreference || body.financing_preference || null,
          roofAreaSqft: body.roofAreaSqft,
          roofPolygon: body.roofPolygon,
          roofAzimuth: body.roofAzimuth,
          shadingLevel: body.shadingLevel,
          photoSummary: body.photoSummary || body.photo_summary || undefined,
          annualEscalator: body.annualEscalator || body.annual_escalator || undefined,
          netMetering: body.netMetering || body.net_metering || undefined,
        }
      } else {
        // Fallback: use body as-is (for non-HRS leads)
        // Include net metering data if present
        insertData.full_data_json = {
          ...body,
          netMetering: body.netMetering || body.net_metering || undefined,
        }
      }
    } else {
      // For non-HRS tables (leads_v3, homeowner_leads), include battery fields
      insertData.battery_price = body.batteryDetails?.battery?.price || 0
      insertData.battery_rebate = (body.batteryDetails?.battery?.price && body.batteryDetails?.multiYearProjection?.netCost != null)
        ? (body.batteryDetails.battery.price - body.batteryDetails.multiYearProjection.netCost)
        : 0
      insertData.battery_net_cost = body.batteryDetails?.multiYearProjection?.netCost || 0
      insertData.battery_annual_savings = body.batteryDetails?.firstYearAnalysis?.totalSavings || body.peakShaving?.tou?.result?.annualSavings || body.peakShaving?.ulo?.result?.annualSavings || 0
      insertData.battery_monthly_savings = body.batteryDetails?.firstYearAnalysis?.totalSavings ? Math.round(body.batteryDetails.firstYearAnalysis.totalSavings / 12) : 0
    }
    
    // Only include city if it's provided (column exists in schema but may not be in database yet)
    // This prevents errors if the column hasn't been added to the database
    if (city !== undefined && city !== null && city !== '') {
      insertData.city = city
    }
    
    // Only include lead_type if provided (column may not exist in database yet)
    // This prevents errors if the column hasn't been added to the database
    const leadType = body.leadType || body.lead_type || 'residential'
    if (leadType) {
      insertData.lead_type = leadType
    }
    
    // Round all numeric fields to 2 decimal places before inserting
    const roundedInsertData = roundNumericFields(insertData)
    
    // Additional safety: Round any values in fields that are likely integer columns
    // This catches edge cases where decimal values accidentally end up in integer columns
    function ensureIntegerFields(obj: any, parentKey: string = ''): void {
      if (obj === null || obj === undefined) return
      if (typeof obj !== 'object') return
      
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key
        const keyLower = key.toLowerCase()
        
        if (typeof value === 'number') {
          // Always round if field name suggests it's an integer column
          if (isIntegerField(key) || isIntegerField(fullKey)) {
            obj[key] = roundToInteger(value)
          }
          // Also round production-related kWh fields (often stored as integers)
          else if ((keyLower.includes('production') && keyLower.includes('kwh')) ||
                   (keyLower.includes('daily') && keyLower.includes('kwh') && !keyLower.includes('monthly'))) {
            obj[key] = roundToInteger(value)
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          ensureIntegerFields(value, fullKey)
        } else if (Array.isArray(value)) {
          // For arrays, check each element recursively
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              ensureIntegerFields(item, `${fullKey}[${index}]`)
            }
          })
        }
      }
    }
    
    ensureIntegerFields(roundedInsertData)
    
    // Try different table names in order
    let lead: any = null
    let insertError: any = null
    
    // Try hrs_residential_leads first (current table)
    const { data: hrsLead, error: hrsError } = await supabase
      .from('hrs_residential_leads')
      .insert(roundedInsertData)
      .select()
      .single()
    
    if (!hrsError) {
      lead = hrsLead
    } else if (hrsError.code === 'PGRST205') {
      // Try leads_v3 (existing schema)
    const { data: oldLead, error: oldError } = await supabase
      .from('leads_v3')
      .insert(roundedInsertData)
      .select()
      .single()
    
      if (!oldError) {
        lead = oldLead
      } else if (oldError && oldError.code === 'PGRST205') {
      // Old table doesn't exist, try new schema table
      // Map fields to new schema format
      const newSchemaData: any = {
        // Contact - split full_name into first_name and last_name
        first_name: fullName?.split(' ')[0] || fullName || '',
        last_name: fullName?.split(' ').slice(1).join(' ') || '',
        email,
        phone,
        preferred_contact_method: preferredContactMethod || 'either',
        
        // Property
        street_address: address,
        city: city || '',
        postal_code: postalCode || '',
        province: province || 'ON',
        coordinates,
        
        // Calculator data
        calculator_inputs: {
          ...body,
          fullName,
          address,
          city,
          province,
          postalCode,
        },
        calculator_outputs: estimateData,
        system_size_kw: systemSizeKw,
        payback_period_years: paybackYears,
        annual_savings: annualSavings,
        monthly_savings: body.monthlySavings || estimateData?.savings?.monthlySavings || 0,
        lifetime_savings: (annualSavings || 0) * 25,
        net_investment: netCostAfterIncentives,
        total_cost: estimatedCost,
        incentives_amount: body.solarIncentives || estimateData?.costs?.incentives || 0,
        has_battery: Boolean((body.selectedAddOns || []).includes('battery') || body.hasBattery),
        battery_impact: body.batteryDetails ? {
          annualSavings: body.batteryDetails?.firstYearAnalysis?.totalSavings || 0,
          monthlySavings: body.batteryDetails?.firstYearAnalysis?.totalSavings ? Math.round(body.batteryDetails.firstYearAnalysis.totalSavings / 12) : 0,
          batterySizeKwh: body.batteryDetails?.battery?.nominalKwh || 0,
        } : null,
        
        // Status
        status: 'new',
        source: source || 'calculator',
      }
      
      // Round numeric fields in newSchemaData before inserting
      const roundedNewSchemaData = roundNumericFields(newSchemaData)
      
      const { data: newLead, error: newError } = await supabase
        .from('homeowner_leads')
        .insert(roundedNewSchemaData)
        .select()
        .single()
      
      lead = newLead
      insertError = newError
    } else {
      lead = oldLead
      insertError = oldError
      }
    } else {
      insertError = hrsError
    }

    if (insertError) {
      console.error('Database insert error:', insertError)
      
      // If error is about integer type, log the data to identify the problematic field
      if (insertError.code === '22P02' && insertError.message?.includes('integer')) {
        console.error('⚠️ Integer type error detected. Scanning data for problematic values...')
        function findNonIntegerValues(obj: any, path: string = '', results: Array<{path: string, value: any}> = []): Array<{path: string, value: any}> {
          if (obj === null || obj === undefined) return results
          if (typeof obj === 'number') {
            // If number has decimal part, it might be the issue
            if (!Number.isInteger(obj) && Math.abs(obj - Math.round(obj)) > 0.0001) {
              results.push({ path: path || 'root', value: obj })
            }
          } else if (typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
              const newPath = path ? `${path}.${key}` : key
              if (typeof value === 'number' && !Number.isInteger(value)) {
                results.push({ path: newPath, value })
              } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                findNonIntegerValues(value, newPath, results)
              } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                  if (typeof item === 'number' && !Number.isInteger(item)) {
                    results.push({ path: `${newPath}[${index}]`, value: item })
                  }
                })
              }
            }
          }
          return results
        }
        const nonIntegerValues = findNonIntegerValues(roundedInsertData)
        console.error('📊 Non-integer numeric values found:', nonIntegerValues.slice(0, 20)) // Limit to first 20
      }
      
      // If both tables don't exist, return helpful error
      if (insertError.code === 'PGRST205') {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            details: 'Please run the database schema migration. Tables leads_v3 or homeowner_leads must exist.',
            hint: 'Run supabase/schema_frd.sql in your Supabase SQL Editor'
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to save lead', details: insertError.message },
        { status: 500 }
      )
    }

    // Log activity - try different table names
    const activityTableNames = ['lead_activities_v3', 'lead_activities_v2', 'lead_activities']
    for (const tableName of activityTableNames) {
      const { error } = await supabase
        .from(tableName)
        .insert({
          lead_id: lead.id,
          activity_type: 'status_change',
          activity_data: { status: 'new', source },
        })
      
      // If successful or table doesn't exist, break
      if (!error || (error.code === 'PGRST205' && activityTableNames.indexOf(tableName) === activityTableNames.length - 1)) {
        break
      }
      // If table doesn't exist, try next table
      if (error && error.code === 'PGRST205') {
        continue
      }
      // Log other errors but don't fail the lead creation
      if (error) {
        console.warn(`Failed to log activity to ${tableName}:`, error)
      }
    }

    // Fire-and-forget: internal notification email about new lead
    ;(async () => {
      try {
        const fullData = insertData.full_data_json || body || {}
        const programType =
          insertData.program_type ||
          fullData.programType ||
          fullData.program_type ||
          'unknown'
        const estimatorMode =
          insertData.estimator_mode ||
          fullData.estimatorMode ||
          fullData.estimator_mode ||
          'unknown'

        const isHomeowner =
          fullData.isHomeowner ??
          insertData.is_homeowner ??
          fullData.is_home_owner ??
          null
        const hasBattery =
          insertData.has_battery ||
          !!insertData.selected_battery_ids?.length ||
          !!fullData.hasBattery ||
          !!fullData.selectedBatteryIds?.length

        const monthlyBill =
          insertData.monthly_bill ||
          fullData.monthlyBill ||
          fullData.energyUsage?.monthlyBill ||
          null
        const annualUsage =
          insertData.annual_usage_kwh ||
          fullData.annualUsageKwh ||
          fullData.energyUsage?.annualKwh ||
          null

        const photoCount =
          (Array.isArray(insertData.photo_urls)
            ? insertData.photo_urls.length
            : 0) ||
          (Array.isArray(fullData.photos) ? fullData.photos.length : 0)

        const city =
          insertData.city ||
          fullData.city ||
          (typeof insertData.address === 'string'
            ? insertData.address.split(',')[1]?.trim()
            : '') ||
          ''
        const province =
          insertData.province || fullData.province || 'ON'

        const fullName =
          insertData.full_name ||
          fullData.fullName ||
          `${fullData.firstName || ''} ${fullData.lastName || ''}`.trim() ||
          'Unknown'

        const isHighIntent =
          (isHomeowner === true || hasBattery) &&
          (!!monthlyBill && monthlyBill >= 150) &&
          photoCount >= 3 &&
          insertData.consent === true

        const subjectPrefix = isHighIntent
          ? '🔥 HIGH-INTENT LEAD'
          : 'New Lead'

        const subject = `${subjectPrefix}: ${fullName} • ${city || 'Unknown City'}, ${
          province || '??'
        } • ${programType} / ${estimatorMode}`

        const textLines: string[] = []
        textLines.push(`Lead ID: ${lead.id}`)
        textLines.push(`Program: ${programType}`)
        textLines.push(`Estimator Mode: ${estimatorMode}`)
        textLines.push(`Name: ${fullName}`)
        textLines.push(`Email: ${email || fullData.email || 'N/A'}`)
        textLines.push(
          `Phone: ${insertData.phone || fullData.phone || 'N/A'}`
        )
        textLines.push(`City/Province: ${city || 'N/A'}, ${province || 'N/A'}`)
        textLines.push(
          `Homeowner: ${
            isHomeowner === null ? 'Unknown' : isHomeowner ? 'Yes' : 'No'
          }`
        )
        textLines.push(`Has Battery: ${hasBattery ? 'Yes' : 'No or N/A'}`)
        if (monthlyBill) {
          textLines.push(`Monthly Bill: ~$${Math.round(monthlyBill)}`)
        }
        if (annualUsage) {
          textLines.push(
            `Annual Usage: ~${Math.round(annualUsage).toLocaleString()} kWh`
          )
        }
        if (photoCount) {
          textLines.push(`Photos Uploaded: ${photoCount}`)
        }
        textLines.push(
          `Consent to contact: ${insertData.consent ? 'Yes' : 'No or N/A'}`
        )
        textLines.push('')
        textLines.push(
          `Admin link: ${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/admin/leads/${lead.id}`
        )

        await sendInternalNotificationEmail({
          subject,
          text: textLines.join('\n'),
        })
      } catch (err) {
        console.error('Internal lead notification email error:', err)
      }
    })()

    // Queue HubSpot sync (async, don't wait for response)
    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch(err => console.error('HubSpot sync queue error:', err))
    }

    // Queue estimate email to customer via Resend (async, best-effort)
    const isQuickEstimate =
      body.programType === 'quick' ||
      body.program_type === 'quick' ||
      body.estimatorMode === 'easy' ||
      body.estimator_mode === 'easy'

    if (!isQuickEstimate && estimateData && email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL

      if (appUrl) {
        // Try to get the origin from the request headers, fallback to NEXT_PUBLIC_APP_URL
        const headersList = await headers()
        const host = headersList.get('host')
        const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
        const baseUrl = host ? `${protocol}://${host}` : appUrl
        const emailUrl = `${baseUrl}/api/leads/send-email`

        fetch(emailUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: lead.id,
          }),
        }).catch(err => {
          // Only log if it's not a connection refused error (common in dev)
          if (err?.cause?.code !== 'ECONNREFUSED') {
            console.error('Estimate email queue error:', {
              error: err,
              leadId: lead.id,
            })
          } else {
            console.warn('Estimate email queue skipped (connection refused - may be dev environment):', {
              leadId: lead.id,
            })
          }
        })
      } else {
        console.warn('Estimate email not queued: NEXT_PUBLIC_APP_URL is not set.', {
          leadId: lead.id,
        })
      }
    }

    // Return success with lead ID
    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        message: 'Your estimate has been saved successfully!'
      }
    })

  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint for fetching leads (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // For this project we only use the HRS residential leads table.
    // If it doesn't exist, we return a clear error instead of probing legacy tables.
    const tableName = 'hrs_residential_leads'

      const { error: checkError } = await supabase
      .from(tableName)
      .select('id', { head: true, count: 'exact' })
        .limit(1)
      
    if (checkError) {
      // Check if error message contains HTML (Cloudflare error page)
      const errorMessage = checkError.message || ''
      const isCloudflareError = typeof errorMessage === 'string' && (
        errorMessage.includes('<!DOCTYPE html>') ||
        errorMessage.includes('Web server is down') ||
        errorMessage.includes('Error code 521') ||
        errorMessage.includes('cloudflare.com')
      )
      
      if (isCloudflareError) {
        return NextResponse.json(
          { 
            error: 'Database connection error', 
            details: 'The database server is temporarily unavailable (Cloudflare 521 error).',
            hint: 'This is usually a temporary infrastructure issue. Please try again in a few moments.',
            retryable: true
          },
          { status: 503 } // Service Unavailable
        )
      }
      
      if (checkError.code === 'PGRST205') {
      return NextResponse.json(
        { 
          error: 'No leads table found', 
            details: `Table "${tableName}" does not exist in your database.`,
            hint: 'Create the "hrs_residential_leads" table or point the API to your actual leads table.'
        },
        { status: 500 }
      )
    }
    }

    // Base query against hrs_residential_leads
    let query: any = supabase
      .from(tableName)
      // Use estimated count to avoid heavy exact counts
      .select('*', { count: 'estimated' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter if provided (search in name, email, or address)
    // For this project we only support hrs_residential_leads schema
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%`
      )
    }

    // Execute query
    const { data: leads, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      
      // Check if error message contains HTML (Cloudflare error page)
      const errorMessage = error.message || ''
      const isCloudflareError = typeof errorMessage === 'string' && (
        errorMessage.includes('<!DOCTYPE html>') ||
        errorMessage.includes('Web server is down') ||
        errorMessage.includes('Error code 521') ||
        errorMessage.includes('cloudflare.com')
      )
      
      if (isCloudflareError) {
        return NextResponse.json(
          { 
            error: 'Database connection error', 
            details: 'The database server is temporarily unavailable (Cloudflare 521 error).',
            hint: 'This is usually a temporary infrastructure issue. Please try again in a few moments.',
            retryable: true
          },
          { status: 503 } // Service Unavailable
        )
      }
      
      // Return more helpful error message
      if (error.code === 'PGRST205') {
        return NextResponse.json(
          { 
            error: 'Table not found', 
            details: `Table "${tableName}" does not exist in your database.`,
            hint: 'Please check your database schema or run migrations'
          },
          { status: 500 }
        )
      }
      
      // Check for connection timeout or network errors
      if (error.code === '57014' || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            error: 'Database connection timeout', 
            details: 'The database query took too long or the connection was refused.',
            hint: 'This may be a temporary issue. Please try again.',
            retryable: true
          },
          { status: 503 }
        )
      }
      
      throw error
    }
    
    // Log for debugging
    console.log(`Fetched ${leads?.length || 0} leads from table "${tableName}"`)

    // Fetch activities for all leads if we have any
    let leadsWithActivities = leads || []
    if (leads && leads.length > 0) {
      const leadIds = leads.map((l: any) => l.id)
      
      // Try different activity table names in order of preference
      const activityTableNames = ['lead_activities_v3', 'lead_activities_v2', 'lead_activities']
      let activities: any[] = []
      let activitiesError: any = null
      
      for (const tableName of activityTableNames) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          activities = data
          activitiesError = null
          break
        }
        
        // If table doesn't exist (PGRST205), try next table
        if (error && error.code === 'PGRST205') {
          activitiesError = error
          continue
        }
        
        // Other errors should be logged but not break the flow
        if (error) {
          console.warn(`Error fetching activities from ${tableName}:`, error)
          activitiesError = error
        }
      }

      if (!activitiesError && activities && activities.length > 0) {
        // Group activities by lead_id
        const activitiesByLeadId = activities.reduce((acc: any, activity: any) => {
          if (!acc[activity.lead_id]) {
            acc[activity.lead_id] = []
          }
          acc[activity.lead_id].push(activity)
          return acc
        }, {})

        // Attach activities to each lead
        leadsWithActivities = leads.map((lead: any) => ({
          ...lead,
          activities: activitiesByLeadId[lead.id] || []
        }))
      } else {
        // If no activities found or table doesn't exist, just attach empty arrays
        leadsWithActivities = leads.map((lead: any) => ({
          ...lead,
          activities: []
        }))
      }
    }

    // Return paginated results
    // Ensure we always return an array, even if empty
    const leadsArray = Array.isArray(leadsWithActivities) ? leadsWithActivities : (leads || [])
    
    return NextResponse.json({
      success: true,
      data: {
        leads: leadsArray,
        pagination: {
          page,
          limit,
          total: count || leadsArray.length || 0,
          totalPages: Math.ceil((count || leadsArray.length || 0) / limit),
        }
      }
    })

  } catch (error) {
    console.error('Leads fetch error:', error)
    
    // Check if error message contains HTML (Cloudflare error page)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isCloudflareError = typeof errorMessage === 'string' && (
      errorMessage.includes('<!DOCTYPE html>') ||
      errorMessage.includes('Web server is down') ||
      errorMessage.includes('Error code 521') ||
      errorMessage.includes('cloudflare.com')
    )
    
    if (isCloudflareError) {
    return NextResponse.json(
        { 
          error: 'Database connection error', 
          details: 'The database server is temporarily unavailable (Cloudflare 521 error).',
          hint: 'This is usually a temporary infrastructure issue. Please try again in a few moments.',
          retryable: true
        },
        { status: 503 } // Service Unavailable
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch leads', 
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: false
      },
      { status: 500 }
    )
  }
}

