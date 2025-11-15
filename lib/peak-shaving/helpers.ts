// Helper functions for peak-shaving calculations

import type { FormulaResult, UsageBreakdown } from './types'

// Rate structure
export interface RateStructure {
  ultraLow: number
  offPeak: number
  midPeak: number
  onPeak: number
}

/**
 * Calculate cost from usage breakdown using rate structure
 */
export function costFromUsage(
  usage: UsageBreakdown,
  rates: RateStructure
): number {
  return (
    (usage.ultraLow || 0) * rates.ultraLow +
    usage.offPeak * rates.offPeak +
    usage.midPeak * rates.midPeak +
    usage.onPeak * rates.onPeak
  )
}

/**
 * Enforce minimum grid purchases by reducing battery offsets
 */
export function enforceMinimumGridPurchases(
  usageAfterBattery: UsageBreakdown,
  batteryOffsets: UsageBreakdown,
  minGridPurchasesKwh: number
): { usageAfterBattery: UsageBreakdown; batteryOffsets: UsageBreakdown } {
  const totalGridPurchases = 
    (usageAfterBattery.ultraLow || 0) + 
    usageAfterBattery.offPeak + 
    usageAfterBattery.midPeak + 
    usageAfterBattery.onPeak

  if (totalGridPurchases < minGridPurchasesKwh) {
    const deficit = minGridPurchasesKwh - totalGridPurchases
    let remainingDeficit = deficit

    // Reduce battery offsets to ensure minimum grid purchases
    // Priority: reduce off-peak battery offset first, then mid-peak, then on-peak
    if (batteryOffsets.offPeak > 0 && remainingDeficit > 0) {
      const reduction = Math.min(batteryOffsets.offPeak, remainingDeficit)
      batteryOffsets.offPeak -= reduction
      usageAfterBattery.offPeak += reduction
      remainingDeficit -= reduction
    }

    if (batteryOffsets.midPeak > 0 && remainingDeficit > 0) {
      const reduction = Math.min(batteryOffsets.midPeak, remainingDeficit)
      batteryOffsets.midPeak -= reduction
      usageAfterBattery.midPeak += reduction
      remainingDeficit -= reduction
    }

    if (batteryOffsets.onPeak > 0 && remainingDeficit > 0) {
      const reduction = Math.min(batteryOffsets.onPeak, remainingDeficit)
      batteryOffsets.onPeak -= reduction
      usageAfterBattery.onPeak += reduction
      remainingDeficit -= reduction
    }
  }

  return { usageAfterBattery, batteryOffsets }
}

/**
 * Cap total offset at maximum percentage by reducing battery offsets
 */
export function capTotalOffset(
  usageAfterBattery: UsageBreakdown,
  batteryOffsets: UsageBreakdown,
  solarUsedForLoad: number,
  annualUsageKwh: number,
  maxOffsetPercent: number
): { usageAfterBattery: UsageBreakdown; batteryOffsets: UsageBreakdown } {
  const totalOffset = 
    solarUsedForLoad + 
    batteryOffsets.midPeak + 
    batteryOffsets.onPeak + 
    batteryOffsets.offPeak
  const maxOffsetKwh = annualUsageKwh * maxOffsetPercent

  if (totalOffset > maxOffsetKwh) {
    // Reduce battery offsets to meet cap
    const excessOffset = totalOffset - maxOffsetKwh
    const batteryOffsetTotal = 
      batteryOffsets.midPeak + 
      batteryOffsets.onPeak + 
      batteryOffsets.offPeak

    if (batteryOffsetTotal > 0) {
      // Reduce battery offsets proportionally
      const reductionRatio = Math.min(1, excessOffset / batteryOffsetTotal)
      const onPeakReduction = batteryOffsets.onPeak * reductionRatio
      const midPeakReduction = batteryOffsets.midPeak * reductionRatio
      const offPeakReduction = batteryOffsets.offPeak * reductionRatio

      batteryOffsets.onPeak -= onPeakReduction
      batteryOffsets.midPeak -= midPeakReduction
      batteryOffsets.offPeak -= offPeakReduction

      // Add back to grid usage
      usageAfterBattery.onPeak += onPeakReduction
      usageAfterBattery.midPeak += midPeakReduction
      usageAfterBattery.offPeak += offPeakReduction
    }
  }

  return { usageAfterBattery, batteryOffsets }
}

/**
 * Allocate solar to usage periods in priority order
 */
export function allocateSolarToPeriods(
  usage: UsageBreakdown,
  solarKwh: number,
  priorityOrder: Array<'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow'>
): {
  solarAllocation: UsageBreakdown
  remainingUsage: UsageBreakdown
  remainingSolar: number
} {
  const solarAllocation: UsageBreakdown = { offPeak: 0, midPeak: 0, onPeak: 0 }
  if (usage.ultraLow !== undefined) {
    solarAllocation.ultraLow = 0
  }

  const remainingUsage = { ...usage }
  let remainingSolar = solarKwh

  for (const key of priorityOrder) {
    if (remainingSolar <= 0) break
    const available = remainingUsage[key] || 0
    if (available <= 0) continue
    const applied = Math.min(available, remainingSolar)
    solarAllocation[key] = (solarAllocation[key] || 0) + applied
    remainingUsage[key] = available - applied
    remainingSolar -= applied
  }

  return { solarAllocation, remainingUsage, remainingSolar }
}

/**
 * Discharge battery to cover expensive periods
 */
export function dischargeBatteryToPeriods(
  usage: UsageBreakdown,
  batteryKwh: number,
  dischargeOrder: Array<'midPeak' | 'onPeak' | 'offPeak'>
): {
  batteryOffsets: UsageBreakdown
  remainingUsage: UsageBreakdown
  remainingBattery: number
} {
  const batteryOffsets: UsageBreakdown = { offPeak: 0, midPeak: 0, onPeak: 0 }
  if (usage.ultraLow !== undefined) {
    batteryOffsets.ultraLow = 0
  }

  const remainingUsage = { ...usage }
  let remainingBattery = batteryKwh

  for (const key of dischargeOrder) {
    if (remainingBattery <= 0) break
    const available = remainingUsage[key] || 0
    if (!available || available <= 0) continue
    const applied = Math.min(available, remainingBattery)
    batteryOffsets[key] = applied
    remainingUsage[key] = available - applied
    remainingBattery -= applied
  }

  return { batteryOffsets, remainingUsage, remainingBattery }
}

