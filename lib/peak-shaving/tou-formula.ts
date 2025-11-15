// TOU (Time-of-Use) Formula Implementation

import type { BatterySpec } from '../../config/battery-specs'
import type { FormulaResult, UsageBreakdown } from './types'
import { TOU_SOLAR_ALLOCATION } from './constants'
import {
  costFromUsage,
  allocateSolarToPeriods,
  dischargeBatteryToPeriods,
  type RateStructure,
} from './helpers'

interface TouFormulaInput {
  annualUsageKwh: number
  solarProductionKwh: number
  battery: BatterySpec
  usageOriginal: UsageBreakdown
  rates: RateStructure
  aiMode: boolean
}

/**
 * Apply TOU formula with weighted solar allocation
 */
export function applyTouFormula(input: TouFormulaInput): FormulaResult {
  const { annualUsageKwh, solarProductionKwh, battery, usageOriginal, rates, aiMode } = input

  const solarCap = Math.min(annualUsageKwh * 0.5, Math.max(0, solarProductionKwh || 0))
  const usageAfterSolar = { ...usageOriginal }
  const solarAllocation: UsageBreakdown = { offPeak: 0, midPeak: 0, onPeak: 0 }
  let remainingSolar = solarCap

  const orderedKeys: Array<'midPeak' | 'onPeak' | 'offPeak'> = ['midPeak', 'onPeak', 'offPeak']

  // Allocate solar with weights
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

  const postSolarAnnualBill = costFromUsage(usageAfterSolar, rates)

  // Calculate solar excess available for battery charging
  const solarUsedForLoad =
    solarAllocation.midPeak + solarAllocation.onPeak + solarAllocation.offPeak
  const solarExcess = Math.max(0, solarCap - solarUsedForLoad)

  // Battery capacity from solar excess (free charging)
  const batteryFromSolar = Math.min(solarExcess, battery.usableKwh * 365)

  // When AI Mode is ON, battery can charge from grid, allowing more discharge capacity
  // Battery total capacity = solar-charged + grid-charged (if AI Mode ON)
  const maxBatteryDischarge = aiMode
    ? battery.usableKwh * 365 // Can use full capacity with grid charging
    : batteryFromSolar // Limited to solar excess only

  // Discharge battery to cover expensive periods
  const { batteryOffsets, remainingUsage: usageAfterBattery } = dischargeBatteryToPeriods(
    usageAfterSolar,
    maxBatteryDischarge,
    ['onPeak', 'midPeak', 'offPeak']
  )

  // Calculate grid-charged battery correctly (only the portion not covered by solar excess)
  const batteryChargeRequired =
    batteryOffsets.midPeak + batteryOffsets.onPeak + batteryOffsets.offPeak
  let gridChargedBattery = 0
  let batteryChargeFromOffPeak = 0

  if (aiMode) {
    // AI Mode ON: Calculate how much battery is charged from grid vs solar excess
    // Battery charged from solar excess (free)
    const batterySolarCharged = Math.min(solarExcess, batteryChargeRequired)

    // Battery charged from grid (only if there's a deficit after solar)
    gridChargedBattery = Math.max(0, batteryChargeRequired - batterySolarCharged)

    // Only add grid-charged portion to off-peak usage cost
    usageAfterBattery.offPeak += gridChargedBattery

    // Set batteryChargeFromOffPeak to grid-charged amount for breakdown display
    batteryChargeFromOffPeak = gridChargedBattery
  } else {
    // If AI Mode OFF: Battery only charges from solar excess, no grid charging cost
    // batteryChargeFromOffPeak should be 0 (no grid charging)
    batteryChargeFromOffPeak = 0
  }

  const postSolarBatteryAnnualBill = costFromUsage(usageAfterBattery, rates)

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

