// Simplified data extraction for estimator - only saves required fields
// Used for localStorage and final submission

import { EstimatorData } from '@/app/estimator/page'
import { BATTERY_SPECS, calculateBatteryRebate } from '@/config/battery-specs'

export interface SimplifiedEstimatorData {
  // Step 0: Mode & Program selection
  estimatorMode?: 'easy' | 'detailed'
  programType?: 'quick' | 'hrs_residential' | 'net_metering'
  leadType?: 'residential' | 'commercial'
  
  // Step 1: Location
  address?: string
  coordinates?: { lat: number; lng: number }
  email?: string
  
  // Step 2: Roof (whole step)
  roofAreaSqft?: number
  roofPolygon?: any
  roofSizePreset?: string
  roofEntryMethod?: 'preset' | 'manual' | 'drawn'
  mapSnapshot?: string
  roofAzimuth?: number
  roofType?: string
  roofAge?: string
  roofPitch?: string
  shadingLevel?: string
  
  // Step 3: Property Photos
  photos?: any[] // Array of photo objects with url, uploadedUrl, or preview
  photoSummary?: any // { total: number, byCategory: Array<{category: string, count: number}> }
  
  // Step 3: Energy (whole step)
  monthlyBill?: number
  annualUsageKwh?: number
  energyUsage?: {
    dailyKwh: number
    monthlyKwh: number
    annualKwh: number
  }
  energyEntryMethod?: 'simple' | 'detailed'
  systemType?: 'battery_system' | 'grid_tied'
  hasBattery?: boolean
  annualEscalator?: number
  
  // Step 4: Battery Savings
  selectedBatteryIds?: string[] // Array of battery IDs (for multiple batteries)
  systemSizeKw?: number
  numPanels?: number
  tou?: {
    solar: number
    batterySolarCapture: number
    totalOffset: number
    buyFromGrid: number
    actualCostAfterBatteryOptimization: number
    savings: number
    annualSavings: number
    monthlySavings: number
    profit25Year: number
    paybackPeriod: number
    totalBillSavingsPercent: number
    beforeSolar: number
    afterSolar: number
  }
  ulo?: {
    solar: number
    batterySolarCapture: number
    totalOffset: number
    buyFromGrid: number
    actualCostAfterBatteryOptimization: number
    savings: number
    annualSavings: number
    monthlySavings: number
    profit25Year: number
    paybackPeriod: number
    totalBillSavingsPercent: number
    beforeSolar: number
    afterSolar: number
  }
  
  // Step 8: Review (Production, Costs, Roof Area, Environmental)
  production?: {
    annualKwh: number
    monthlyKwh: number[]
    dailyAverageKwh: number
  }
  costs?: {
    systemCost: number // Solar system cost only
    batteryCost: number // Battery cost only
    solarRebate: number // Solar rebate amount
    batteryRebate: number // Battery rebate amount
    netCost: number // Net cost after all rebates (systemCost + batteryCost - solarRebate - batteryRebate)
  }
  roofArea?: {
    squareFeet: number
    squareMeters: number
    usableSquareFeet: number
  }
  environmental?: {
    co2OffsetTonsPerYear: number
    treesEquivalent: number
    carsOffRoadEquivalent: number
  }
  
  // Step 9: Contact (whole step)
  fullName?: string
  phone?: string
  preferredContactTime?: string
  preferredContactMethod?: string
  comments?: string
  consent?: boolean
  
  // Financing option (payment method)
  financingOption?: string
  
  // Add-ons selection
  selectedAddOns?: string[]
}

/**
 * Extract simplified data from full EstimatorData
 */
