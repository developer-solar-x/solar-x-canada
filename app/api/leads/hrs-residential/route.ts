// API route for HRS Residential Detailed Leads
// Handles the simplified data structure from detailed HRS residential estimator

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendInternalNotificationEmail } from '@/lib/internal-email'

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
    const filePath = `hrs-residential/${uniqueFileName}`
    
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
      console.error('Error uploading to storage:', error)
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

// Helper function to upload photo file to Supabase Storage
async function uploadPhotoToStorage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  photoUrl: string,
  photoId: string,
  bucket: string = 'photos'
): Promise<string | null> {
  try {
    // If it's already a Supabase Storage URL, return it
    if (photoUrl.includes('supabase.co/storage')) {
      return photoUrl
    }
    
    // If it's a base64 data URL, upload it
    if (photoUrl.startsWith('data:image/')) {
      return await uploadBase64ToStorage(supabase, photoUrl, `${photoId}.png`, bucket)
    }
    
    // If it's a blob URL or local URL, we need to fetch it first
    // For now, return null - client should upload photos separately before submitting
    console.warn('Photo URL is not a base64 data URL or Supabase URL:', photoUrl)
    return null
  } catch (error) {
    console.error('Error in uploadPhotoToStorage:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate that this is a detailed HRS residential lead
    if (body.programType !== 'hrs_residential' || body.estimatorMode !== 'detailed' || body.leadType !== 'residential') {
      return NextResponse.json(
        { error: 'This endpoint is only for detailed HRS residential leads' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!body.email || !body.address) {
      return NextResponse.json(
        { error: 'Missing required fields: email, address' },
        { status: 400 }
      )
    }
    
    // Get Supabase admin client
    const supabase = getSupabaseAdmin()
    
    // Upload map snapshot to Supabase Storage if provided
    let mapSnapshotUrl: string | null = null
    if (body.mapSnapshot) {
      if (body.mapSnapshot.startsWith('data:image/')) {
        // Base64 data URL - upload to storage
        mapSnapshotUrl = await uploadBase64ToStorage(
          supabase,
          body.mapSnapshot,
          `map-snapshot-${body.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}.png`,
          'photos'
        )
      } else if (body.mapSnapshot.startsWith('http')) {
        // Already a URL (Supabase Storage or external) - use it directly
        mapSnapshotUrl = body.mapSnapshot
      } else {
        // Fallback: use as-is (might be a path or other format)
        mapSnapshotUrl = body.mapSnapshot
      }
    }
    
    // Upload photos to Supabase Storage if provided
    const uploadedPhotoUrls: string[] = []
    if (body.photos && Array.isArray(body.photos)) {
      for (const photo of body.photos) {
        const photoUrl = photo.url || photo.uploadedUrl || photo.preview
        if (photoUrl) {
          const uploadedUrl = await uploadPhotoToStorage(
            supabase,
            photoUrl,
            photo.id || `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            'photos'
          )
          if (uploadedUrl) {
            uploadedPhotoUrls.push(uploadedUrl)
          } else {
            // If upload failed but URL exists, keep original URL
            uploadedPhotoUrls.push(photoUrl)
          }
        }
      }
    }
    
    // Extract city and province from address if not provided
    let city = body.city
    let province = body.province || 'ON'
    
    if (!city && body.address) {
      // Try to extract city from address (e.g., "995 Beaufort Court, Oshawa, Ontario L1G 7N9, Canada")
      const addressParts = body.address.split(',')
      if (addressParts.length >= 2) {
        city = addressParts[1]?.trim() || null
        // Extract province from address if available
        const provinceMatch = body.address.match(/\b(Ontario|ON|Alberta|AB|British Columbia|BC|Manitoba|MB|New Brunswick|NB|Newfoundland|NL|Nova Scotia|NS|Northwest Territories|NT|Nunavut|NU|Prince Edward Island|PE|Quebec|QC|Saskatchewan|SK|Yukon|YT)\b/i)
        if (provinceMatch) {
          const provinceName = provinceMatch[1]
          // Map full names to codes
          const provinceMap: Record<string, string> = {
            'Ontario': 'ON', 'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB',
            'New Brunswick': 'NB', 'Newfoundland': 'NL', 'Nova Scotia': 'NS',
            'Northwest Territories': 'NT', 'Nunavut': 'NU', 'Prince Edward Island': 'PE',
            'Quebec': 'QC', 'Saskatchewan': 'SK', 'Yukon': 'YT'
          }
          province = provinceMap[provinceName] || provinceName.toUpperCase() || 'ON'
        }
      }
    }
    
    // Helper function to safely get nested value with fallback
    const getValue = (primary: any, fallback: any, path: string): any => {
      const primaryValue = primary
      if (primaryValue !== null && primaryValue !== undefined) return primaryValue
      
      // Try to extract from fallback using path (e.g., "estimate.production.annualKwh")
      if (fallback && path) {
        const parts = path.split('.')
        let value = fallback
        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part]
          } else {
            return null
          }
        }
        return value !== undefined ? value : null
      }
      return null
    }
    
    // Extract from original data if available (for fallback)
    const originalData = (body as any)._originalData || {}
    
    // Helper to extract plan data from peakShaving structure
    const extractPlanData = (plan: any, annualUsageKwh: number) => {
      if (!plan?.combined) return null
      const combined = plan.combined
      const breakdown = combined.breakdown || {}
      const frdResult = plan.result
      
      // Solar allocation
      const solarAllocation = breakdown.solarAllocation || {}
      const solar = (solarAllocation.ultraLow || 0) + (solarAllocation.offPeak || 0) +
                    (solarAllocation.midPeak || 0) + (solarAllocation.onPeak || 0)
      
      // Battery solar capture
      let batterySolarCapture = 0
      if (frdResult?.offsetPercentages?.solarChargedBattery) {
        const batterySolarCapturePercent = frdResult.offsetPercentages.solarChargedBattery
        batterySolarCapture = (batterySolarCapturePercent / 100) * annualUsageKwh
      } else if (frdResult?.battSolarCharged) {
        batterySolarCapture = frdResult.battSolarCharged
      }
      
      // Projection data
      const projection = plan.projection || {}
      
      return {
        solar,
        batterySolarCapture: Math.round(batterySolarCapture * 100) / 100,
        totalOffset: combined.combinedAnnualSavings || 0,
        buyFromGrid: combined.postSolarBatteryAnnualBill || 0,
        actualCostAfterBatteryOptimization: combined.postSolarBatteryAnnualBill || 0,
        savings: combined.combinedAnnualSavings || 0,
        annualSavings: combined.combinedAnnualSavings || 0,
        monthlySavings: combined.combinedMonthlySavings || 0,
        profit25Year: projection.netProfit25Year || 0,
        paybackPeriod: projection.paybackYears || 0,
        beforeSolarAnnualBill: combined.baselineAnnualBill || 0,
        afterSolarAnnualBill: combined.postSolarBatteryAnnualBill || 0,
        totalBillSavingsPercent: combined.baselineAnnualBill > 0
          ? Math.round(((combined.baselineAnnualBill - (combined.postSolarBatteryAnnualBill || 0)) / combined.baselineAnnualBill) * 10000) / 100
          : 0,
      }
    }
    
    // Extract TOU/ULO from original data if not in simplified data
    const annualUsageKwh = body.annualUsageKwh || 
      body.energyUsage?.annualKwh || 
      originalData.peakShaving?.annualUsageKwh ||
      originalData.energyUsage?.annualKwh || 0
    
    const touFromOriginal = originalData.peakShaving?.tou 
      ? extractPlanData(originalData.peakShaving.tou, annualUsageKwh)
      : null
    const uloFromOriginal = originalData.peakShaving?.ulo 
      ? extractPlanData(originalData.peakShaving.ulo, annualUsageKwh)
      : null
    
    // Build insert data with fallback extraction from full_data_json
    const insertData: any = {
      // Step 0: Mode & Program
      estimator_mode: body.estimatorMode,
      program_type: body.programType,
      lead_type: body.leadType,
      
      // Step 1: Location
      email: body.email,
      address: body.address,
      coordinates: body.coordinates || null,
      city: city || null,
      province: province,
      
      // Step 2: Roof
      roof_area_sqft: body.roofAreaSqft || null,
      roof_polygon: body.roofPolygon || null,
      roof_size_preset: body.roofSizePreset || null,
      roof_entry_method: body.roofEntryMethod || null,
      map_snapshot: mapSnapshotUrl || null, // Use uploaded URL instead of raw data
      roof_azimuth: body.roofAzimuth || null,
      roof_type: body.roofType || null,
      roof_age: body.roofAge || null,
      roof_pitch: body.roofPitch || null,
      shading_level: body.shadingLevel || null,
      
      // Step 3: Property Photos (use uploaded URLs)
      photo_urls: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : (body.photoUrls || []),
      photo_summary: body.photoSummary || body.photo_summary || null,
      
      // Step 3: Energy - with fallback to estimate or peakShaving
      monthly_bill: body.monthlyBill || null,
      annual_usage_kwh: body.annualUsageKwh || 
        body.energyUsage?.annualKwh || 
        originalData.peakShaving?.annualUsageKwh ||
        originalData.energyUsage?.annualKwh ||
        null,
      energy_usage: body.energyUsage || originalData.energyUsage || null,
      energy_entry_method: body.energyEntryMethod || null,
      system_type: body.systemType || null,
      has_battery: body.hasBattery !== undefined ? body.hasBattery : (body.selectedBatteryIds?.length > 0),
      annual_escalator: body.annualEscalator || null,
      
      // Add-ons selection
      selected_add_ons: body.selectedAddOns || body.selected_add_ons || [],
      
      // Step 4: Battery Savings - with fallback to estimate
      selected_battery_ids: body.selectedBatteryIds || [],
      system_size_kw: body.systemSizeKw || 
        originalData.estimate?.system?.sizeKw || 
        originalData.solarOverride?.sizeKw || 
        null,
      num_panels: body.numPanels || 
        originalData.estimate?.system?.numPanels || 
        originalData.solarOverride?.numPanels || 
        null,
      
      // TOU Plan Data - use simplified data or extract from original
      tou_solar: body.tou?.solar || touFromOriginal?.solar || null,
      tou_battery_solar_capture: body.tou?.batterySolarCapture || touFromOriginal?.batterySolarCapture || null,
      tou_total_offset: body.tou?.totalOffset || touFromOriginal?.totalOffset || null,
      tou_buy_from_grid: body.tou?.buyFromGrid || touFromOriginal?.buyFromGrid || null,
      tou_actual_cost_after_battery_optimization: body.tou?.actualCostAfterBatteryOptimization || touFromOriginal?.actualCostAfterBatteryOptimization || null,
      tou_savings: body.tou?.savings || touFromOriginal?.savings || null,
      tou_annual_savings: body.tou?.annualSavings || touFromOriginal?.annualSavings || null,
      tou_monthly_savings: body.tou?.monthlySavings || touFromOriginal?.monthlySavings || null,
      tou_profit_25_year: body.tou?.profit25Year || touFromOriginal?.profit25Year || null,
      tou_payback_period: body.tou?.paybackPeriod || touFromOriginal?.paybackPeriod || null,
      tou_total_bill_savings_percent: body.tou?.totalBillSavingsPercent || touFromOriginal?.totalBillSavingsPercent || null,
      tou_before_solar: body.tou?.beforeSolarAnnualBill || body.tou?.beforeSolar || touFromOriginal?.beforeSolarAnnualBill || null,
      tou_after_solar: body.tou?.afterSolarAnnualBill || body.tou?.afterSolar || touFromOriginal?.afterSolarAnnualBill || null,
      
      // ULO Plan Data - use simplified data or extract from original
      ulo_solar: body.ulo?.solar || uloFromOriginal?.solar || null,
      ulo_battery_solar_capture: body.ulo?.batterySolarCapture || uloFromOriginal?.batterySolarCapture || null,
      ulo_total_offset: body.ulo?.totalOffset || uloFromOriginal?.totalOffset || null,
      ulo_buy_from_grid: body.ulo?.buyFromGrid || uloFromOriginal?.buyFromGrid || null,
      ulo_actual_cost_after_battery_optimization: body.ulo?.actualCostAfterBatteryOptimization || uloFromOriginal?.actualCostAfterBatteryOptimization || null,
      ulo_savings: body.ulo?.savings || uloFromOriginal?.savings || null,
      ulo_annual_savings: body.ulo?.annualSavings || uloFromOriginal?.annualSavings || null,
      ulo_monthly_savings: body.ulo?.monthlySavings || uloFromOriginal?.monthlySavings || null,
      ulo_profit_25_year: body.ulo?.profit25Year || uloFromOriginal?.profit25Year || null,
      ulo_payback_period: body.ulo?.paybackPeriod || uloFromOriginal?.paybackPeriod || null,
      ulo_total_bill_savings_percent: body.ulo?.totalBillSavingsPercent || uloFromOriginal?.totalBillSavingsPercent || null,
      ulo_before_solar: body.ulo?.beforeSolarAnnualBill || body.ulo?.beforeSolar || uloFromOriginal?.beforeSolarAnnualBill || null,
      ulo_after_solar: body.ulo?.afterSolarAnnualBill || body.ulo?.afterSolar || uloFromOriginal?.afterSolarAnnualBill || null,
      
      // Step 8: Production - with fallback to estimate.production
      production_annual_kwh: body.production?.annualKwh || 
        originalData.estimate?.production?.annualKwh || 
        null,
      production_monthly_kwh: body.production?.monthlyKwh || 
        originalData.estimate?.production?.monthlyKwh || 
        null,
      production_daily_average_kwh: body.production?.dailyAverageKwh || 
        originalData.estimate?.production?.dailyAverageKwh || 
        null,
      
      // Step 8: Costs - with fallback to estimate.costs
      system_cost: body.costs?.systemCost !== undefined ? body.costs.systemCost : 
        (originalData.estimate?.costs?.systemCost || null),
      battery_cost: body.costs?.batteryCost || 
        (originalData.batteryDetails?.battery?.price || null),
      solar_rebate: body.costs?.solarRebate !== undefined ? body.costs.solarRebate : 
        (originalData.estimate?.costs?.incentives ? Math.min((body.systemSizeKw || originalData.estimate?.system?.sizeKw || 0) * 1000, 5000) : null),
      battery_rebate: body.costs?.batteryRebate || null,
      net_cost: body.costs?.netCost !== undefined ? body.costs.netCost : 
        (originalData.estimate?.costs?.netCost || null),
      
      // Step 8: Roof Area - with fallback to estimate.roofArea
      roof_area_square_feet: body.roofArea?.squareFeet || 
        originalData.estimate?.roofArea?.squareFeet || 
        null,
      roof_area_square_meters: body.roofArea?.squareMeters || 
        originalData.estimate?.roofArea?.squareMeters || 
        null,
      roof_area_usable_square_feet: body.roofArea?.usableSquareFeet || 
        originalData.estimate?.roofArea?.usableSquareFeet || 
        null,
      
      // Step 8: Environmental - with fallback to estimate.environmental
      co2_offset_tons_per_year: body.environmental?.co2OffsetTonsPerYear || 
        originalData.estimate?.environmental?.co2OffsetTonsPerYear || 
        null,
      trees_equivalent: body.environmental?.treesEquivalent || 
        originalData.estimate?.environmental?.treesEquivalent || 
        null,
      cars_off_road_equivalent: body.environmental?.carsOffRoadEquivalent || 
        originalData.estimate?.environmental?.carsOffRoadEquivalent || 
        null,
      
      // Step 9: Contact & Financing
      full_name: body.fullName || null,
      phone: body.phone || null,
      preferred_contact_time: body.preferredContactTime || null,
      preferred_contact_method: body.preferredContactMethod || null,
      comments: body.comments || null,
      consent: body.consent !== undefined ? body.consent : false,
      is_homeowner: body.isHomeowner !== undefined ? body.isHomeowner : null,
      financing_option: body.financingOption || null,
      
      // Full JSON backup
      full_data_json: body
    }
    
    // Net Metering Data (if programType is net_metering)
    if (body.programType === 'net_metering' && body.netMetering) {
      const netMetering = body.netMetering
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
    
    // Insert into database
    const { data, error } = await supabase
      .from('hrs_residential_leads')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting HRS residential lead:', error)
      return NextResponse.json(
        { error: 'Failed to save lead', details: error.message },
        { status: 500 }
      )
    }

    // Fire-and-forget: internal notification email about new detailed HRS lead
    ;(async () => {
      try {
        const fullData = body || {}
        const fullName =
          insertData.full_name ||
          fullData.fullName ||
          `${fullData.firstName || ''} ${fullData.lastName || ''}`.trim() ||
          'Unknown'
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
        const photoCount = Array.isArray(insertData.photo_urls)
          ? insertData.photo_urls.length
          : 0

        const subjectPrefix =
          (isHomeowner === true || hasBattery) &&
          (!!monthlyBill && monthlyBill >= 150) &&
          photoCount >= 3 &&
          insertData.consent === true
            ? '🔥 HIGH-INTENT HRS LEAD'
            : 'New HRS Lead'

        const subject = `${subjectPrefix}: ${fullName} • ${insertData.city || 'Unknown City'}, ${
          insertData.province || '??'
        }`

        const textLines: string[] = []
        textLines.push(`Lead ID: ${data.id}`)
        textLines.push('Program: HRS Residential Detailed')
        textLines.push(`Name: ${fullName}`)
        textLines.push(`Email: ${insertData.email || fullData.email || 'N/A'}`)
        textLines.push(
          `Phone: ${insertData.phone || fullData.phone || 'N/A'}`
        )
        textLines.push(
          `City/Province: ${insertData.city || 'N/A'}, ${
            insertData.province || 'N/A'
          }`
        )
        textLines.push(
          `Homeowner: ${
            isHomeowner === null ? 'Unknown' : isHomeowner ? 'Yes' : 'No'
          }`
        )
        textLines.push(`Has Battery: ${hasBattery ? 'Yes' : 'No or N/A'}`)
        if (monthlyBill) {
          textLines.push(`Monthly Bill: ~$${Math.round(monthlyBill)}`)
        }
        textLines.push(`Photos Uploaded: ${photoCount}`)
        textLines.push(
          `Consent to contact: ${insertData.consent ? 'Yes' : 'No or N/A'}`
        )
        textLines.push('')
        textLines.push(
          `Admin link: ${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/admin/leads/${data.id}`
        )

        await sendInternalNotificationEmail({
          subject,
          text: textLines.join('\n'),
        })
      } catch (err) {
        console.error(
          'Internal HRS residential lead notification email error:',
          err
        )
      }
    })()

    return NextResponse.json({
      success: true,
      leadId: data.id,
      message: 'HRS residential lead saved successfully'
    })
    
  } catch (error: any) {
    console.error('Error in HRS residential leads API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

