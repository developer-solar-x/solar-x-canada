// Simple Peak-Shaving Calculator (Spreadsheet Formula)
// Based on manual usage distribution by rate period

import { BatterySpec } from '../config/battery-specs'
import { RatePlan } from '../config/rate-plans'

// Usage distribution by period (user input or defaults)
export interface UsageDistribution {
  offPeakPercent: number    // % of annual usage during off-peak
  midPeakPercent: number    // % of annual usage during mid-peak
  onPeakPercent: number     // % of annual usage during on-peak
  ultraLowPercent?: number  // % of annual usage during ultra-low (ULO only)
}

// Default distribution patterns for TOU and ULO
export const DEFAULT_TOU_DISTRIBUTION: UsageDistribution = {
  offPeakPercent: 63,
  midPeakPercent: 18,
  onPeakPercent: 19
}

export const DEFAULT_ULO_DISTRIBUTION: UsageDistribution = {
  onPeakPercent: 17.9,
  midPeakPercent: 33.1,
  offPeakPercent: 23,  // Weekend/Holiday off-peak
  ultraLowPercent: 26
}

// Simple peak-shaving calculation result
export interface SimplePeakShavingResult {
  // Usage breakdown
  totalUsageKwh: number
  usageByPeriod: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  
  // Original cost (without battery)
  originalCost: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
    total: number
  }
  
  // Battery operation
  batteryAnnualCycles: number  // Total kWh battery can shift per year
  batteryOffsets: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  
  // New cost (with battery)
  newCost: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
    total: number
  }
  
  // Savings
  annualSavings: number
  savingsPercent: number
  monthlySavings: number
  
  // Leftover energy (not offset by battery)
  leftoverEnergy: {
    totalKwh: number  // Total leftover energy in kWh
    consumptionPercent: number  // % of total consumption (e.g., 17.15%)
    costAtOffPeak: number  // Cost of leftover at off-peak rates
    costPercent: number  // % of original cost (e.g., 4.2875%)
    ratePerKwh: number  // Rate per kWh charged for leftover energy (ultra-low or off-peak)
  }
}