export function extractSimplifiedData(data: EstimatorData): SimplifiedEstimatorData {
  const simplified: SimplifiedEstimatorData = {}
  
  // Step 0: Mode & Program selection
  if (data.estimatorMode) simplified.estimatorMode = data.estimatorMode
  if (data.programType) simplified.programType = data.programType
  if (data.leadType) simplified.leadType = data.leadType
  
  // Step 1: Location only
  if (data.address) simplified.address = data.address
  if (data.coordinates) simplified.coordinates = data.coordinates
  if (data.email) simplified.email = data.email
  
  // Step 2: Whole roof data
  if (data.roofAreaSqft !== undefined) simplified.roofAreaSqft = data.roofAreaSqft
  if (data.roofPolygon) simplified.roofPolygon = data.roofPolygon
  if (data.roofSizePreset) simplified.roofSizePreset = data.roofSizePreset
  if (data.roofEntryMethod) simplified.roofEntryMethod = data.roofEntryMethod
  if (data.mapSnapshot) simplified.mapSnapshot = data.mapSnapshot
  if (data.roofAzimuth !== undefined) simplified.roofAzimuth = data.roofAzimuth
  if (data.roofType) simplified.roofType = data.roofType
  if (data.roofAge) simplified.roofAge = data.roofAge
  if (data.roofPitch) simplified.roofPitch = data.roofPitch
  if (data.shadingLevel) simplified.shadingLevel = data.shadingLevel
  
  // Step 3: Property Photos
  if (data.photos) simplified.photos = data.photos
  if (data.photoSummary) simplified.photoSummary = data.photoSummary
  
  // Step 3: Whole energy data
  if (data.monthlyBill !== undefined) simplified.monthlyBill = data.monthlyBill
  // Extract annualUsageKwh from multiple possible sources (step 3 or step 4)
  if (data.annualUsageKwh !== undefined) {
    simplified.annualUsageKwh = data.annualUsageKwh
  } else if (data.peakShaving?.annualUsageKwh !== undefined) {
    // Fallback: get from peakShaving (step 4) if not in step 3
    simplified.annualUsageKwh = data.peakShaving.annualUsageKwh
  } else if (data.energyUsage?.annualKwh !== undefined) {
    // Fallback: get from energyUsage object
    simplified.annualUsageKwh = data.energyUsage.annualKwh
  }
  if (data.energyUsage) simplified.energyUsage = data.energyUsage
  if (data.energyEntryMethod) simplified.energyEntryMethod = data.energyEntryMethod
  if (data.systemType) simplified.systemType = data.systemType
  if (data.hasBattery !== undefined) simplified.hasBattery = data.hasBattery
  if (data.annualEscalator !== undefined) simplified.annualEscalator = data.annualEscalator
  
  // Step 4: Battery Savings - extract from peakShaving data
  // Only save selectedBatteryIds array, not the single selectedBattery string
  // This is passed separately in onComplete, not in peakShaving object
  if ((data as any).selectedBatteryIds && Array.isArray((data as any).selectedBatteryIds)) {
    simplified.selectedBatteryIds = (data as any).selectedBatteryIds
  } else if (data.peakShaving?.selectedBattery && typeof data.peakShaving.selectedBattery === 'string') {
    // Fallback: if peakShaving.selectedBattery is comma-separated, split it into array
    simplified.selectedBatteryIds = data.peakShaving.selectedBattery.split(',').map((id: string) => id.trim())
  } else if (data.selectedBattery && typeof data.selectedBattery === 'string' && data.selectedBattery.includes(',')) {
    // Fallback: if selectedBattery is comma-separated, split it into array
    simplified.selectedBatteryIds = data.selectedBattery.split(',').map((id: string) => id.trim())
  } else if (data.selectedBattery && typeof data.selectedBattery === 'string') {
    // If it's a single battery ID, convert to array
    simplified.selectedBatteryIds = [data.selectedBattery]
  }
  
  // Add-ons selection
  if ((data as any).selectedAddOns && Array.isArray((data as any).selectedAddOns)) {
    simplified.selectedAddOns = (data as any).selectedAddOns
  }
  // Round system size to nearest 0.5 (divisible by 0.5)
  if (data.solarOverride?.sizeKw !== undefined) {
    simplified.systemSizeKw = Math.round(data.solarOverride.sizeKw * 2) / 2
  } else if (data.estimate?.system?.sizeKw !== undefined) {
    simplified.systemSizeKw = Math.round(data.estimate.system.sizeKw * 2) / 2
  }
  if (data.solarOverride?.numPanels !== undefined) {
    simplified.numPanels = data.solarOverride.numPanels
  } else if (data.estimate?.system?.numPanels !== undefined) {
    simplified.numPanels = data.estimate.system.numPanels
  }
  
  // Extract TOU data from peakShaving
  if (data.peakShaving?.tou?.combined) {
    const touCombined = data.peakShaving.tou.combined
    const breakdown = touCombined.breakdown
    
    // Calculate values from breakdown
    // Solar = sum of solar allocation across all periods (offPeak + midPeak + onPeak)
    const solarAllocation = breakdown?.solarAllocation || {}
    const solar = (solarAllocation.offPeak || 0) + (solarAllocation.midPeak || 0) + (solarAllocation.onPeak || 0)
    
    // Battery solar capture = battery charged from solar excess
    // First try to get from FRD result offsetPercentages (most accurate)
    let batterySolarCapture = 0
    const annualUsageKwh = data.peakShaving?.annualUsageKwh || data.energyUsage?.annualKwh || data.annualUsageKwh || 0
    
    if (data.peakShaving.tou.result?.offsetPercentages?.solarChargedBattery) {
      // Get from FRD result offsetPercentages (percentage) and convert to kWh
      const batterySolarCapturePercent = data.peakShaving.tou.result.offsetPercentages.solarChargedBattery
      batterySolarCapture = (batterySolarCapturePercent / 100) * annualUsageKwh
    } else if (data.peakShaving.tou.result?.battSolarCharged) {
      // Fallback: use battSolarCharged directly from FRD result
      batterySolarCapture = data.peakShaving.tou.result.battSolarCharged
    } else {
      // Fallback: calculate from breakdown
      const batteryOffsets = breakdown?.batteryOffsets || {}
      const totalBatteryDischarge = (batteryOffsets.offPeak || 0) + (batteryOffsets.midPeak || 0) + (batteryOffsets.onPeak || 0)
      const gridChargedBattery = breakdown?.batteryChargeFromOffPeak || 0
      
      if (totalBatteryDischarge > 0) {
        if (gridChargedBattery > 0) {
          batterySolarCapture = Math.max(0, totalBatteryDischarge - gridChargedBattery)
        } else {
          batterySolarCapture = totalBatteryDischarge
        }
      }
    }
    // Total offset = percentage from FRD result offsetPercentages (solar + battery)
    // This is the capped percentage that matches Step 4 display (e.g., 85.64%)
    let totalOffset = 0
    if (data.peakShaving.tou.result?.offsetPercentages) {
      const solarDirectPercent = data.peakShaving.tou.result.offsetPercentages.solarDirect || 0
      const solarChargedBatteryPercent = data.peakShaving.tou.result.offsetPercentages.solarChargedBattery || 0
      totalOffset = solarDirectPercent + solarChargedBatteryPercent
    } else {
      // Fallback: calculate from solar and battery solar capture
      const totalOffsetKwh = solar + batterySolarCapture
      totalOffset = annualUsageKwh > 0 ? (totalOffsetKwh / annualUsageKwh) * 100 : 0
    }
    // Buy from grid = remaining grid purchase after optimization
    const buyFromGrid = touCombined.postSolarBatteryAnnualBill || 0
    const actualCostAfterBatteryOptimization = buyFromGrid
    const savings = touCombined.combinedAnnualSavings || 0
    const annualSavings = touCombined.combinedAnnualSavings || 0
    const monthlySavings = touCombined.combinedMonthlySavings || 0
    
    // Get 25-year projection - check multiple possible locations
    // The projection might be nested in allResults.combined.combined or allResults.combined
    let profit25Year = 0
    let paybackPeriod = 0
    
    // Try to find projection in nested structure
    const touAllResults = data.peakShaving.tou.allResults
    if (touAllResults?.combined?.combined?.projection) {
      profit25Year = touAllResults.combined.combined.projection.netProfit25Year || 0
      paybackPeriod = touAllResults.combined.combined.projection.paybackYears || 0
    } else if (touAllResults?.combined?.projection) {
      profit25Year = touAllResults.combined.projection.netProfit25Year || 0
      paybackPeriod = touAllResults.combined.projection.paybackYears || 0
    } else if (data.peakShaving.tou.combined?.projection) {
      profit25Year = data.peakShaving.tou.combined.projection.netProfit25Year || 0
      paybackPeriod = data.peakShaving.tou.combined.projection.paybackYears || 0
    }
    
    // Get before/after solar costs - prioritize touBeforeAfter if available (from step 4)
    let beforeSolar = 0
    let afterSolar = 0
    let totalBillSavingsPercent = 0
    
    if ((data as any).touBeforeAfter) {
      // Use pre-calculated values from step 4 (most accurate)
      beforeSolar = (data as any).touBeforeAfter.before || 0
      afterSolar = (data as any).touBeforeAfter.after || 0
      totalBillSavingsPercent = beforeSolar > 0 
        ? ((beforeSolar - afterSolar) / beforeSolar) * 100 
        : 0
    } else {
      // Fallback: calculate from combined result
      beforeSolar = touCombined.baselineAnnualBill || 0
      afterSolar = touCombined.postSolarBatteryAnnualBill || touCombined.postSolarAnnualBill || 0
      totalBillSavingsPercent = beforeSolar > 0 
      ? ((beforeSolar - afterSolar) / beforeSolar) * 100 
      : 0
    }
    
    // Recalculate annual savings from before/after to match step 4
    const recalculatedAnnualSavings = beforeSolar > 0 && afterSolar >= 0 ? beforeSolar - afterSolar : annualSavings
    
    simplified.tou = {
      solar,
      batterySolarCapture,
      totalOffset,
      buyFromGrid,
      actualCostAfterBatteryOptimization,
      savings,
      annualSavings: recalculatedAnnualSavings,
      monthlySavings: recalculatedAnnualSavings / 12,
      profit25Year,
      paybackPeriod,
      totalBillSavingsPercent: Math.round(totalBillSavingsPercent * 100) / 100, // Round to 2 decimals
      beforeSolar,
      afterSolar,
    }
  }
  
  // Extract ULO data from peakShaving
  if (data.peakShaving?.ulo?.combined) {
    const uloCombined = data.peakShaving.ulo.combined
    const breakdown = uloCombined.breakdown
    
    // Calculate values from breakdown
    // Solar = sum of solar allocation across all periods
    const solarAllocation = breakdown?.solarAllocation || {}
    const solar = (solarAllocation.ultraLow || 0) + (solarAllocation.offPeak || 0) + 
                  (solarAllocation.midPeak || 0) + (solarAllocation.onPeak || 0)
    
    // Battery solar capture for ULO
    // First try to get from FRD result offsetPercentages (most accurate)
    let batterySolarCapture = 0
    const annualUsageKwh = data.peakShaving?.annualUsageKwh || data.energyUsage?.annualKwh || data.annualUsageKwh || 0
    
    if (data.peakShaving.ulo.result?.offsetPercentages?.solarChargedBattery) {
      // Get from FRD result offsetPercentages (percentage) and convert to kWh
      const batterySolarCapturePercent = data.peakShaving.ulo.result.offsetPercentages.solarChargedBattery
      batterySolarCapture = (batterySolarCapturePercent / 100) * annualUsageKwh
    } else if (data.peakShaving.ulo.result?.battSolarCharged) {
      // Fallback: use battSolarCharged directly from FRD result
      batterySolarCapture = data.peakShaving.ulo.result.battSolarCharged
    } else {
      // Fallback: calculate from breakdown
      const batteryOffsets = breakdown?.batteryOffsets || {}
      const totalBatteryDischarge = (batteryOffsets.ultraLow || 0) + (batteryOffsets.offPeak || 0) + 
                                    (batteryOffsets.midPeak || 0) + (batteryOffsets.onPeak || 0)
      const gridChargedBattery = breakdown?.batteryChargeFromUltraLow || 0
      
      if (totalBatteryDischarge > 0) {
        if (gridChargedBattery > 0) {
          batterySolarCapture = Math.max(0, totalBatteryDischarge - gridChargedBattery)
        } else {
          batterySolarCapture = totalBatteryDischarge
        }
      }
    }
    // Total offset = percentage from FRD result offsetPercentages (solar + battery)
    // This is the capped percentage that matches Step 4 display (e.g., 85.64%)
    let totalOffset = 0
    if (data.peakShaving.ulo.result?.offsetPercentages) {
      const solarDirectPercent = data.peakShaving.ulo.result.offsetPercentages.solarDirect || 0
      const solarChargedBatteryPercent = data.peakShaving.ulo.result.offsetPercentages.solarChargedBattery || 0
      totalOffset = solarDirectPercent + solarChargedBatteryPercent
    } else {
      // Fallback: calculate from solar and battery solar capture
      const totalOffsetKwh = solar + batterySolarCapture
      totalOffset = annualUsageKwh > 0 ? (totalOffsetKwh / annualUsageKwh) * 100 : 0
    }
    const buyFromGrid = uloCombined.postSolarBatteryAnnualBill || 0
    const actualCostAfterBatteryOptimization = buyFromGrid
    const savings = uloCombined.combinedAnnualSavings || 0
    const annualSavings = uloCombined.combinedAnnualSavings || 0
    const monthlySavings = uloCombined.combinedMonthlySavings || 0
    
    // Get 25-year projection
    let profit25Year = 0
    let paybackPeriod = 0
    
    const uloAllResults = data.peakShaving.ulo.allResults
    if (uloAllResults?.combined?.combined?.projection) {
      profit25Year = uloAllResults.combined.combined.projection.netProfit25Year || 0
      paybackPeriod = uloAllResults.combined.combined.projection.paybackYears || 0
    } else if (uloAllResults?.combined?.projection) {
      profit25Year = uloAllResults.combined.projection.netProfit25Year || 0
      paybackPeriod = uloAllResults.combined.projection.paybackYears || 0
    } else if (data.peakShaving.ulo.combined?.projection) {
      profit25Year = data.peakShaving.ulo.combined.projection.netProfit25Year || 0
      paybackPeriod = data.peakShaving.ulo.combined.projection.paybackYears || 0
    }
    
    // Get before/after solar costs - prioritize uloBeforeAfter if available (from step 4)
    let beforeSolar = 0
    let afterSolar = 0
    let totalBillSavingsPercent = 0
    
    if ((data as any).uloBeforeAfter) {
      // Use pre-calculated values from step 4 (most accurate)
      beforeSolar = (data as any).uloBeforeAfter.before || 0
      afterSolar = (data as any).uloBeforeAfter.after || 0
      totalBillSavingsPercent = beforeSolar > 0 
        ? ((beforeSolar - afterSolar) / beforeSolar) * 100 
        : 0
    } else {
      // Fallback: calculate from combined result
      beforeSolar = uloCombined.baselineAnnualBill || 0
      afterSolar = uloCombined.postSolarBatteryAnnualBill || uloCombined.postSolarAnnualBill || 0
      totalBillSavingsPercent = beforeSolar > 0 
      ? ((beforeSolar - afterSolar) / beforeSolar) * 100 
      : 0
    }
    
    // Recalculate annual savings from before/after to match step 4
    const recalculatedAnnualSavings = beforeSolar > 0 && afterSolar >= 0 ? beforeSolar - afterSolar : annualSavings
    
    simplified.ulo = {
      solar,
      batterySolarCapture,
      totalOffset,
      buyFromGrid,
      actualCostAfterBatteryOptimization,
      savings,
      annualSavings: recalculatedAnnualSavings,
      monthlySavings: recalculatedAnnualSavings / 12,
      profit25Year,
      paybackPeriod,
      totalBillSavingsPercent: Math.round(totalBillSavingsPercent * 100) / 100, // Round to 2 decimals
      beforeSolar,
      afterSolar,
    }
  }
  
  // Step 8: Production, Costs, Roof Area, Environmental
  if (data.estimate?.production) {
    simplified.production = {
      annualKwh: data.estimate.production.annualKwh || 0,
      monthlyKwh: data.estimate.production.monthlyKwh || [],
      dailyAverageKwh: data.estimate.production.dailyAverageKwh || 0,
    }
  }
  
  // Step 8: Costs - simplified structure
  // Calculate costs from estimate and battery selection
  const systemCost = data.estimate?.costs?.systemCost || 0
  
  // Calculate battery cost from selected batteries
  let batteryCost = 0
  let batteryRebate = 0
  
  // Get selected battery IDs
  const selectedBatteryIds = (data as any).selectedBatteryIds || 
    (data.selectedBattery ? data.selectedBattery.split(',').map((id: string) => id.trim()) : [])
  
  if (selectedBatteryIds.length > 0) {
    // Calculate total battery cost and rebate from all selected batteries
    selectedBatteryIds.forEach((batteryId: string) => {
      const battery = BATTERY_SPECS.find(b => b.id === batteryId)
      if (battery) {
        batteryCost += battery.price
        // Calculate rebate for this battery
        const rebate = calculateBatteryRebate(battery.nominalKwh)
        batteryRebate += rebate
      }
    })
    
    // Cap total battery rebate at $5,000 (per installation, not per battery)
    batteryRebate = Math.min(batteryRebate, 5000)
  } else if (data.batteryDetails?.battery) {
    // Fallback: use batteryDetails if available
    batteryCost = data.batteryDetails.battery.price || 0
    if (data.batteryDetails.battery.nominalKwh) {
      batteryRebate = calculateBatteryRebate(data.batteryDetails.battery.nominalKwh)
    }
  }
  
  // Calculate solar rebate
  const systemSizeKw = simplified.systemSizeKw || 0
  const solarRebate = Math.min(systemSizeKw * 1000, 5000) // $1,000 per kW, max $5,000
  
  // Calculate net cost after rebates
  const netCost = systemCost + batteryCost - solarRebate - batteryRebate
  
  simplified.costs = {
    systemCost,
    batteryCost,
    solarRebate,
    batteryRebate,
    netCost: Math.max(0, netCost), // Ensure net cost is not negative
  }
  
  if (data.estimate?.roofArea) {
    simplified.roofArea = {
      squareFeet: data.estimate.roofArea.squareFeet || 0,
      squareMeters: data.estimate.roofArea.squareMeters || 0,
      usableSquareFeet: data.estimate.roofArea.usableSquareFeet || 0,
    }
  }
  
  if (data.estimate?.environmental) {
    simplified.environmental = {
      co2OffsetTonsPerYear: data.estimate.environmental.co2OffsetTonsPerYear || 0,
      treesEquivalent: data.estimate.environmental.treesEquivalent || 0,
      carsOffRoadEquivalent: data.estimate.environmental.carsOffRoadEquivalent || 0,
    }
  }
  
  // Step 9: Contact (whole step)
  // Note: These fields come from the contact form submission
  // They may not be in the EstimatorData object until StepContact completes
  // But we'll extract them if they exist (they'll be passed via onComplete)
  if ((data as any).fullName) simplified.fullName = (data as any).fullName
  if ((data as any).phone) simplified.phone = (data as any).phone
  if ((data as any).preferredContactTime) simplified.preferredContactTime = (data as any).preferredContactTime
  if ((data as any).preferredContactMethod) simplified.preferredContactMethod = (data as any).preferredContactMethod
  if ((data as any).comments) simplified.comments = (data as any).comments
  if ((data as any).consent !== undefined) simplified.consent = (data as any).consent
  
  // Financing option (payment method)
  if (data.financingOption) simplified.financingOption = data.financingOption
  
  // Add-ons (if not already set above)
  if (!simplified.selectedAddOns && (data as any).selectedAddOns && Array.isArray((data as any).selectedAddOns)) {
    simplified.selectedAddOns = (data as any).selectedAddOns
  }
  
  return simplified
}

