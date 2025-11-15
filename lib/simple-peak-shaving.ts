// Simple Peak-Shaving Calculator (Spreadsheet Formula)
// Based on manual usage distribution by rate period

import { BatterySpec } from '../config/battery-specs'
import { RatePlan } from '../config/rate-plans'

// Re-export types and constants from modular files
export type {
  UsageDistribution,
  SimplePeakShavingResult,
  SolarBatteryOffsetCapInput,
  SolarBatteryOffsetCapResult,
} from './peak-shaving/types'

export {
  DEFAULT_TOU_DISTRIBUTION,
  DEFAULT_ULO_DISTRIBUTION,
  DEFAULT_DAY_NIGHT_SPLIT,
  CMAX,
} from './peak-shaving/constants'

// Import types for internal use
import type {
  UsageDistribution,
  SimplePeakShavingResult,
  UsageBreakdown,
} from './peak-shaving/types'

// Import constants for internal use
import {
  DEFAULT_TOU_DISTRIBUTION,
  DEFAULT_ULO_DISTRIBUTION,
  DEFAULT_DAY_NIGHT_SPLIT,
  CMAX,
} from './peak-shaving/constants'

// Import formula implementations
import { applyUloFormula } from './peak-shaving/ulo-formula'
import { applyTouFormula } from './peak-shaving/tou-formula'
import { applyGenericFormula } from './peak-shaving/generic-formula'
import { computeSolarBatteryOffsetCap } from './peak-shaving/offset-cap'
import { costFromUsage, type RateStructure } from './peak-shaving/helpers'

// FRD-compliant calculation result with detailed breakdown
export interface FRDPeakShavingResult {
  // Step A: Day/Night split
  dayLoad: number
  nightLoad: number
  
  // Step B: Solar allocation
  solarToDay: number
  solarExcess: number
  dayGridAfterSolar: number
  
  // Step C: Battery charging
  battSolarCharged: number
  battGridCharged: number
  battTotal: number
  
  // Step D: Battery discharge allocation
  batteryDischargeByBucket: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  
  // Step E: Edge case handling
  edgeCase: 'none' | 'high_usage' | 'high_capacity'
  battTotalEffective: number
  effectiveCycles: number
  solarUnused: number
  
  // Step F: Final savings
  gridKWhByBucket: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  annualCostAfter: number
  annualSavings: number
  monthlySavings: number
  
  // Offset percentages for display
  offsetPercentages: {
    solarDirect: number
    solarChargedBattery: number
    uloChargedBattery: number
    gridRemaining: number
  }
}

