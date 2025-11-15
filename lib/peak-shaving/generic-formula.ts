// Generic Formula Implementation (for non-TOU/ULO rate plans)

import type { BatterySpec } from '../../config/battery-specs'
import type { FormulaResult, UsageBreakdown } from './types'
import { costFromUsage, type RateStructure } from './helpers'

interface GenericFormulaInput {
  solarProductionKwh: number
  battery: BatterySpec
  usageOriginal: UsageBreakdown
  rates: RateStructure
}

/**
 * Apply generic formula - simple priority-based allocation
 */
export function applyGenericFormula(input: GenericFormulaInput): FormulaResult {
  const { solarProductionKwh, battery, usageOriginal, rates } = input

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
  const postSolarAnnualBill = costFromUsage(usageAfterSolar, rates)

  // Now let the battery step in using the remaining usage after solar
  const usageForBattery = { ...usageAfterSolar }
  let remainingBattery = battery.usableKwh * 365
  const batteryOffsets: UsageBreakdown = { offPeak: 0, midPeak: 0, onPeak: 0 }
  if (usageForBattery.ultraLow !== undefined) {
    batteryOffsets.ultraLow = 0
  }

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
  const batteryChargingCost =
    (batteryOffsets.onPeak +
      batteryOffsets.midPeak +
      batteryOffsets.offPeak +
      (batteryOffsets.ultraLow || 0)) *
    chargeRate

  // Costs after both technologies are working together
  const postSolarBatteryAnnualBill =
    usageForBattery.offPeak * rates.offPeak +
    usageForBattery.midPeak * rates.midPeak +
    usageForBattery.onPeak * rates.onPeak +
    ((usageForBattery.ultraLow || 0) * rates.ultraLow || 0) +
    batteryChargingCost

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

