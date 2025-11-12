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
  onPeakPercent: 33.1, // Weekday on-peak share for TOU solar+battery scenario
  midPeakPercent: 26, // Weekday mid-peak share for TOU solar+battery scenario
  offPeakPercent: 40.9 // Weekend/night off-peak (remainder to total 100%)
}

export const DEFAULT_ULO_DISTRIBUTION: UsageDistribution = {
  onPeakPercent: 33.1, // Weekday on-peak share used in the email baseline
  midPeakPercent: 26, // Weekday mid-peak share used in the email baseline
  offPeakPercent: 17.9, // Weekend/off-peak share used in the email baseline
  ultraLowPercent: 23 // Overnight ultra-low share used in the email baseline
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

// Calculate solar-only annual savings given a rate plan and usage distribution
export function calculateSolarOnlySavings(
  annualUsageKwh: number,
  solarProductionKwh: number,
  ratePlan: RatePlan,
  distribution?: UsageDistribution
): {
  billBefore: number
  billAfter: number
  annualSavings: number
  usageByPeriod: { ultraLow?: number; offPeak: number; midPeak: number; onPeak: number }
} {
  // Use default distribution if not provided
  const dist = distribution || (
    ratePlan.id === 'ulo' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION
  )

  // Extract rates (in $/kWh)
  const rates = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }
  ratePlan.periods.forEach(p => {
    const r = p.rate / 100
    if (p.period === 'ultra-low') rates.ultraLow = r
    else if (p.period === 'off-peak') rates.offPeak = r
    else if (p.period === 'mid-peak') rates.midPeak = r
    else if (p.period === 'on-peak') rates.onPeak = r
  })
  if (rates.offPeak === 0 && ratePlan.weekendRate) {
    rates.offPeak = ratePlan.weekendRate / 100
  }
  if ((ratePlan.id === 'tou' || ratePlan.id === 'tou-solar-battery') && rates.ultraLow === 0) {
    rates.ultraLow = rates.offPeak
  }

  // Usage by period
  const usageByPeriod = {
    ultraLow: dist.ultraLowPercent ? (annualUsageKwh * dist.ultraLowPercent / 100) : undefined,
    offPeak: annualUsageKwh * dist.offPeakPercent / 100,
    midPeak: annualUsageKwh * dist.midPeakPercent / 100,
    onPeak: annualUsageKwh * dist.onPeakPercent / 100,
  }

  // Bill before solar
  const billBefore =
    (usageByPeriod.ultraLow ? usageByPeriod.ultraLow * rates.ultraLow : 0) +
    usageByPeriod.offPeak * rates.offPeak +
    usageByPeriod.midPeak * rates.midPeak +
    usageByPeriod.onPeak * rates.onPeak

  // Apply solar production to offset the highest-cost periods first (no charging cost)
  let remainingSolar = Math.max(0, solarProductionKwh || 0)
  let onPeakAfter = usageByPeriod.onPeak
  let midPeakAfter = usageByPeriod.midPeak
  let offPeakAfter = usageByPeriod.offPeak
  let ultraLowAfter = usageByPeriod.ultraLow || 0

  // On-Peak
  const onOffset = Math.min(onPeakAfter, remainingSolar)
  onPeakAfter -= onOffset
  remainingSolar -= onOffset
  // Mid-Peak
  const midOffset = Math.min(midPeakAfter, remainingSolar)
  midPeakAfter -= midOffset
  remainingSolar -= midOffset
  // Off-Peak
  const offOffset = Math.min(offPeakAfter, remainingSolar)
  offPeakAfter -= offOffset
  remainingSolar -= offOffset
  // Ultra-Low (rare)
  if (usageByPeriod.ultraLow) {
    const ulOffset = Math.min(ultraLowAfter, remainingSolar)
    ultraLowAfter -= ulOffset
    remainingSolar -= ulOffset
  }

  const billAfter =
    (usageByPeriod.ultraLow ? ultraLowAfter * rates.ultraLow : 0) +
    offPeakAfter * rates.offPeak +
    midPeakAfter * rates.midPeak +
    onPeakAfter * rates.onPeak

  return {
    billBefore,
    billAfter,
    annualSavings: billBefore - billAfter,
    usageByPeriod: {
      ultraLow: usageByPeriod.ultraLow,
      offPeak: usageByPeriod.offPeak,
      midPeak: usageByPeriod.midPeak,
      onPeak: usageByPeriod.onPeak,
    },
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
  
  const offPeakGridPortion = Math.max(0, usageByPeriod.offPeak - batteryOffsets.offPeak) * rates.offPeak
  const batteryOffsetTotal =
    batteryOffsets.offPeak +
    batteryOffsets.midPeak +
    batteryOffsets.onPeak +
    (batteryOffsets.ultraLow || 0)

  let ultraLowCost = usageByPeriod.ultraLow ? usageByPeriod.ultraLow * rates.ultraLow : 0
  let offPeakCost = offPeakGridPortion

  if (batteryOffsetTotal > 0) {
    if (batteryChargingRate === rates.ultraLow && rates.ultraLow > 0) {
      ultraLowCost += batteryOffsetTotal * batteryChargingRate
    } else {
      offPeakCost += batteryOffsetTotal * batteryChargingRate
    }
  }

  const newCost = {
    ultraLow: usageByPeriod.ultraLow !== undefined || batteryChargingRate === rates.ultraLow
      ? ultraLowCost
      : undefined,
    offPeak: offPeakCost,
    midPeak: 0,
    onPeak: 0,
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
  
  // Daytime offset = 50% of total annual consumption (independent of NREL)
  const solarOffsetKwh = annualUsageKwh * 0.5
  
  // Calculate leftover energy (energy not offset by solar + battery)
  // Total energy offset by battery
  const totalBatteryOffset = batteryOffsets.onPeak + batteryOffsets.midPeak + batteryOffsets.offPeak + (batteryOffsets.ultraLow || 0)
  
  // Night-time offset uses leftover solar (production minus daytime), limited by battery capability
  const solarLeftoverForNight = Math.max(0, (solarProductionKwh || 0) - solarOffsetKwh)
  const nightTimeOffsetKwh = Math.min(solarLeftoverForNight, totalBatteryOffset)
  
  // Combined offset is daytime solar + night-time offset, capped to total annual usage
  const combinedOffsetKwh = Math.min(annualUsageKwh, solarOffsetKwh + nightTimeOffsetKwh)
  
  // Leftover energy = total usage - combined offset
  const leftoverEnergyKwh = Math.max(0, annualUsageKwh - combinedOffsetKwh)
  const leftoverConsumptionPercent = (leftoverEnergyKwh / annualUsageKwh) * 100
  
  // Cost leftover at the cheapest available rate (ultra-low if present, else off-peak)
  const leftoverRatePerKwh = rates.ultraLow > 0 ? rates.ultraLow : rates.offPeak
  const leftoverCostAtOffPeak = leftoverEnergyKwh * leftoverRatePerKwh
  
  // Express leftover cost as a percentage of the original total cost
  const baseTotalCost = originalCost.total
  const leftoverCostPercent = baseTotalCost > 0 ? (leftoverCostAtOffPeak / baseTotalCost) * 100 : 0
  
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

// Combined solar + battery outcome to keep savings consistent everywhere
// Preferred solar allocation weights for the ULO solar + battery scenario (client supplied)
const ULO_SOLAR_ALLOCATION = {
  midPeak: 0.5, // 50% of the capped solar is aimed at weekday mid-peak
  onPeak: 0.22, // 22% of the capped solar offsets weekday on-peak
  offPeak: 0.28, // 28% of the capped solar smooths out weekend off-peak
  ultraLow: 0, // Overnight usage is left for the battery to cover via charging strategy
}

// TOU allocation weights provided for solar + battery modelling
const TOU_SOLAR_ALLOCATION = {
  midPeak: 0.5, // 50% of the capped solar focuses on weekday mid-peak
  onPeak: 0.22, // 22% targets the weekday on-peak windows
  offPeak: 0.28, // 28% covers weekend/off-peak periods
  ultraLow: 0, // No solar energy applied to ultra-low since production happens during the day
}

export function calculateSolarBatteryCombined(
  annualUsageKwh: number,
  solarProductionKwh: number,
  battery: BatterySpec,
  ratePlan: RatePlan,
  distribution?: UsageDistribution,
  offsetCapFraction?: number
) {
  // Use the same distribution logic so numbers match the other helpers
  const dist = distribution || (ratePlan.id === 'ulo' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION)

  // Build a quick map of period rates in dollars for easy reuse later on
  const rates = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }
  ratePlan.periods.forEach(period => {
    const rateInDollars = period.rate / 100
    if (period.period === 'ultra-low') rates.ultraLow = rateInDollars
    if (period.period === 'off-peak') rates.offPeak = rateInDollars
    if (period.period === 'mid-peak') rates.midPeak = rateInDollars
    if (period.period === 'on-peak') rates.onPeak = rateInDollars
  })
  if (rates.offPeak === 0 && ratePlan.weekendRate) {
    rates.offPeak = ratePlan.weekendRate / 100
  }

  // Translate the annual usage into kWh buckets for each rate period
  const usageOriginal = {
    ultraLow: dist.ultraLowPercent ? (annualUsageKwh * dist.ultraLowPercent / 100) : 0,
    offPeak: annualUsageKwh * dist.offPeakPercent / 100,
    midPeak: annualUsageKwh * dist.midPeakPercent / 100,
    onPeak: annualUsageKwh * dist.onPeakPercent / 100,
  }

  // Helper to total up a bill using the per-period usage numbers
  const costFromUsage = (usage: typeof usageOriginal) => (
    (usage.ultraLow || 0) * rates.ultraLow +
    usage.offPeak * rates.offPeak +
    usage.midPeak * rates.midPeak +
    usage.onPeak * rates.onPeak
  )

  // Start by figuring out the baseline bill without solar or batteries
  const baselineRateOverrides: Record<string, number> = {
    'ulo': 0.197, // 19.7¢/kWh blended that marketing uses in the email narrative
    'ulo-solar-battery': 0.197,
    'tou': 0.148, // 14.8¢/kWh blended TOU average used in the email narrative
    'tou-solar-battery': 0.148,
  }

  const overriddenRate = baselineRateOverrides[ratePlan.id]
  const baselineAnnualBill = overriddenRate != null
    ? annualUsageKwh * overriddenRate
    : costFromUsage(usageOriginal)

  // Apply solar and battery using the custom client formulas, otherwise fall back to generic logic
  const isUloPlan = ratePlan.id === 'ulo' || ratePlan.id === 'ulo-solar-battery'
  const isTouPlan = ratePlan.id === 'tou' || ratePlan.id === 'tou-solar-battery'

  const applyUloFormula = () => {
    const solarCap = Math.min(annualUsageKwh * 0.5, Math.max(0, solarProductionKwh || 0))
    const usageAfterSolar = { ...usageOriginal }
    const solarAllocation = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }

    const allocateSolarWithWeights = () => {
      let remainingSolar = solarCap
      const orderedKeys: Array<'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow'> = ['midPeak', 'onPeak', 'offPeak', 'ultraLow']

      // First pass: follow the supplied weight targets
      for (const key of orderedKeys) {
        if (remainingSolar <= 0) break
        const targetShare = ULO_SOLAR_ALLOCATION[key] ?? 0
        if (targetShare <= 0) continue
        const desired = solarCap * targetShare
        const available = usageAfterSolar[key] || 0
        const applied = Math.min(available, desired)
        solarAllocation[key] = applied
        usageAfterSolar[key] = available - applied
        remainingSolar -= applied
      }

      // Second pass: if a bucket could not absorb its target (e.g., low usage), spread leftovers in priority order
      if (remainingSolar > 0) {
        for (const key of orderedKeys) {
          if (remainingSolar <= 0) break
          const available = usageAfterSolar[key] || 0
          if (available <= 0) continue
          const applied = Math.min(available, remainingSolar)
          solarAllocation[key] += applied
          usageAfterSolar[key] = available - applied
          remainingSolar -= applied
        }
      }
    }

    allocateSolarWithWeights()

    const postSolarAnnualBill = costFromUsage(usageAfterSolar)

    // Battery covers the remaining expensive periods (mid, on, weekend) using annual usable energy
    const usageAfterBattery = { ...usageAfterSolar }
    const batteryOffsets = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }
    let remainingBattery = Math.max(0, battery.usableKwh) * 365
    const batteryDischargeOrder: Array<'midPeak' | 'onPeak' | 'offPeak'> = ['midPeak', 'onPeak', 'offPeak']

    for (const key of batteryDischargeOrder) {
      if (remainingBattery <= 0) break
      const available = usageAfterBattery[key]
      if (!available || available <= 0) continue
      const applied = Math.min(available, remainingBattery)
      batteryOffsets[key] = applied
      usageAfterBattery[key] = available - applied
      remainingBattery -= applied
    }

    // Battery charges during ultra-low overnight hours
    const batteryChargeRequired = batteryOffsets.midPeak + batteryOffsets.onPeak + batteryOffsets.offPeak
    usageAfterBattery.ultraLow = (usageAfterBattery.ultraLow || 0) + batteryChargeRequired

    const postSolarBatteryAnnualBill = costFromUsage(usageAfterBattery)
    const adjustedPostSolarBatteryBill = postSolarBatteryAnnualBill // already includes charge energy at ultra-low pricing

    return {
      postSolarAnnualBill,
      postSolarBatteryAnnualBill: adjustedPostSolarBatteryBill,
      batteryOffsets,
      usageAfterSolar,
      usageAfterBattery,
      solarAllocation,
      batteryChargeRequired,
      solarCap,
    }
  }

  const applyTouFormula = () => {
    const solarCap = Math.min(annualUsageKwh * 0.5, Math.max(0, solarProductionKwh || 0))
    const usageAfterSolar = { ...usageOriginal }
    const solarAllocation = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }
    let remainingSolar = solarCap

    const orderedKeys: Array<'midPeak' | 'onPeak' | 'offPeak'> = ['midPeak', 'onPeak', 'offPeak']

    const allocateSolarWithWeights = () => {
      let solarLeft = remainingSolar
      for (const key of orderedKeys) {
        if (solarLeft <= 0) break
        const targetShare = TOU_SOLAR_ALLOCATION[key] ?? 0
        if (targetShare <= 0) continue
        const desired = solarCap * targetShare
        const available = usageAfterSolar[key] || 0
        const applied = Math.min(available, desired)
        solarAllocation[key] = applied
        usageAfterSolar[key] = available - applied
        solarLeft -= applied
      }

      // If any solar remains, spread it through the ordered keys again
      for (const key of orderedKeys) {
        if (solarLeft <= 0) break
        const available = usageAfterSolar[key] || 0
        if (available <= 0) continue
        const applied = Math.min(available, solarLeft)
        solarAllocation[key] += applied
        usageAfterSolar[key] = available - applied
        solarLeft -= applied
      }

      remainingSolar = solarLeft
    }

    allocateSolarWithWeights()

    const postSolarAnnualBill = costFromUsage(usageAfterSolar)

    // Battery targets remaining on-peak first, then mid-peak (client TOU priority)
    const usageAfterBattery = { ...usageAfterSolar }
    const batteryOffsets = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }
    let remainingBattery = Math.max(0, battery.usableKwh) * 365
    const batteryDischargeOrder: Array<'onPeak' | 'midPeak'> = ['onPeak', 'midPeak']

    for (const key of batteryDischargeOrder) {
      if (remainingBattery <= 0) break
      const available = usageAfterBattery[key]
      if (!available || available <= 0) continue
      const applied = Math.min(available, remainingBattery)
      batteryOffsets[key] = applied
      usageAfterBattery[key] = available - applied
      remainingBattery -= applied
    }

    const batteryChargeFromOffPeak = batteryOffsets.midPeak + batteryOffsets.onPeak + batteryOffsets.offPeak
    if (batteryChargeFromOffPeak > 0) {
      usageAfterBattery.offPeak += batteryChargeFromOffPeak
    }

    const postSolarBatteryAnnualBill = costFromUsage(usageAfterBattery)

    return {
      postSolarAnnualBill,
      postSolarBatteryAnnualBill,
      batteryOffsets,
      usageAfterSolar,
      usageAfterBattery,
      solarAllocation,
      batteryChargeFromOffPeak,
      solarCap,
    }
  }

  const applyGenericFormula = () => {
    // Apply solar energy to the most expensive periods first so the effect feels realistic
    const usageAfterSolar = { ...usageOriginal }
    let remainingSolar = Math.max(0, solarProductionKwh || 0)

    const shavePeriod = (key: 'onPeak' | 'midPeak' | 'offPeak' | 'ultraLow') => {
      const available = usageAfterSolar[key] || 0
      const offset = Math.min(available, remainingSolar)
      usageAfterSolar[key] = available - offset
      remainingSolar -= offset
    }

    shavePeriod('onPeak')
    shavePeriod('midPeak')
    shavePeriod('offPeak')
    shavePeriod('ultraLow')

    // The bill after only solar has done its work
    const postSolarAnnualBill = costFromUsage(usageAfterSolar)

    // Now let the battery step in using the remaining usage after solar
    const usageForBattery = { ...usageAfterSolar }
    let remainingBattery = battery.usableKwh * 365
    const batteryOffsets = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }

    const shaveWithBattery = (key: 'onPeak' | 'midPeak' | 'offPeak') => {
      const available = usageForBattery[key]
      if (remainingBattery <= 0 || available <= 0) return
      const offset = Math.min(available, remainingBattery)
      batteryOffsets[key] = offset
      usageForBattery[key] = available - offset
      remainingBattery -= offset
    }

    shaveWithBattery('onPeak')
    shaveWithBattery('midPeak')
    shaveWithBattery('offPeak')

    // Batteries recharge at the cheapest available rate so we add that cost back in
    const chargeRate = rates.ultraLow > 0 ? rates.ultraLow : rates.offPeak
    const batteryChargingCost = (
      batteryOffsets.onPeak + batteryOffsets.midPeak + batteryOffsets.offPeak + batteryOffsets.ultraLow
    ) * chargeRate

    // Costs after both technologies are working together
    const postSolarBatteryAnnualBill = (
      usageForBattery.offPeak * rates.offPeak +
      usageForBattery.midPeak * rates.midPeak +
      usageForBattery.onPeak * rates.onPeak +
      (usageForBattery.ultraLow || 0) * rates.ultraLow +
      batteryChargingCost
    )

    return {
      postSolarAnnualBill,
      postSolarBatteryAnnualBill,
      batteryOffsets,
      usageAfterSolar,
      usageAfterBattery: usageForBattery,
      solarAllocation: undefined,
      batteryChargeRequired: undefined,
      solarCap: undefined,
    }
  }

  const applyResult = isTouPlan ? applyTouFormula() : isUloPlan ? applyUloFormula() : applyGenericFormula()
  
  const {
    postSolarAnnualBill,
    postSolarBatteryAnnualBill,
    batteryOffsets,
    usageAfterSolar,
    usageAfterBattery,
    solarAllocation,
    solarCap,
  } = applyResult
  
  const batteryChargeRequired = 'batteryChargeRequired' in applyResult ? applyResult.batteryChargeRequired : undefined
  const batteryChargeFromOffPeak = 'batteryChargeFromOffPeak' in applyResult ? applyResult.batteryChargeFromOffPeak : undefined

  // Pull out the savings so downstream screens can rely on them
  const solarOnlySavings = baselineAnnualBill - postSolarAnnualBill
  const batteryOnTopSavings = postSolarAnnualBill - postSolarBatteryAnnualBill
  const uncappedAnnualSavings = baselineAnnualBill - postSolarBatteryAnnualBill

  const safeCap = typeof offsetCapFraction === 'number' && Number.isFinite(offsetCapFraction)
    ? Math.min(Math.max(offsetCapFraction, 0), 1)
    : undefined

  const combinedAnnualSavings = safeCap != null
    ? Math.min(uncappedAnnualSavings, baselineAnnualBill * safeCap)
    : uncappedAnnualSavings

  const postSolarBatteryAnnualBillCapped = Math.max(0, baselineAnnualBill - combinedAnnualSavings)

  return {
    baselineAnnualBill,
    postSolarAnnualBill,
    postSolarBatteryAnnualBill: postSolarBatteryAnnualBillCapped,
    solarOnlySavings,
    batteryOnTopSavings,
    combinedAnnualSavings,
    combinedMonthlySavings: combinedAnnualSavings / 12,
    breakdown: isUloPlan ? {
      originalUsage: usageOriginal,
      usageAfterSolar,
      usageAfterBattery,
      solarAllocation,
      batteryOffsets,
      batteryChargeFromUltraLow: batteryChargeRequired,
      solarCapKwh: solarCap,
    } : isTouPlan ? {
      originalUsage: usageOriginal,
      usageAfterSolar,
      usageAfterBattery,
      solarAllocation,
      batteryOffsets,
      batteryChargeFromOffPeak,
      solarCapKwh: solarCap,
    } : undefined,
  }
}