// Calculate simple peak-shaving savings
// Optional solarProductionKwh: if provided, solar only offsets ~50% (daytime usage)
export function calculateSimplePeakShaving(
  annualUsageKwh: number,
  battery: BatterySpec,
  ratePlan: RatePlan,
  distribution?: UsageDistribution,
  solarProductionKwh?: number
): SimplePeakShavingResult {
  
  // Use default distribution if not provided
  const dist = distribution || (
    ratePlan.id === 'ulo' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION
  )
  
  // Extract rates from rate plan (convert cents to dollars)
  const rates = {
    ultraLow: 0,
    offPeak: 0,
    midPeak: 0,
    onPeak: 0
  }
  
  // Get rates from the rate plan periods
  ratePlan.periods.forEach(period => {
    const rateInDollars = period.rate / 100 // Convert cents to dollars
    if (period.period === 'ultra-low') {
      rates.ultraLow = rateInDollars
    } else if (period.period === 'off-peak') {
      rates.offPeak = rateInDollars
    } else if (period.period === 'mid-peak') {
      rates.midPeak = rateInDollars
    } else if (period.period === 'on-peak') {
      rates.onPeak = rateInDollars
    }
  })
  
  // Use weekend rate for off-peak if off-peak rate is still 0
  if (rates.offPeak === 0 && ratePlan.weekendRate) {
    rates.offPeak = ratePlan.weekendRate / 100
  }
  
  // Calculate usage by period (kWh)
  const usageByPeriod = {
    ultraLow: dist.ultraLowPercent ? (annualUsageKwh * dist.ultraLowPercent / 100) : undefined,
    offPeak: annualUsageKwh * dist.offPeakPercent / 100,
    midPeak: annualUsageKwh * dist.midPeakPercent / 100,
    onPeak: annualUsageKwh * dist.onPeakPercent / 100
  }
  
  // Calculate original cost (without battery)
  const originalCost = {
    ultraLow: usageByPeriod.ultraLow ? usageByPeriod.ultraLow * rates.ultraLow : undefined,
    offPeak: usageByPeriod.offPeak * rates.offPeak,
    midPeak: usageByPeriod.midPeak * rates.midPeak,
    onPeak: usageByPeriod.onPeak * rates.onPeak,
    total: 0
  }
  
  originalCost.total = 
    (originalCost.ultraLow || 0) +
    originalCost.offPeak +
    originalCost.midPeak +
    originalCost.onPeak
  
  // Calculate battery annual cycles
  // Assume 1 full cycle per day for full year
  const activeDaysPerYear = 365
  const batteryAnnualCycles = battery.usableKwh * activeDaysPerYear
  
  // Battery offsets most expensive periods first
  let remainingBattery = batteryAnnualCycles
  const batteryOffsets = {
    ultraLow: 0,
    offPeak: 0,
    midPeak: 0,
    onPeak: 0
  }
  
  // Priority: On-Peak > Mid-Peak > Off-Peak > Ultra-Low
  // Offset on-peak first
  const onPeakOffset = Math.min(usageByPeriod.onPeak, remainingBattery)
  batteryOffsets.onPeak = onPeakOffset
  remainingBattery -= onPeakOffset
  
  // Then mid-peak
  if (remainingBattery > 0) {
    const midPeakOffset = Math.min(usageByPeriod.midPeak, remainingBattery)
    batteryOffsets.midPeak = midPeakOffset
    remainingBattery -= midPeakOffset
  }
  
  // Then off-peak (rarely needed unless very large battery)
  if (remainingBattery > 0) {
    const offPeakOffset = Math.min(usageByPeriod.offPeak, remainingBattery)
    batteryOffsets.offPeak = offPeakOffset
    remainingBattery -= offPeakOffset
  }
  
  // Calculate new cost (with battery offsetting expensive periods)
  // Battery charges at cheapest rate (ultra-low for ULO, off-peak for TOU)
  // Battery-offset usage costs the charging rate, grid usage costs the period rate
  const batteryChargingRate = rates.ultraLow > 0 ? rates.ultraLow : rates.offPeak
  
  const newCost = {
    ultraLow: usageByPeriod.ultraLow ? usageByPeriod.ultraLow * rates.ultraLow : undefined,
    // Grid usage at period rate + battery usage at charging rate
    offPeak: (usageByPeriod.offPeak - batteryOffsets.offPeak) * rates.offPeak + 
             (batteryOffsets.offPeak * batteryChargingRate),
    midPeak: (usageByPeriod.midPeak - batteryOffsets.midPeak) * rates.midPeak + 
             (batteryOffsets.midPeak * batteryChargingRate),
    onPeak: (usageByPeriod.onPeak - batteryOffsets.onPeak) * rates.onPeak + 
            (batteryOffsets.onPeak * batteryChargingRate),
    total: 0
  }
  
  newCost.total = 
    (newCost.ultraLow || 0) +
    newCost.offPeak +
    newCost.midPeak +
    newCost.onPeak
  
  // Calculate savings
  const annualSavings = originalCost.total - newCost.total
  const savingsPercent = (annualSavings / originalCost.total) * 100
  const monthlySavings = annualSavings / 12
  
  // Calculate solar offset (if solar production is provided)
  // Solar only works during daytime, so it offsets approximately 50% of usage
  // Maximum solar offset is 50% of total annual usage
  const solarOffsetKwh = solarProductionKwh 
    ? Math.min(solarProductionKwh, annualUsageKwh * 0.5) // Solar max ~50% offset
    : 0
  
  // Calculate leftover energy (energy not offset by solar + battery)
  // Total energy offset by battery
  const totalBatteryOffset = batteryOffsets.onPeak + batteryOffsets.midPeak + batteryOffsets.offPeak + (batteryOffsets.ultraLow || 0)
  // Total offset = solar offset + battery offset
  const totalOffset = solarOffsetKwh + totalBatteryOffset
  // Leftover energy = total usage - total offset
  const leftoverEnergyKwh = Math.max(0, annualUsageKwh - totalOffset)
  const leftoverConsumptionPercent = (leftoverEnergyKwh / annualUsageKwh) * 100
  
  // Calculate cost of leftover energy at off-peak rates
  // Leftover energy will be consumed during off-peak hours when rates are lowest
  // This is because solar+battery have already offset the expensive periods
  // Use off-peak rate, not ultra-low, since leftover energy is from periods not offset by battery
  const leftoverRatePerKwh = rates.offPeak
  const leftoverCostAtOffPeak = leftoverEnergyKwh * leftoverRatePerKwh
  // Calculate percentage compared to worst-case scenario (all consumption at on-peak rate)
  // This shows: even though leftover is 17.15% of usage, it only costs 4.29% vs worst-case
  // Use the higher on-peak rate (ULO 39.1¢ or TOU 20.3¢) for worst-case comparison
  const worstCaseOnPeakRate = rates.onPeak > 0 ? rates.onPeak : 0.391 // Default to ULO on-peak if not found
  const worstCaseTotalCost = annualUsageKwh * worstCaseOnPeakRate
  const leftoverCostPercent = worstCaseTotalCost > 0 ? (leftoverCostAtOffPeak / worstCaseTotalCost) * 100 : 0
  
  return {
    totalUsageKwh: annualUsageKwh,
    usageByPeriod,
    originalCost,
    batteryAnnualCycles,
    batteryOffsets,
    newCost,
    annualSavings,
    savingsPercent,
    monthlySavings,
    leftoverEnergy: {
      totalKwh: leftoverEnergyKwh,
      consumptionPercent: leftoverConsumptionPercent,
      costAtOffPeak: leftoverCostAtOffPeak,
      costPercent: leftoverCostPercent,
      ratePerKwh: leftoverRatePerKwh
    }
  }
}