// FRD-compliant calculation following Step A-F structure
export function calculateFRDPeakShaving(
  annualUsageKwh: number,      // U
  solarProductionKwh: number,   // S
  battery: BatterySpec,          // B (usable kWh)
  ratePlan: RatePlan,
  distribution?: UsageDistribution,
  aiMode: boolean = false,       // AI Optimization Mode (default OFF)
  dayNightSplit = DEFAULT_DAY_NIGHT_SPLIT
): FRDPeakShavingResult {
  // Safety checks: prevent division by zero and negative values
  const U = Math.max(0, annualUsageKwh || 0)
  const S = Math.max(0, solarProductionKwh || 0)
  const B = Math.max(0, battery.usableKwh || 0)
  
  if (U <= 0) {
    throw new Error('Annual usage must be greater than zero')
  }
  
  // Extract rates
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
  
  // Use default distribution if not provided
  const dist = distribution || (
    ratePlan.id === 'ulo' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION
  )
  
  // Calculate usage by period
  const usageByPeriod = {
    ultraLow: dist.ultraLowPercent ? (U * dist.ultraLowPercent / 100) : 0,
    offPeak: U * dist.offPeakPercent / 100,
    midPeak: U * dist.midPeakPercent / 100,
    onPeak: U * dist.onPeakPercent / 100,
  }
  
  // Calculate baseline cost
  const baselineCost = 
    (usageByPeriod.ultraLow || 0) * rates.ultraLow +
    usageByPeriod.offPeak * rates.offPeak +
    usageByPeriod.midPeak * rates.midPeak +
    usageByPeriod.onPeak * rates.onPeak
  
  // ============================================
  // STEP A: Split Load Into Day/Night
  // ============================================
  const dayLoad = U * dayNightSplit.p_day
  const nightLoad = U * dayNightSplit.p_night
  
  // ============================================
  // STEP B: Solar Allocation
  // ============================================
  // Solar may NOT exceed dayLoad (FRD requirement)
  const solarToDay = Math.min(S, dayLoad)
  const solarExcess = Math.max(S - dayLoad, 0)
  const dayGridAfterSolar = Math.max(dayLoad - solarToDay, 0)
  
  // ============================================
  // STEP C: Battery Charging
  // ============================================
  const maxBattKWh = B * CMAX  // Annual maximum battery discharge
  
  // C1: Solar → Battery
  const battSolarCharged = Math.min(solarExcess, maxBattKWh, nightLoad)
  
  // C2: Grid → Battery (both TOU and ULO with AI Mode)
  let battGridCharged = 0
  if (aiMode) {
    const battHeadroom = Math.max(maxBattKWh - battSolarCharged, 0)
    battGridCharged = Math.min(
      battHeadroom,
      nightLoad - battSolarCharged
    )
  }
  
  // C3: Total available battery discharge
  const battTotal = battSolarCharged + battGridCharged
  
  // ============================================
  // STEP D: Battery Discharge Allocation
  // ============================================
  // Priority order: On-peak > Mid-peak > Off-peak > ULO
  const batteryDischargeByBucket = {
    ultraLow: 0,
    offPeak: 0,
    midPeak: 0,
    onPeak: 0
  }
  
  let battRemaining = battTotal
  
  // On-peak first
  const onPeakDischarge = Math.min(usageByPeriod.onPeak, battRemaining)
  batteryDischargeByBucket.onPeak = onPeakDischarge
  battRemaining -= onPeakDischarge
  
  // Mid-peak second
  if (battRemaining > 0) {
    const midPeakDischarge = Math.min(usageByPeriod.midPeak, battRemaining)
    batteryDischargeByBucket.midPeak = midPeakDischarge
    battRemaining -= midPeakDischarge
  }
  
  // Off-peak third
  if (battRemaining > 0) {
    const offPeakDischarge = Math.min(usageByPeriod.offPeak, battRemaining)
    batteryDischargeByBucket.offPeak = offPeakDischarge
    battRemaining -= offPeakDischarge
  }
  
  // ULO last (only for ULO plans)
  if (battRemaining > 0 && usageByPeriod.ultraLow > 0) {
    const ultraLowDischarge = Math.min(usageByPeriod.ultraLow, battRemaining)
    batteryDischargeByBucket.ultraLow = ultraLowDischarge
    battRemaining -= ultraLowDischarge
  }
  
  // Calculate remaining grid usage after solar and battery discharge
  // Battery discharge offsets grid usage, so we subtract it
  const gridKWhByBucket = {
    ultraLow: Math.max(0, (usageByPeriod.ultraLow || 0) - (batteryDischargeByBucket.ultraLow || 0)),
    offPeak: Math.max(0, usageByPeriod.offPeak - batteryDischargeByBucket.offPeak),
    midPeak: Math.max(0, usageByPeriod.midPeak - batteryDischargeByBucket.midPeak),
    onPeak: Math.max(0, usageByPeriod.onPeak - batteryDischargeByBucket.onPeak)
  }
  
  // Add battery charging cost (only for grid-charged battery energy)
  // When AI Mode is ON and battery is grid-charged, we need to add that charging cost
  if (battGridCharged > 0) {
    if (rates.ultraLow > 0) {
      // ULO plan: charge at ultra-low rate
      gridKWhByBucket.ultraLow = (gridKWhByBucket.ultraLow || 0) + battGridCharged
    } else {
      // TOU plan: charge at off-peak rate (AI Mode enables grid charging at off-peak)
      gridKWhByBucket.offPeak = gridKWhByBucket.offPeak + battGridCharged
    }
  }
  // Solar-charged battery: no charging cost (already accounted for in solar allocation)
  
  // ============================================
  // STEP E: Edge Case Handling
  // ============================================
  let edgeCase: 'none' | 'high_usage' | 'high_capacity' = 'none'
  let battTotalEffective = battTotal
  let effectiveCycles = battTotal > 0 && B > 0 ? battTotal / B : 0
  let solarUnused = 0
  
  // Case 1: Usage >> Solar + Battery Capacity
  if (U > S + maxBattKWh) {
    edgeCase = 'high_usage'
    // Battery and solar run normally, remaining load stays proportional
    // Already handled above
  }
  
  // Case 2: Solar + Battery Capacity >> Usage
  if (S + maxBattKWh > U) {
    edgeCase = 'high_capacity'
    
    // Cap total energy offset at U
    const totalOffset = solarToDay + battTotal
    if (totalOffset > U) {
      // Cap battery discharge based on available high-priced loads
      const totalPeakMidNightLoads = 
        usageByPeriod.onPeak + 
        usageByPeriod.midPeak + 
        (usageByPeriod.ultraLow || 0) + 
        usageByPeriod.offPeak
      
      battTotalEffective = Math.min(battTotal, totalPeakMidNightLoads)
      effectiveCycles = battTotalEffective > 0 && B > 0 ? battTotalEffective / B : 0
    }
    
    // Excess solar
    solarUnused = Math.max(S - solarToDay - battSolarCharged, 0)
    // If zero-export mode → treat as spilled (already handled by capping)
    // If net-metering → count export separately (optional, not implemented)
  }
  
  // ============================================
  // STEP F: Final Savings Calculation
  // ============================================
  // F1: kWh still bought from grid
  const totalGridKWh = 
    (gridKWhByBucket.ultraLow || 0) +
    gridKWhByBucket.offPeak +
    gridKWhByBucket.midPeak +
    gridKWhByBucket.onPeak
  
  // F2: Annual energy cost after system
  const annualCostAfter = 
    (gridKWhByBucket.ultraLow || 0) * rates.ultraLow +
    gridKWhByBucket.offPeak * rates.offPeak +
    gridKWhByBucket.midPeak * rates.midPeak +
    gridKWhByBucket.onPeak * rates.onPeak
  
  // F3: Baseline cost (already calculated)
  // F4: Savings
  const annualSavings = baselineCost - annualCostAfter
  const monthlySavings = annualSavings / 12
  
  // Calculate offset percentages for display
  // Percentages should represent what portion of total usage is covered by each source
  const solarDirectPercent = U > 0 ? (solarToDay / U) * 100 : 0
  const solarChargedBatteryPercent = U > 0 ? (battSolarCharged / U) * 100 : 0
  const uloChargedBatteryPercent = U > 0 ? (battGridCharged / U) * 100 : 0
  // Grid remaining = total usage - solar direct - battery discharge
  // Battery discharge offsets grid usage, so we subtract it
  const totalOffset = solarToDay + battTotalEffective
  const gridRemainingKWh = Math.max(0, U - totalOffset)
  const gridRemainingPercent = U > 0 ? (gridRemainingKWh / U) * 100 : 0
  
  return {
    dayLoad,
    nightLoad,
    solarToDay,
    solarExcess,
    dayGridAfterSolar,
    battSolarCharged,
    battGridCharged,
    battTotal: battTotalEffective,
    batteryDischargeByBucket,
    edgeCase,
    battTotalEffective,
    effectiveCycles,
    solarUnused,
    gridKWhByBucket,
    annualCostAfter,
    annualSavings,
    monthlySavings,
    offsetPercentages: {
      solarDirect: solarDirectPercent,
      solarChargedBattery: solarChargedBatteryPercent,
      uloChargedBattery: uloChargedBatteryPercent,
      gridRemaining: gridRemainingPercent
    }
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
  
  // Allocate leftover energy to periods, prioritizing cheapest rates first, up to period capacity
  // This is realistic because people can shift some usage to cheap hours but there's a physical limit
  let remainingLeftover = leftoverEnergyKwh
  const leftoverByPeriod = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }
  
  // Period capacities based on usage distribution (maximum kWh that can be consumed in each period)
  const periodCapacity = {
    ultraLow: dist.ultraLowPercent ? (annualUsageKwh * dist.ultraLowPercent / 100) : 0,
    offPeak: annualUsageKwh * dist.offPeakPercent / 100,
    midPeak: annualUsageKwh * dist.midPeakPercent / 100,
    onPeak: annualUsageKwh * dist.onPeakPercent / 100
  }
  
  // Fill ultra-low first (if available in the rate plan)
  if (rates.ultraLow > 0 && remainingLeftover > 0) {
    leftoverByPeriod.ultraLow = Math.min(remainingLeftover, periodCapacity.ultraLow)
    remainingLeftover -= leftoverByPeriod.ultraLow
  }
  
  // Then fill off-peak
  if (remainingLeftover > 0) {
    leftoverByPeriod.offPeak = Math.min(remainingLeftover, periodCapacity.offPeak)
    remainingLeftover -= leftoverByPeriod.offPeak
  }
  
  // Then fill mid-peak (spillover from cheap hours)
  if (remainingLeftover > 0) {
    leftoverByPeriod.midPeak = Math.min(remainingLeftover, periodCapacity.midPeak)
    remainingLeftover -= leftoverByPeriod.midPeak
  }
  
  // Finally fill on-peak (last resort)
  if (remainingLeftover > 0) {
    leftoverByPeriod.onPeak = Math.min(remainingLeftover, periodCapacity.onPeak)
  }
  
  // Calculate blended cost based on waterfall allocation
  const leftoverCostAtOffPeak = 
    leftoverByPeriod.ultraLow * rates.ultraLow +
    leftoverByPeriod.offPeak * rates.offPeak +
    leftoverByPeriod.midPeak * rates.midPeak +
    leftoverByPeriod.onPeak * rates.onPeak
  
  // Calculate the effective blended rate for leftover energy
  const leftoverRatePerKwh = leftoverEnergyKwh > 0 ? leftoverCostAtOffPeak / leftoverEnergyKwh : 0
  
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
      ratePerKwh: leftoverRatePerKwh,
      breakdown: leftoverByPeriod
    }
  }
}

