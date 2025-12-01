'use client'

// Results page route - displays calculator results after lead capture

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ResultsPage } from '@/components/ResultsPage'
import { useEffect, useState, Suspense } from 'react'
import { BATTERY_SPECS } from '@/config/battery-specs'

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const [estimate, setEstimate] = useState<any>(null)
  const [leadData, setLeadData] = useState<any>(null)
  const [batteryImpact, setBatteryImpact] = useState<any>(undefined)
  const [peakShaving, setPeakShaving] = useState<any>(undefined)
  const [solarRebate, setSolarRebate] = useState<number | undefined>(undefined)
  const [batteryRebate, setBatteryRebate] = useState<number | undefined>(undefined)
  const [combinedTotalCost, setCombinedTotalCost] = useState<number | undefined>(undefined)
  const [combinedNetCost, setCombinedNetCost] = useState<number | undefined>(undefined)
  const [displayPlan, setDisplayPlan] = useState<'tou' | 'ulo' | undefined>(undefined)
  const [solarOverride, setSolarOverride] = useState<any>(undefined)
  const [selectedBattery, setSelectedBattery] = useState<any>(undefined)
  const [batteryDetails, setBatteryDetails] = useState<any>(undefined)
  const [mapSnapshot, setMapSnapshot] = useState<string | undefined>(undefined)
  const [roofData, setRoofData] = useState<any>(undefined)
  const [photos, setPhotos] = useState<any[]>([])
  const [photoSummary, setPhotoSummary] = useState<any>(undefined)
  const [monthlyBill, setMonthlyBill] = useState<number | undefined>(undefined)
  const [energyUsage, setEnergyUsage] = useState<any>(undefined)
  const [appliances, setAppliances] = useState<any[]>([])
  const [addOns, setAddOns] = useState<any[]>([])
  const [tou, setTou] = useState<any>(undefined)
  const [ulo, setUlo] = useState<any>(undefined)
  const [programType, setProgramType] = useState<'quick' | 'hrs_residential' | 'net_metering' | undefined>(undefined)
  const [netMetering, setNetMetering] = useState<{ tou?: any; ulo?: any } | undefined>(undefined)
  const [financingOption, setFinancingOption] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  // Use the same transform function as track page
  const transformSimplifiedData = (simplifiedData: any, leadFields?: any) => {
    const isSimplifiedData = simplifiedData?.estimatorMode || simplifiedData?.programType
    
    // For easy mode, check if peakShaving is nested in full_data_json
    const peakShaving = simplifiedData?.peakShaving || simplifiedData?.estimate?.peakShaving
    
    // Extract TOU/ULO data - prioritize leadFields (database) for beforeSolar/afterSolar
    // since those are the correct values saved from calculations
    let touData = simplifiedData.tou
    let uloData = simplifiedData.ulo
    
    // For easy mode (quick estimate), prioritize leadFields values for beforeSolar/afterSolar
    // These are the correct values calculated and saved to the database
    if (leadFields) {
      const touBefore = parseFloat(leadFields.tou_before_solar) || 0
      const touAfter = parseFloat(leadFields.tou_after_solar) || 0
      const uloBefore = parseFloat(leadFields.ulo_before_solar) || 0
      const uloAfter = parseFloat(leadFields.ulo_after_solar) || 0
      
      // If we have database values, use them (they're the source of truth)
      if (touBefore > 0 || touAfter >= 0) {
        touData = {
          ...touData,
          beforeSolar: touBefore,
          afterSolar: touAfter,
          // Calculate annual savings from before/after (same as step 4)
          annualSavings: touBefore > 0 && touAfter >= 0 ? touBefore - touAfter : (touData?.annualSavings || parseFloat(leadFields.tou_annual_savings) || 0),
          monthlySavings: touData?.monthlySavings || parseFloat(leadFields.tou_monthly_savings) || 0,
          paybackPeriod: touData?.paybackPeriod || parseFloat(leadFields.tou_payback_period) || 0,
          profit25Year: touData?.profit25Year || parseFloat(leadFields.tou_profit_25_year) || 0,
          totalBillSavingsPercent: touData?.totalBillSavingsPercent || parseFloat(leadFields.tou_total_bill_savings_percent) || 0,
          totalOffset: touData?.totalOffset || parseFloat(leadFields.tou_total_offset) || 0, // Add totalOffset for energy offset display
        }
      }
      
      if (uloBefore > 0 || uloAfter >= 0) {
        uloData = {
          ...uloData,
          beforeSolar: uloBefore,
          afterSolar: uloAfter,
          // Calculate annual savings from before/after (same as step 4)
          annualSavings: uloBefore > 0 && uloAfter >= 0 ? uloBefore - uloAfter : (uloData?.annualSavings || parseFloat(leadFields.ulo_annual_savings) || 0),
          monthlySavings: uloData?.monthlySavings || parseFloat(leadFields.ulo_monthly_savings) || 0,
          paybackPeriod: uloData?.paybackPeriod || parseFloat(leadFields.ulo_payback_period) || 0,
          profit25Year: uloData?.profit25Year || parseFloat(leadFields.ulo_profit_25_year) || 0,
          totalBillSavingsPercent: uloData?.totalBillSavingsPercent || parseFloat(leadFields.ulo_total_bill_savings_percent) || 0,
          totalOffset: uloData?.totalOffset || parseFloat(leadFields.ulo_total_offset) || 0, // Add totalOffset for energy offset display
        }
      }
    }
    
    // If still no data, try to extract from peakShaving nested structure
    if (!touData && peakShaving?.tou) {
      const touCombined = peakShaving.tou?.allResults?.combined?.combined || 
                         peakShaving.tou?.combined?.combined ||
                         peakShaving.tou?.combined
      touData = {
        beforeSolar: touCombined?.baselineAnnualBill || leadFields?.tou_before_solar || 0,
        afterSolar: touCombined?.postSolarBatteryAnnualBill || leadFields?.tou_after_solar || 0,
        annualSavings: touCombined?.annual || peakShaving.tou?.result?.annualSavings || leadFields?.tou_annual_savings || 0,
        monthlySavings: touCombined?.monthly || peakShaving.tou?.result?.monthlySavings || leadFields?.tou_monthly_savings || 0,
        paybackPeriod: touCombined?.projection?.paybackYears || leadFields?.tou_payback_period || 0,
        profit25Year: touCombined?.projection?.netProfit25Year || leadFields?.tou_profit_25_year || 0,
        totalBillSavingsPercent: leadFields?.tou_total_bill_savings_percent || 0,
      }
    }
    
    if (!uloData && peakShaving?.ulo) {
      const uloCombined = peakShaving.ulo?.allResults?.combined?.combined || 
                         peakShaving.ulo?.combined?.combined ||
                         peakShaving.ulo?.combined
      uloData = {
        beforeSolar: uloCombined?.baselineAnnualBill || leadFields?.ulo_before_solar || 0,
        afterSolar: uloCombined?.postSolarBatteryAnnualBill || leadFields?.ulo_after_solar || 0,
        annualSavings: uloCombined?.annual || peakShaving.ulo?.result?.annualSavings || leadFields?.ulo_annual_savings || 0,
        monthlySavings: uloCombined?.monthly || peakShaving.ulo?.result?.monthlySavings || leadFields?.ulo_monthly_savings || 0,
        paybackPeriod: uloCombined?.projection?.paybackYears || leadFields?.ulo_payback_period || 0,
        profit25Year: uloCombined?.projection?.netProfit25Year || leadFields?.ulo_profit_25_year || 0,
        totalBillSavingsPercent: leadFields?.ulo_total_bill_savings_percent || 0,
      }
    }
    
    // Calculate annual savings from before/after (same as step 4)
    const touAnnualSavings = touData?.beforeSolar && touData?.afterSolar !== undefined
      ? touData.beforeSolar - touData.afterSolar
      : touData?.annualSavings || 0
    const uloAnnualSavings = uloData?.beforeSolar && uloData?.afterSolar !== undefined
      ? uloData.beforeSolar - uloData.afterSolar
      : uloData?.annualSavings || 0
    
    if (isSimplifiedData) {
      // Extract TOU/ULO data - prioritize leadFields (database) for beforeSolar/afterSolar
      // since those are the correct values saved from calculations
      let touData = simplifiedData.tou
      let uloData = simplifiedData.ulo
      
      // For easy mode (quick estimate), prioritize leadFields values for beforeSolar/afterSolar
      // These are the correct values calculated and saved to the database
      if (leadFields) {
        const touBefore = parseFloat(leadFields.tou_before_solar) || 0
        const touAfter = parseFloat(leadFields.tou_after_solar) || 0
        const uloBefore = parseFloat(leadFields.ulo_before_solar) || 0
        const uloAfter = parseFloat(leadFields.ulo_after_solar) || 0
        
        // If we have database values, use them (they're the source of truth)
        if (touBefore > 0 || touAfter >= 0) {
          touData = {
            ...touData,
            beforeSolar: touBefore,
            afterSolar: touAfter,
            // Calculate annual savings from before/after (same as step 4)
            annualSavings: touBefore > 0 && touAfter >= 0 ? touBefore - touAfter : (touData?.annualSavings || parseFloat(leadFields.tou_annual_savings) || 0),
            monthlySavings: touData?.monthlySavings || parseFloat(leadFields.tou_monthly_savings) || 0,
            paybackPeriod: touData?.paybackPeriod || parseFloat(leadFields.tou_payback_period) || 0,
            profit25Year: touData?.profit25Year || parseFloat(leadFields.tou_profit_25_year) || 0,
            totalBillSavingsPercent: touData?.totalBillSavingsPercent || parseFloat(leadFields.tou_total_bill_savings_percent) || 0,
            totalOffset: touData?.totalOffset || parseFloat(leadFields.tou_total_offset) || 0, // Add totalOffset for energy offset display
          }
        }
        
        if (uloBefore > 0 || uloAfter >= 0) {
          uloData = {
            ...uloData,
            beforeSolar: uloBefore,
            afterSolar: uloAfter,
            // Calculate annual savings from before/after (same as step 4)
            annualSavings: uloBefore > 0 && uloAfter >= 0 ? uloBefore - uloAfter : (uloData?.annualSavings || parseFloat(leadFields.ulo_annual_savings) || 0),
            monthlySavings: uloData?.monthlySavings || parseFloat(leadFields.ulo_monthly_savings) || 0,
            paybackPeriod: uloData?.paybackPeriod || parseFloat(leadFields.ulo_payback_period) || 0,
            profit25Year: uloData?.profit25Year || parseFloat(leadFields.ulo_profit_25_year) || 0,
            totalBillSavingsPercent: uloData?.totalBillSavingsPercent || parseFloat(leadFields.ulo_total_bill_savings_percent) || 0,
            totalOffset: uloData?.totalOffset || parseFloat(leadFields.ulo_total_offset) || 0, // Add totalOffset for energy offset display
          }
        }
      }
      
      // If still no data, try to extract from peakShaving nested structure
      if (!touData && peakShaving?.tou) {
        const touCombined = peakShaving.tou?.allResults?.combined?.combined || 
                           peakShaving.tou?.combined?.combined ||
                           peakShaving.tou?.combined
        touData = {
          beforeSolar: touCombined?.baselineAnnualBill || leadFields?.tou_before_solar || 0,
          afterSolar: touCombined?.postSolarBatteryAnnualBill || leadFields?.tou_after_solar || 0,
          annualSavings: touCombined?.annual || peakShaving.tou?.result?.annualSavings || leadFields?.tou_annual_savings || 0,
          monthlySavings: touCombined?.monthly || peakShaving.tou?.result?.monthlySavings || leadFields?.tou_monthly_savings || 0,
          paybackPeriod: touCombined?.projection?.paybackYears || leadFields?.tou_payback_period || 0,
          profit25Year: touCombined?.projection?.netProfit25Year || leadFields?.tou_profit_25_year || 0,
          totalBillSavingsPercent: leadFields?.tou_total_bill_savings_percent || 0,
        }
      }
      
      if (!uloData && peakShaving?.ulo) {
        const uloCombined = peakShaving.ulo?.allResults?.combined?.combined || 
                           peakShaving.ulo?.combined?.combined ||
                           peakShaving.ulo?.combined
        uloData = {
          beforeSolar: uloCombined?.baselineAnnualBill || leadFields?.ulo_before_solar || 0,
          afterSolar: uloCombined?.postSolarBatteryAnnualBill || leadFields?.ulo_after_solar || 0,
          annualSavings: uloCombined?.annual || peakShaving.ulo?.result?.annualSavings || leadFields?.ulo_annual_savings || 0,
          monthlySavings: uloCombined?.monthly || peakShaving.ulo?.result?.monthlySavings || leadFields?.ulo_monthly_savings || 0,
          paybackPeriod: uloCombined?.projection?.paybackYears || leadFields?.ulo_payback_period || 0,
          profit25Year: uloCombined?.projection?.netProfit25Year || leadFields?.ulo_profit_25_year || 0,
          totalBillSavingsPercent: leadFields?.ulo_total_bill_savings_percent || 0,
        }
      }
      
      // Calculate annual savings from before/after (same as step 4)
      const touAnnualSavings = touData?.beforeSolar && touData?.afterSolar !== undefined
        ? touData.beforeSolar - touData.afterSolar
        : touData?.annualSavings || 0
      const uloAnnualSavings = uloData?.beforeSolar && uloData?.afterSolar !== undefined
        ? uloData.beforeSolar - uloData.afterSolar
        : uloData?.annualSavings || 0
      
      // For quick estimates, prioritize calculated value from full_data_json over database value
      // The calculated value (6.5 kW from 13 panels) is more accurate than stored database value (6.7 kW)
      // Calculate from numPanels first: 13 panels * 500W = 6.5 kW
      const systemSizeKw = simplifiedData.estimate?.system?.sizeKw ||  // Calculated value from step review (6.5 kW)
                           (simplifiedData.numPanels ? (simplifiedData.numPanels * 500) / 1000 : 0) ||  // Calculate from numPanels in simplifiedData (13 * 500 / 1000 = 6.5)
                           (simplifiedData.estimate?.system?.numPanels ? (simplifiedData.estimate.system.numPanels * 500) / 1000 : 0) ||  // Calculate from estimate.numPanels
                           simplifiedData.systemSizeKw ||              // Direct value in simplifiedData
                           (leadFields?.num_panels ? (parseFloat(String(leadFields.num_panels)) * 500) / 1000 : 0) ||  // Calculate from database num_panels (13 * 500 / 1000 = 6.5)
                           (leadFields?.system_size_kw ? parseFloat(String(leadFields.system_size_kw)) : 0) || 0  // Fallback to database value (6.7)
      
      const numPanels = simplifiedData.numPanels ||                    // From simplifiedData (13)
                       simplifiedData.estimate?.system?.numPanels ||   // From estimate (13)
                       (leadFields?.num_panels ? parseFloat(String(leadFields.num_panels)) : 0) || 0  // From database (13)
      
      // Normalize cost inputs from simplified data / estimate / database
      const systemCostFromSimplified =
        simplifiedData.costs?.systemCost ??
        simplifiedData.estimate?.costs?.systemCost
      const batteryCostFromSimplified =
        simplifiedData.costs?.batteryCost ??
        simplifiedData.estimate?.costs?.batteryCost
      const solarRebateFromSimplified =
        simplifiedData.costs?.solarRebate ??
        simplifiedData.estimate?.costs?.solarRebate ??
        simplifiedData.estimate?.costs?.incentives
      const batteryRebateFromSimplified =
        simplifiedData.costs?.batteryRebate ??
        simplifiedData.estimate?.costs?.batteryRebate

      const dbSystemCost =
        leadFields?.system_cost != null ? parseFloat(String(leadFields.system_cost)) || 0 : 0
      const dbBatteryCost =
        leadFields?.battery_cost != null ? parseFloat(String(leadFields.battery_cost)) || 0 : 0
      const dbSolarRebate =
        leadFields?.solar_rebate != null ? parseFloat(String(leadFields.solar_rebate)) || 0 : 0
      const dbBatteryRebate =
        leadFields?.battery_rebate != null ? parseFloat(String(leadFields.battery_rebate)) || 0 : 0

      const systemCost = (systemCostFromSimplified ?? dbSystemCost ?? 0) || 0
      let batteryCost = (batteryCostFromSimplified ?? dbBatteryCost ?? 0) || 0
      const solarRebate = (solarRebateFromSimplified ?? dbSolarRebate ?? 0) || 0
      const batteryRebate = (batteryRebateFromSimplified ?? dbBatteryRebate ?? 0) || 0

      // Fallback: if batteryCost is still 0 but we have selected batteries in the
      // simplified payload, rebuild batteryCost from BATTERY_SPECS so that tracking
      // correctly shows the Battery Cost row (especially for net metering flows).
      if (!batteryCost) {
        const selectedBatteryIds: string[] =
          (Array.isArray(simplifiedData.selectedBatteryIds) && simplifiedData.selectedBatteryIds.length > 0
            ? simplifiedData.selectedBatteryIds
            : Array.isArray((simplifiedData as any).selectedBatteries) && (simplifiedData as any).selectedBatteries.length > 0
            ? (simplifiedData as any).selectedBatteries
            : Array.isArray(simplifiedData.peakShaving?.selectedBatteries) && simplifiedData.peakShaving.selectedBatteries.length > 0
            ? simplifiedData.peakShaving.selectedBatteries
            : simplifiedData.peakShaving?.selectedBattery && typeof simplifiedData.peakShaving.selectedBattery === 'string'
            ? simplifiedData.peakShaving.selectedBattery.split(',').map((id: string) => id.trim())
            : []) as string[]

        if (selectedBatteryIds.length > 0) {
          batteryCost = selectedBatteryIds
            .map(id => BATTERY_SPECS.find(b => b.id === id))
            .filter(Boolean)
            .reduce((sum, battery) => sum + (battery?.price || 0), 0)
        }
      }

      // For estimate.costs.totalCost, keep solar-only cost (matches StepReview semantics).
      // Combined system + battery total is exposed separately via combinedTotalCost.
      const solarOnlyTotalCost = systemCost
      const combinedTotalCost = systemCost + batteryCost

      const netCostFromSimplified =
        simplifiedData.costs?.netCost ??
        simplifiedData.estimate?.costs?.netCost
      const dbNetCost =
        leadFields?.net_cost != null ? parseFloat(String(leadFields.net_cost)) || 0 : 0

      // For net metering, there are no rebates and the user's total investment should be
      // the full solar + battery system cost. Older flows often saved solar-only netCost,
      // so for net metering we explicitly ignore that and use the combined total instead.
      const isNetMeteringProgram =
        simplifiedData.programType === 'net_metering' ||
        simplifiedData.program_type === 'net_metering'

      const combinedNetCost = isNetMeteringProgram
        ? combinedTotalCost
        : (netCostFromSimplified ??
            (combinedTotalCost - solarRebate - batteryRebate) ??
            dbNetCost) || 0
      
      const transformed = {
        estimate: {
          system: {
            sizeKw: systemSizeKw,
            numPanels: numPanels,
          },
          production: simplifiedData.production || (leadFields ? {
            annualKwh: parseFloat(leadFields.production_annual_kwh) || 0,
            monthlyKwh: Array.isArray(leadFields.production_monthly_kwh) 
              ? leadFields.production_monthly_kwh.map((v: any) => parseFloat(v) || 0)
              : typeof leadFields.production_monthly_kwh === 'string'
                ? JSON.parse(leadFields.production_monthly_kwh).map((v: any) => parseFloat(v) || 0)
                : [],
            dailyAverageKwh: parseFloat(leadFields.production_daily_average_kwh) || 0,
          } : {
            annualKwh: 0,
            monthlyKwh: [],
            dailyAverageKwh: 0,
          }),
          costs: {
            ...(simplifiedData.costs || simplifiedData.estimate?.costs || {}),
            systemCost,
            batteryCost,
            solarRebate,
            batteryRebate,
            netCost: combinedNetCost,
            // Solar-only total cost; combined total is exposed via combinedTotalCost.
            totalCost: solarOnlyTotalCost,
            incentives:
              simplifiedData.costs?.incentives ??
              simplifiedData.estimate?.costs?.incentives ??
              solarRebate + batteryRebate,
          },
          savings: {
            annualSavings: Math.max(touAnnualSavings, uloAnnualSavings) || 0,
            monthlySavings: Math.max(touAnnualSavings, uloAnnualSavings) / 12 || 0,
            paybackYears: touData?.paybackPeriod || uloData?.paybackPeriod || 0,
            lifetimeSavings: (touData?.profit25Year || uloData?.profit25Year || 0),
          },
          environmental: simplifiedData.environmental || (leadFields ? {
            co2OffsetTonsPerYear: parseFloat(leadFields.co2_offset_tons_per_year) || 0,
            treesEquivalent: parseFloat(leadFields.trees_equivalent) || 0,
            carsOffRoadEquivalent: parseFloat(leadFields.cars_off_road_equivalent) || 0,
          } : undefined),
        },
        leadData: {
          firstName: simplifiedData.fullName?.split(' ')[0] || '',
          lastName: simplifiedData.fullName?.split(' ').slice(1).join(' ') || '',
          email: simplifiedData.email || '',
          address: simplifiedData.address || '',
          province: simplifiedData.province || 'ON',
        },
        solarOverride: {
          sizeKw: systemSizeKw, // Use the same extracted systemSizeKw
          numPanels: numPanels,  // Use the same extracted numPanels
        },
        solarRebate: simplifiedData.costs?.solarRebate || 
                    simplifiedData.estimate?.costs?.solarRebate || 
                    simplifiedData.estimate?.costs?.incentives || 
                    solarRebate,
        batteryRebate: simplifiedData.costs?.batteryRebate || 
                      simplifiedData.estimate?.costs?.batteryRebate || 
                      batteryRebate,
        combinedTotalCost,
        combinedNetCost,
        // Set displayPlan to show which is better, but both plans will be displayed for comparison
        // Don't set displayPlan if we want to show both plans equally
        displayPlan: uloAnnualSavings > 0 && touAnnualSavings > 0
          ? (uloAnnualSavings > touAnnualSavings ? 'ulo' : 'tou')
          : (uloAnnualSavings > 0 ? 'ulo' : touAnnualSavings > 0 ? 'tou' : undefined),
        mapSnapshot: simplifiedData.mapSnapshot,
        roofData: {
          roofAreaSqft: simplifiedData.roofAreaSqft || 
                       (leadFields?.roof_area_sqft ? parseFloat(String(leadFields.roof_area_sqft)) : 0) ||
                       (leadFields?.roof_area_square_feet ? parseFloat(String(leadFields.roof_area_square_feet)) : 0),
          roofType: simplifiedData.roofType || leadFields?.roof_type || '',
          roofPitch: simplifiedData.roofPitch || leadFields?.roof_pitch || '',
          shadingLevel: simplifiedData.shadingLevel || leadFields?.shading_level || '',
          roofAge: simplifiedData.roofAge || leadFields?.roof_age || '',
          roofPolygon: simplifiedData.roofPolygon || leadFields?.roof_polygon || null,
        },
        photos: (() => {
          // Helper to construct full Supabase Storage URL from filename/path
          const constructSupabaseUrl = (filenameOrPath: string): string | null => {
            if (!filenameOrPath || typeof filenameOrPath !== 'string') return null
            
            // If already a full URL, return as-is
            if (filenameOrPath.startsWith('http://') || filenameOrPath.startsWith('https://') || filenameOrPath.startsWith('data:')) {
              return filenameOrPath
            }
            
            // If it's just a filename (UUID-like), try to construct Supabase Storage URL
            // Format: https://{project}.supabase.co/storage/v1/object/public/photos/{path}
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            if (!supabaseUrl) return null
            
            // If path already includes 'photos/', use it directly
            if (filenameOrPath.includes('/')) {
              // Remove 'photos/' prefix if present (it's added by the storage path)
              const path = filenameOrPath.startsWith('photos/') ? filenameOrPath : `photos/${filenameOrPath}`
              return `${supabaseUrl}/storage/v1/object/public/${path}`
            }
            
            // If it's just a filename, try common folder structures
            // Photos are stored as: photos/{category}/{year}/{month}/{random}-{filename}
            // Try to find it in common categories and recent dates
            const now = new Date()
            const year = now.getFullYear()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const categories = ['roof', 'electrical', 'general', 'other']
            
            // Try the most likely path first (current year/month)
            for (const category of categories) {
              const path = `photos/${category}/${year}/${month}/${filenameOrPath}`
              // Return the constructed URL (browser will try to load it)
              // If it fails, the onError handler will hide it
              return `${supabaseUrl}/storage/v1/object/public/${path}`
            }
            
            // Fallback: try direct in photos bucket
            return `${supabaseUrl}/storage/v1/object/public/photos/${filenameOrPath}`
          }
          
          // First try simplifiedData.photos (already formatted)
          if (simplifiedData.photos && Array.isArray(simplifiedData.photos) && simplifiedData.photos.length > 0) {
            // Process and filter photos
            return simplifiedData.photos
              .map((photo: any) => {
                const url = photo.preview || photo.url || photo.uploadedUrl
                if (!url) return null
                
                // If it's already a valid URL, return as-is
                if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
                  return photo
                }
                
                // Try to construct full URL from filename
                const fullUrl = constructSupabaseUrl(url)
                if (fullUrl) {
                  return {
                    ...photo,
                    preview: fullUrl,
                    url: fullUrl,
                    uploadedUrl: fullUrl,
                  }
                }
                
                return null
              })
              .filter(Boolean)
          }
          
          // Try leadFields.photo_urls (from database)
          const photoUrls = leadFields?.photo_urls
          if (photoUrls) {
            const urls = Array.isArray(photoUrls) ? photoUrls : (typeof photoUrls === 'string' ? JSON.parse(photoUrls || '[]') : [])
            // Convert URL strings to photo objects with preview property
            return urls
              .map((url: string) => {
                if (!url) return null
                
                // If already a full URL, use it
                if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
                  return {
                    preview: url,
                    url: url,
                    uploadedUrl: url,
                  }
                }
                
                // Try to construct full URL
                const fullUrl = constructSupabaseUrl(url)
                if (fullUrl) {
                  return {
                    preview: fullUrl,
                    url: fullUrl,
                    uploadedUrl: fullUrl,
                  }
                }
                
                return null
              })
              .filter(Boolean)
          }
          
          return []
        })(),
        photoSummary: simplifiedData.photoSummary || (leadFields?.photo_summary ? (typeof leadFields.photo_summary === 'string' ? JSON.parse(leadFields.photo_summary) : leadFields.photo_summary) : undefined),
        monthlyBill: typeof simplifiedData.monthlyBill === 'string' 
          ? parseFloat(simplifiedData.monthlyBill) 
          : simplifiedData.monthlyBill || 
            (leadFields?.monthly_bill ? parseFloat(String(leadFields.monthly_bill)) : undefined),
        energyUsage: (() => {
          // First try direct energyUsage object
          if (simplifiedData.energyUsage) {
            return simplifiedData.energyUsage
          }
          
          // Try to extract from net metering data (for net metering flows)
          const netMetering = simplifiedData.netMetering
          if (netMetering) {
            const touTotalLoad = netMetering.tou?.annual?.totalLoad
            const uloTotalLoad = netMetering.ulo?.annual?.totalLoad
            const tieredTotalLoad = netMetering.tiered?.annual?.totalLoad
            const annualKwh = touTotalLoad || uloTotalLoad || tieredTotalLoad || 0
            
            if (annualKwh > 0) {
              return {
                annualKwh,
                monthlyKwh: annualKwh / 12,
                dailyKwh: annualKwh / 365,
              }
            }
          }
          
          // Try energy_usage field from leadFields
          if (leadFields?.energy_usage) {
            const energyUsage = typeof leadFields.energy_usage === 'string' 
              ? JSON.parse(leadFields.energy_usage) 
              : leadFields.energy_usage
            if (energyUsage?.annualKwh || energyUsage?.annual_kwh) {
              return {
                annualKwh: energyUsage.annualKwh || energyUsage.annual_kwh || 0,
                monthlyKwh: energyUsage.monthlyKwh || energyUsage.monthly_kwh || (energyUsage.annualKwh || energyUsage.annual_kwh || 0) / 12,
                dailyKwh: energyUsage.dailyKwh || energyUsage.daily_kwh || (energyUsage.annualKwh || energyUsage.annual_kwh || 0) / 365,
              }
            }
          }
          
          // Try annualUsageKwh field
          if (simplifiedData.annualUsageKwh) {
            return {
          annualKwh: simplifiedData.annualUsageKwh,
          monthlyKwh: simplifiedData.annualUsageKwh / 12,
          dailyKwh: simplifiedData.annualUsageKwh / 365,
            }
          }
          
          // Try leadFields annual_usage_kwh
          if (leadFields?.annual_usage_kwh) {
            return {
                       annualKwh: parseFloat(String(leadFields.annual_usage_kwh)),
                       monthlyKwh: parseFloat(String(leadFields.annual_usage_kwh)) / 12,
                       dailyKwh: parseFloat(String(leadFields.annual_usage_kwh)) / 365,
            }
          }
          
          return undefined
        })(),
        // Transform tou/ulo to match ResultsPage expected structure
        // Use extracted touData/uloData (from simplifiedData, peakShaving, or leadFields)
        tou: touData ? (() => {
          const before = touData.beforeSolar || 0
          const after = touData.afterSolar || 0
          const annualSavings = touAnnualSavings
          const monthlySavings = touData.monthlySavings || annualSavings / 12
          const paybackPeriod = touData.paybackPeriod || 0
          const profit25Year = touData.profit25Year || 0
          
          return {
          // For SavingsTab
          result: {
              annualSavings,
              monthlySavings,
          },
          // For ResultsPage nested structure
          combined: {
            combined: {
                annual: annualSavings,
                monthly: monthlySavings,
                baselineAnnualBill: before,
                postSolarBatteryAnnualBill: after,
              },
              combinedAnnualSavings: annualSavings,
              combinedMonthlySavings: monthlySavings,
              projection: {
                paybackYears: paybackPeriod,
                netProfit25Year: profit25Year,
              },
          },
          allResults: {
            combined: {
              combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                  projection: {
                    paybackYears: paybackPeriod,
                    netProfit25Year: profit25Year,
                  },
                },
            },
          },
          // Include all original simplified data for direct access
            beforeSolar: before,
            afterSolar: after,
            paybackPeriod: paybackPeriod,
            profit25Year: profit25Year,
            totalOffset: touData.totalOffset || 0,
            totalBillSavingsPercent: touData.totalBillSavingsPercent || 0,
            ...touData,
          }
        })() : undefined,
        ulo: uloData ? (() => {
          const before = uloData.beforeSolar || 0
          const after = uloData.afterSolar || 0
          const annualSavings = uloAnnualSavings
          const monthlySavings = uloData.monthlySavings || annualSavings / 12
          const paybackPeriod = uloData.paybackPeriod || 0
          const profit25Year = uloData.profit25Year || 0
          
          return {
          // For SavingsTab
          result: {
              annualSavings,
              monthlySavings,
            },
            // For ResultsPage nested structure
            combined: {
              combined: {
                annual: annualSavings,
                monthly: monthlySavings,
                baselineAnnualBill: before,
                postSolarBatteryAnnualBill: after,
              },
              combinedAnnualSavings: annualSavings,
              combinedMonthlySavings: monthlySavings,
              projection: {
                paybackYears: paybackPeriod,
                netProfit25Year: profit25Year,
              },
            },
            allResults: {
              combined: {
                combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                  projection: {
                    paybackYears: paybackPeriod,
                    netProfit25Year: profit25Year,
                  },
                },
              },
            },
            // Include all original simplified data for direct access
            beforeSolar: before,
            afterSolar: after,
            paybackPeriod: paybackPeriod,
            profit25Year: profit25Year,
            totalOffset: uloData.totalOffset || 0,
            totalBillSavingsPercent: uloData.totalBillSavingsPercent || 0,
            ...uloData,
          }
        })() : undefined,
        peakShaving: {
          tou: touData ? (() => {
            const before = touData.beforeSolar || 0
            const after = touData.afterSolar || 0
            const annualSavings = touAnnualSavings
            const monthlySavings = touData.monthlySavings || annualSavings / 12
            
            return {
              combined: {
                combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                },
                combinedAnnualSavings: annualSavings,
                combinedMonthlySavings: monthlySavings,
              },
              allResults: {
                combined: {
                  combined: {
                    annual: annualSavings,
                    monthly: monthlySavings,
                    baselineAnnualBill: before,
                    postSolarBatteryAnnualBill: after,
                  },
                },
              },
            }
          })() : undefined,
          ulo: uloData ? (() => {
            const before = uloData.beforeSolar || 0
            const after = uloData.afterSolar || 0
            const annualSavings = uloAnnualSavings
            const monthlySavings = uloData.monthlySavings || annualSavings / 12
            
            return {
              combined: {
                combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                },
                combinedAnnualSavings: annualSavings,
                combinedMonthlySavings: monthlySavings,
              },
              allResults: {
                combined: {
                  combined: {
                    annual: annualSavings,
                    monthly: monthlySavings,
                    baselineAnnualBill: before,
                    postSolarBatteryAnnualBill: after,
                  },
                },
              },
            }
          })() : undefined,
          ratePlan: uloAnnualSavings > 0 && touAnnualSavings > 0
            ? (uloAnnualSavings > touAnnualSavings ? 'ulo' : 'tou')
            : 'tou',
          // Include touBeforeAfter and uloBeforeAfter from extracted data (from step 4, peakShaving, or database fields)
          touBeforeAfter: touData && touData.beforeSolar && touData.afterSolar !== undefined
            ? {
                before: touData.beforeSolar,
                after: touData.afterSolar,
                savings: touAnnualSavings
              }
            : null,
          uloBeforeAfter: uloData && uloData.beforeSolar && uloData.afterSolar !== undefined
            ? {
                before: uloData.beforeSolar,
                after: uloData.afterSolar,
                savings: uloAnnualSavings
              }
            : null,
        },
        // Extract net metering data
        netMetering: simplifiedData.netMetering || undefined,
        // Selected financing / payment method
        financingOption:
          simplifiedData.financingOption ||
          (leadFields?.financing_option as string | undefined) ||
          (leadFields?.financing_preference as string | undefined) ||
          undefined,
        // Extract add-ons
        addOns: (() => {
          const selectedAddOns = simplifiedData.selectedAddOns || simplifiedData.selected_add_ons || leadFields?.selected_add_ons || []
          if (Array.isArray(selectedAddOns) && selectedAddOns.length > 0) {
            // Helper to get add-on display name
            const getAddOnName = (id: string): string => {
              const names: Record<string, string> = {
                'ev_charger': 'EV Charger',
                'heat_pump': 'Heat Pump',
                'new_roof': 'New Roof',
                'water_heater': 'Water Heater',
                'battery': 'Battery Storage'
              }
              return names[id] || id.replace(/_/g, ' ')
            }
            return selectedAddOns.map((id: string) => ({
              id,
              name: getAddOnName(id)
            }))
          }
          return []
        })(),
      }
      
      return transformed
    }
    
    return {
      estimate: simplifiedData?.estimate || {
        system: { sizeKw: 0, numPanels: 0 },
        production: { annualKwh: 0, monthlyKwh: [] },
        costs: { totalCost: 0, netCost: 0, incentives: 0 },
        savings: { annualSavings: 0, monthlySavings: 0, paybackYears: 0 },
      },
      leadData: simplifiedData?.leadData || {},
      batteryImpact: simplifiedData?.batteryImpact,
      peakShaving: simplifiedData?.peakShaving,
      solarRebate: simplifiedData?.solarRebate,
      batteryRebate: simplifiedData?.batteryRebate,
      combinedTotalCost: simplifiedData?.combinedTotalCost,
      combinedNetCost: simplifiedData?.combinedNetCost,
      displayPlan: simplifiedData?.displayPlan,
      solarOverride: simplifiedData?.solarOverride,
      selectedBattery: simplifiedData?.selectedBattery,
      batteryDetails: simplifiedData?.batteryDetails,
      mapSnapshot: simplifiedData?.mapSnapshot,
      roofData: simplifiedData?.roofData,
      photos: simplifiedData?.photos || [],
      photoSummary: simplifiedData?.photoSummary,
      monthlyBill: simplifiedData?.monthlyBill,
      energyUsage: simplifiedData?.energyUsage,
      appliances: simplifiedData?.appliances || [],
      addOns: simplifiedData?.addOns || [],
      tou: simplifiedData?.tou,
      ulo: simplifiedData?.ulo,
      ...simplifiedData, // Spread original data to preserve any additional fields
    }
  }

  useEffect(() => {
    // Get lead ID from URL params
    const leadId = searchParams.get('leadId')
    
    // Try to get leadId from sessionStorage (for immediate redirect)
    // If not in sessionStorage, use leadId from URL
    let sessionData: any = null
    try {
      const sessionResults = sessionStorage.getItem('calculatorResults')
      if (sessionResults) {
        sessionData = JSON.parse(sessionResults)
        console.log('🔍 Found sessionStorage data:', sessionData)
      }
    } catch (e) {
      console.warn('Failed to parse sessionStorage data:', e)
    }
    
    // Use leadId from sessionStorage or URL
    const effectiveLeadId = sessionData?.leadId || leadId
    
    // If we have a leadId, fetch from database
    if (effectiveLeadId && !effectiveLeadId.startsWith('mock-')) {
      console.log('🔍 Fetching data from database for leadId:', effectiveLeadId)
      
      // Fetch lead data from API
      fetch(`/api/leads/${effectiveLeadId}`)
        .then(async res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch lead: ${res.status} ${res.statusText}`)
          }
          const text = await res.text()
          if (!text) {
            throw new Error('Empty response from server')
          }
          try {
            return JSON.parse(text)
          } catch (e) {
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
          }
        })
        .then(data => {
          if (data.success) {
            const lead = data.lead
            console.log('✅ Fetched lead from database:', {
              leadId: effectiveLeadId,
              hasFullDataJson: !!lead.full_data_json,
              hasHrsResidentialData: !!lead.hrs_residential_data,
            })
            
            // Check if this is HRS residential lead with simplified data structure
            // full_data_json is the simplified data structure saved from StepContact
            if (lead.full_data_json) {
              // full_data_json is already parsed by the API
              const simplifiedData = lead.full_data_json
              console.log('✅ Found full_data_json, transforming:', {
                hasTou: !!simplifiedData.tou,
                hasUlo: !!simplifiedData.ulo,
                hasCosts: !!simplifiedData.costs,
                hasProduction: !!simplifiedData.production,
                hasPeakShaving: !!simplifiedData.peakShaving,
                hasHrsData: !!lead.hrs_residential_data,
              })
              // Pass lead.hrs_residential_data as leadFields, but also include lead.photo_urls if available
              const leadFieldsWithPhotos = {
                ...lead.hrs_residential_data,
                photo_urls: lead.photo_urls ?? lead.hrs_residential_data?.photo_urls,
                photo_summary: lead.photo_summary ?? lead.hrs_residential_data?.photo_summary,
              }
              const transformedData = transformSimplifiedData(simplifiedData, leadFieldsWithPhotos)
              
              setEstimate(transformedData.estimate)
              setLeadData(transformedData.leadData || {})
              setBatteryImpact(transformedData.batteryImpact)
              setPeakShaving(transformedData.peakShaving)
              setSolarRebate(transformedData.solarRebate)
              setBatteryRebate(transformedData.batteryRebate)
              setCombinedTotalCost(transformedData.combinedTotalCost)
              setCombinedNetCost(transformedData.combinedNetCost)
              setDisplayPlan(transformedData.displayPlan)
              setSolarOverride(transformedData.solarOverride)
              setSelectedBattery(transformedData.selectedBattery)
              setBatteryDetails(transformedData.batteryDetails)
              setMapSnapshot(transformedData.mapSnapshot)
              setRoofData(transformedData.roofData)
              setPhotos(transformedData.photos || [])
              setPhotoSummary(transformedData.photoSummary)
              setMonthlyBill(transformedData.monthlyBill)
              setEnergyUsage(transformedData.energyUsage)
              setAppliances(transformedData.appliances || [])
              setAddOns(transformedData.addOns || [])
              setTou(transformedData.tou)
              setUlo(transformedData.ulo)
              setProgramType(simplifiedData.programType || lead.program_type || undefined)
              setFinancingOption(transformedData.financingOption || simplifiedData.financingOption || lead.hrs_residential_data?.financing_option || lead.hrs_residential_data?.financing_preference)
              // Extract net metering data if present
              setNetMetering(transformedData.netMetering || simplifiedData.netMetering || undefined)
              setLoading(false)
              // Clear sessionStorage after reading
              sessionStorage.removeItem('calculatorResults')
              console.log('✅ Results loaded from database successfully')
              return
            }
            
            // Fallback: try to construct from lead fields if full_data_json not available
            console.warn('⚠️ No full_data_json found, constructing from lead fields')
            setEstimate({
              system: {
                sizeKw: lead.system_size_kw || 0,
                numPanels: lead.num_panels || 0,
              },
              production: {
                annualKwh: lead.production_annual_kwh || 0,
                monthlyKwh: lead.production_monthly_kwh || [],
              },
              costs: {
                totalCost: lead.solar_total_cost || 0,
                netCost: lead.solar_net_cost || 0,
                incentives: lead.solar_incentives || 0,
              },
              savings: {
                annualSavings: lead.solar_annual_savings || 0,
                monthlySavings: lead.solar_monthly_savings || 0,
                paybackYears: lead.payback_years || 0,
              },
            })
            setLeadData({
              firstName: lead.full_name?.split(' ')[0] || '',
              lastName: lead.full_name?.split(' ').slice(1).join(' ') || '',
              email: lead.email || '',
              address: lead.address || '',
              province: lead.province || 'ON',
            })
            setLoading(false)
            sessionStorage.removeItem('calculatorResults')
            return
          }
        })
        .catch(err => {
          console.error('Error fetching lead from database:', err)
          setLoading(false)
        })
      
      return // Exit early, don't try localStorage/sessionStorage
    }
    
    // Fallback: try sessionStorage for backward compatibility (old format)
    const storedResults = sessionStorage.getItem('calculatorResults')
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults)
        
        // If it's just a leadId, fetch from database
        if (results.leadId) {
          console.log('🔍 Found leadId in sessionStorage, fetching from database:', results.leadId)
          // Will be handled by the fetch above on next render
          return
        }
        
        // Otherwise, it's the old format with full data
        console.log('📦 Loaded from sessionStorage (old format):', {
          hasEstimatorMode: !!results.estimatorMode,
          hasProgramType: !!results.programType,
          hasEstimate: !!results.estimate,
          keys: Object.keys(results),
        })
        
        // Check if this is simplified data structure and transform it
        const transformedData = transformSimplifiedData(results)
        
        // Always use transformed data if it has an estimate, otherwise check if original has estimate
        if (transformedData?.estimate) {
          console.log('✅ Using transformed data')
          setEstimate(transformedData.estimate)
          setLeadData(transformedData.leadData || {})
          setBatteryImpact(transformedData.batteryImpact)
          setPeakShaving(transformedData.peakShaving)
          setSolarRebate(transformedData.solarRebate)
          setBatteryRebate(transformedData.batteryRebate)
          setCombinedTotalCost(transformedData.combinedTotalCost)
          setCombinedNetCost(transformedData.combinedNetCost)
          setDisplayPlan(transformedData.displayPlan)
          setSolarOverride(transformedData.solarOverride)
          setSelectedBattery(transformedData.selectedBattery)
          setBatteryDetails(transformedData.batteryDetails)
          setMapSnapshot(transformedData.mapSnapshot)
          setRoofData(transformedData.roofData)
          setPhotos(transformedData.photos || [])
          setPhotoSummary(transformedData.photoSummary)
          setMonthlyBill(transformedData.monthlyBill)
          setEnergyUsage(transformedData.energyUsage)
          setAppliances(transformedData.appliances || [])
          setAddOns(transformedData.addOns || [])
          setTou(transformedData.tou)
          setUlo(transformedData.ulo)
          setProgramType(results.programType || undefined)
          setNetMetering(transformedData.netMetering || results.netMetering || undefined)
          setFinancingOption(
            transformedData.financingOption ||
              (results as any).financingOption ||
              (results as any).financingPreference,
          )
        } else if (results?.estimate) {
          // Use original structure
          console.log('✅ Using original structure')
          setEstimate(results.estimate)
          setLeadData(results.leadData || {})
          setBatteryImpact(results.batteryImpact)
          setPeakShaving(results.peakShaving)
          setSolarRebate(results.solarRebate)
          setBatteryRebate(results.batteryRebate)
          setCombinedTotalCost(results.combinedTotalCost)
          setCombinedNetCost(results.combinedNetCost)
          setDisplayPlan(results.displayPlan)
          setSolarOverride(results.solarOverride)
          setSelectedBattery(results.selectedBattery)
          setBatteryDetails(results.batteryDetails)
          setMapSnapshot(results.mapSnapshot)
          setRoofData(results.roofData)
          setPhotos(results.photos || [])
          setPhotoSummary(results.photoSummary)
          setMonthlyBill(results.monthlyBill)
          setEnergyUsage(results.energyUsage)
          setAppliances(results.appliances || [])
          setAddOns(results.addOns || [])
          setTou(results.tou)
          setUlo(results.ulo)
        } else {
          // No estimate found - set safe defaults
          console.warn('⚠️ No estimate found in data, setting defaults')
          setEstimate({
            system: { sizeKw: 0, numPanels: 0 },
            production: { annualKwh: 0, monthlyKwh: [] },
            costs: { totalCost: 0, netCost: 0, incentives: 0 },
            savings: { annualSavings: 0, monthlySavings: 0, paybackYears: 0 },
          })
          setLeadData(results?.leadData || {})
        }
        
        setLoading(false)
        // Clear sessionStorage after reading
        sessionStorage.removeItem('calculatorResults')
        console.log('✅ Results loaded from sessionStorage successfully')
        return
      } catch (err) {
        console.error('Error parsing stored results:', err)
        setLoading(false)
      }
    }
    
    // If no data found and we have a leadId, try to fetch from API
    if (effectiveLeadId && !effectiveLeadId.startsWith('mock-')) {
      // Fetch lead data and estimate from API
      fetch(`/api/leads/${leadId}`)
        .then(async res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch lead: ${res.status} ${res.statusText}`)
          }
          const text = await res.text()
          if (!text) {
            throw new Error('Empty response from server')
          }
          try {
            return JSON.parse(text)
          } catch (e) {
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
          }
        })
        .then(data => {
          if (data.success) {
            const lead = data.lead
            
            // Check if this is HRS residential lead with simplified data structure
            if (lead.hrs_residential_data || lead.full_data_json) {
              const simplifiedData = lead.full_data_json || lead.hrs_residential_data
              // Pass hrs_residential_data as leadFields so we can prioritize database values
              const transformedData = transformSimplifiedData(simplifiedData, lead.hrs_residential_data)
              
              setEstimate(transformedData.estimate)
              setLeadData(transformedData.leadData)
              setSolarRebate(transformedData.solarRebate)
              setBatteryRebate(transformedData.batteryRebate)
              setCombinedTotalCost(transformedData.combinedTotalCost)
              setCombinedNetCost(transformedData.combinedNetCost)
              setDisplayPlan(transformedData.displayPlan)
              setSolarOverride(transformedData.solarOverride)
              setMapSnapshot(transformedData.mapSnapshot)
              setRoofData(transformedData.roofData)
              setPhotos(transformedData.photos || [])
              setPhotoSummary(transformedData.photoSummary)
              setMonthlyBill(transformedData.monthlyBill)
              setEnergyUsage(transformedData.energyUsage)
              setTou(transformedData.tou)
              setUlo(transformedData.ulo)
              setPeakShaving(transformedData.peakShaving)
            } else {
              // Use original structure for old leads
              setLeadData({
                firstName: lead.full_name?.split(' ')[0],
                lastName: lead.full_name?.split(' ').slice(1).join(' '),
                email: lead.email,
                address: lead.address,
                province: lead.province,
              })
              
              // Use estimate from lead data or reconstruct from stored data
              if (lead.estimate_data) {
                setEstimate(lead.estimate_data)
              } else {
                // Fallback: reconstruct estimate from lead fields
                setEstimate({
                  system: {
                    sizeKw: lead.system_size_kw || 8.5,
                    numPanels: Math.round((lead.system_size_kw || 8.5) * 2),
                  },
                  production: {
                    annualKwh: lead.annual_production_kwh || 10200,
                    monthlyKwh: Array(12).fill((lead.annual_production_kwh || 10200) / 12),
                  },
                  costs: {
                    totalCost: lead.estimated_cost || 21250,
                    netCost: lead.net_cost_after_incentives || 16250,
                    incentives: (lead.estimated_cost || 21250) - (lead.net_cost_after_incentives || 16250),
                  },
                  savings: {
                    annualSavings: lead.annual_savings || 2160,
                    monthlySavings: (lead.annual_savings || 2160) / 12,
                    paybackYears: lead.payback_years || 7.5,
                    lifetimeSavings: (lead.annual_savings || 2160) * 25,
                  },
                  environmental: {
                    co2OffsetTonsPerYear: ((lead.annual_production_kwh || 10200) * 0.00044),
                    treesEquivalent: Math.round(((lead.annual_production_kwh || 10200) * 0.00044) * 24),
                    carsOffRoadEquivalent: ((lead.annual_production_kwh || 10200) * 0.00044) / 4.6,
                  },
                })
              }
            }
          }
        })
        .catch(err => {
          console.error('Error fetching lead:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // No lead ID or mock lead ID - show loading or error
      setLoading(false)
    }
  }, [searchParams])

  const handleMatchInstaller = async () => {
    const leadId = searchParams.get('leadId')
    if (leadId) {
      // Call API to flag lead for installer matching
      await fetch(`/api/leads/${leadId}/match-installer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const handleExportPDF = async () => {
    const leadId = searchParams.get('leadId')
    if (leadId) {
      try {
        // Fetch PDF and trigger download
        const response = await fetch(`/api/leads/${leadId}/export-pdf`)
        if (!response.ok) {
          throw new Error('Failed to generate PDF')
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `solar-estimate-${leadId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Error downloading PDF:', error)
        // Fallback: open in new tab
      window.open(`/api/leads/${leadId}/export-pdf`, '_blank')
      }
    } else {
      // Fallback: print page
      window.print()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your results. Please make sure you completed the calculator and lead form.
          </p>
          <Link href="/estimator" className="btn-primary">
            Start New Estimate
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ResultsPage
      estimate={estimate}
      leadData={leadData}
      batteryImpact={batteryImpact}
      peakShaving={peakShaving}
      solarRebate={solarRebate}
      batteryRebate={batteryRebate}
      combinedTotalCost={combinedTotalCost}
      combinedNetCost={combinedNetCost}
      displayPlan={displayPlan}
      solarOverride={solarOverride}
      selectedBattery={selectedBattery}
      batteryDetails={batteryDetails}
      mapSnapshot={mapSnapshot}
      roofData={roofData}
      photos={photos}
      photoSummary={photoSummary}
      monthlyBill={monthlyBill}
      energyUsage={energyUsage}
      appliances={appliances}
      addOns={addOns}
      tou={tou}
      ulo={ulo}
      programType={programType}
      netMetering={netMetering}
      financingOption={financingOption}
      onMatchInstaller={handleMatchInstaller}
      onExportPDF={handleExportPDF}
    />
  )
}

export default function ResultsPageRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}