// Calculate multi-year projection with simple formula
export function calculateSimpleMultiYear(
  firstYearResult: SimplePeakShavingResult,
  batteryNetCost: number,
  rateEscalation: number = 0.05,
  years: number = 25
) {
  // If net cost is zero or negative (credits exceed price), payback is immediate
  const paybackEligibleNetCost = Math.max(0, batteryNetCost)
  let cumulativeSavings = 0
  let paybackYears = 0
  let paybackFound = false
  
  const yearlyProjections = []
  
  for (let year = 1; year <= years; year++) {
    const rateMultiplier = Math.pow(1 + rateEscalation, year - 1)
    const annualSavings = firstYearResult.annualSavings * rateMultiplier
    cumulativeSavings += annualSavings
    
    if (!paybackFound && cumulativeSavings >= paybackEligibleNetCost) {
      const previousCumulative = cumulativeSavings - annualSavings
      const fractionOfYear = (paybackEligibleNetCost - previousCumulative) / annualSavings
      paybackYears = year - 1 + fractionOfYear
      paybackFound = true
    }
    
    yearlyProjections.push({
      year,
      annualSavings: Math.round(annualSavings),
      cumulativeSavings: Math.round(cumulativeSavings),
      rateMultiplier: Math.round(rateMultiplier * 100) / 100
    })
  }
  
  const totalSavings25Year = cumulativeSavings
  const netProfit25Year = totalSavings25Year - batteryNetCost
  
  return {
    yearlyProjections,
    totalSavings25Year: Math.round(totalSavings25Year),
    netCost: Math.round(batteryNetCost),
    paybackYears: batteryNetCost <= 0 ? 0 : Math.round(paybackYears * 10) / 10,
    netProfit25Year: Math.round(netProfit25Year),
    annualROI: batteryNetCost <= 0 ? 'N/A' : ((netProfit25Year / batteryNetCost / 25) * 100).toFixed(1)
  }
}