// Note: Solar allocation constants moved to ./peak-shaving/constants.ts

export function calculateSolarBatteryCombined(
  annualUsageKwh: number,
  solarProductionKwh: number,
  battery: BatterySpec,
  ratePlan: RatePlan,
  distribution?: UsageDistribution,
  offsetCapFraction?: number,
  aiMode: boolean = false  // AI Optimization Mode (default OFF)
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

  // Build rate structure for helper functions
  const rateStructure: RateStructure = {
    ultraLow: rates.ultraLow,
    offPeak: rates.offPeak,
    midPeak: rates.midPeak,
    onPeak: rates.onPeak,
  }

  // Start by figuring out the baseline bill without solar or batteries
  // Use actual rate structure for accurate savings calculation (especially important for battery arbitrage)
  // Calculate baseline using actual rate structure to properly account for arbitrage benefits
  const baselineAnnualBill = costFromUsage(usageOriginal, rateStructure)

  // Apply solar and battery using the custom client formulas, otherwise fall back to generic logic
  const isUloPlan = ratePlan.id === 'ulo' || ratePlan.id === 'ulo-solar-battery'
  const isTouPlan = ratePlan.id === 'tou' || ratePlan.id === 'tou-solar-battery'

  // Use modular formula implementations
  const applyUloFormulaLocal = () => {
    return applyUloFormula({
      annualUsageKwh,
      solarProductionKwh,
      battery,
      usageOriginal,
      rates: rateStructure,
      aiMode,
    })
  }

  const applyTouFormulaLocal = () => {
    return applyTouFormula({
      annualUsageKwh,
      solarProductionKwh,
      battery,
      usageOriginal,
      rates: rateStructure,
      aiMode,
    })
  }

  const applyGenericFormulaLocal = () => {
    return applyGenericFormula({
      solarProductionKwh,
      battery,
      usageOriginal,
      rates: rateStructure,
    })
  }

  const applyResult = isTouPlan
    ? applyTouFormulaLocal()
    : isUloPlan
    ? applyUloFormulaLocal()
    : applyGenericFormulaLocal()
  
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
    uncappedAnnualSavings, // Include uncapped savings for accurate savings percentage calculation
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

// Re-export offset cap function from modular file
export { computeSolarBatteryOffsetCap } from './peak-shaving/offset-cap'