// This helper projects combined solar + battery savings over time with simple escalation and degradation so long-term payback feels grounded
export function calculateCombinedMultiYear(
  firstYearAnnualSavings: number,
  combinedNetCost: number,
  rateEscalation: number = 0.05,
  systemDegradation: number = 0.005,
  years: number = 25,
  options?: {
    baselineAnnualBill?: number
    offsetCapFraction?: number
  }
) {
  // Keep net cost from going negative so the payback clock behaves
  const paybackEligibleNet = Math.max(0, combinedNetCost)
  // Track savings as we march through each year
  let cumulativeSavings = 0
  // Remember when the payback line gets crossed
  let paybackYears = 0
  let paybackFound = false
  // Collect rows for the UI table
  const yearlyProjections: Array<{ year: number; annualSavings: number; cumulativeSavings: number; rateMultiplier: number; degradationMultiplier: number }> = []

  const baselineAnnualBill = options?.baselineAnnualBill
  const capFractionFromBaseline = (() => {
    if (!baselineAnnualBill || baselineAnnualBill <= 0) return undefined
    if (firstYearAnnualSavings <= 0) return 0
    return Math.min(firstYearAnnualSavings / baselineAnnualBill, 1)
  })()
  const capFraction = options?.offsetCapFraction != null
    ? Math.min(Math.max(options.offsetCapFraction, 0), 1)
    : capFractionFromBaseline

  for (let year = 1; year <= years; year++) {
    // Grow rates over time to mimic electricity inflation
    const rateMultiplier = Math.pow(1 + rateEscalation, year - 1)
    // Fade savings gently to reflect solar+battery wear and tear
    const degradationMultiplier = Math.pow(1 - systemDegradation, year - 1)
    // Blend both effects so the annual savings feels realistic
    const projectedSavings = Math.max(0, firstYearAnnualSavings * rateMultiplier * degradationMultiplier)

    // Cap each year's savings using the same winter offset fraction so projections stay realistic
    const cappedSavings = (() => {
      if (!baselineAnnualBill || baselineAnnualBill <= 0 || capFraction == null) {
        return projectedSavings
      }
      const baselineForYear = baselineAnnualBill * rateMultiplier
      const capForYear = baselineForYear * capFraction
      return Math.min(projectedSavings, capForYear)
    })()

    const annualSavings = cappedSavings
    cumulativeSavings += annualSavings

    // Spot the exact moment cumulative savings beat the upfront cost
    if (!paybackFound && cumulativeSavings >= paybackEligibleNet && annualSavings > 0) {
      const previousCumulative = cumulativeSavings - annualSavings
      const fractionOfYear = (paybackEligibleNet - previousCumulative) / annualSavings
      paybackYears = year - 1 + fractionOfYear
      paybackFound = true
    }

    yearlyProjections.push({
      year,
      annualSavings: Math.round(annualSavings),
      cumulativeSavings: Math.round(cumulativeSavings),
      rateMultiplier: Math.round(rateMultiplier * 100) / 100,
      degradationMultiplier: Math.round(degradationMultiplier * 1000) / 1000,
    })
  }

  // Total savings at the end of the window
  const totalSavings = cumulativeSavings
  // Profit after paying back the system
  const netProfit = totalSavings - combinedNetCost

  return {
    yearlyProjections,
    totalSavings25Year: Math.round(totalSavings),
    netCost: Math.round(combinedNetCost),
    paybackYears: paybackFound ? Math.round(paybackYears * 10) / 10 : Number.POSITIVE_INFINITY,
    netProfit25Year: Math.round(netProfit),
    annualROI: combinedNetCost <= 0 ? 'N/A' : ((netProfit / combinedNetCost / years) * 100).toFixed(1),
    assumptions: {
      rateEscalation,
      systemDegradation,
      offsetCapFraction: capFraction,
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

export interface SolarBatteryOffsetCapInput {
  usageKwh: number
  productionKwh: number
  roofPitch?: string | number
  roofAzimuth?: number
  roofSections?: Array<{ azimuth?: number; orientationAzimuth?: number; direction?: string }>
}

export interface SolarBatteryOffsetCapResult {
  capFraction: number
  baseFraction: number
  matchesUsage: boolean
  orientationBonus: boolean
  productionBonus: boolean
  productionToLoadRatio: number
}

function normalizeAzimuth(value: number): number {
  return ((value % 360) + 360) % 360
}

function angularDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeAzimuth(a) - normalizeAzimuth(b))
  return diff > 180 ? 360 - diff : diff
}

function isSteepPitch(pitch?: string | number): boolean {
  if (typeof pitch === 'number') {
    return pitch >= 35
  }
  if (typeof pitch === 'string') {
    const normalized = pitch.toLowerCase()
    return normalized.includes('steep') || normalized.includes('40') || normalized.includes('45')
  }
  return false
}

function resolveAzimuth(input: SolarBatteryOffsetCapInput): number | undefined {
  if (typeof input.roofAzimuth === 'number' && Number.isFinite(input.roofAzimuth)) {
    return input.roofAzimuth
  }

  if (Array.isArray(input.roofSections)) {
    for (const section of input.roofSections) {
      if (typeof section?.azimuth === 'number') return section.azimuth
      if (typeof section?.orientationAzimuth === 'number') return section.orientationAzimuth
      if (typeof section?.direction === 'string' && section.direction.toLowerCase().includes('south')) return 180
    }
  }

  return undefined
}

export function computeSolarBatteryOffsetCap(input: SolarBatteryOffsetCapInput): SolarBatteryOffsetCapResult {
  const usage = Math.max(0, input.usageKwh || 0)
  const production = Math.max(0, input.productionKwh || 0)

  if (usage === 0) {
    return {
      capFraction: 0,
      baseFraction: 0.92,
      matchesUsage: false,
      orientationBonus: false,
      productionBonus: false,
      productionToLoadRatio: 0
    }
  }

  const ratio = production / usage
  const matchesUsage = ratio > 0.95 && ratio < 1.05

  const steep = isSteepPitch(input.roofPitch)
  const azimuth = resolveAzimuth(input)
  const orientationBonus = steep && (typeof azimuth === 'number' ? angularDifference(azimuth, 180) <= 25 : false)

  const productionBonus = ratio >= 1.1

  let baseFraction = matchesUsage ? 0.9 : 0.92
  if (orientationBonus) baseFraction += 0.01
  if (productionBonus) baseFraction += 0.01

  const capFraction = Math.min(baseFraction, 0.93)

  return {
    capFraction,
    baseFraction: matchesUsage ? 0.9 : 0.92,
    matchesUsage,
    orientationBonus,
    productionBonus,
    productionToLoadRatio: ratio
  }
}

