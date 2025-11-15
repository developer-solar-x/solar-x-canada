// ULO (Ultra-Low Overnight) Formula Implementation
// FRD: Ultra-Low Overnight (ULO) Energy & Savings Model
// Winter-Aware + Best-Case Optimization + Battery Cap Compliance

import type { BatterySpec } from '../../config/battery-specs'
import type { FormulaResult, UsageBreakdown } from './types'
import { ULO_FRD_CONSTANTS } from './constants'
import {
  costFromUsage,
  enforceMinimumGridPurchases,
  capTotalOffset,
  allocateSolarToPeriods,
  dischargeBatteryToPeriods,
  type RateStructure,
} from './helpers'

interface UloFormulaInput {
  annualUsageKwh: number
  solarProductionKwh: number
  battery: BatterySpec
  usageOriginal: UsageBreakdown
  rates: RateStructure
  aiMode: boolean
}

/**
 * Apply ULO formula with FRD compliance
 */
export function applyUloFormula(input: UloFormulaInput): FormulaResult {
  const { annualUsageKwh, solarProductionKwh, battery, usageOriginal, rates, aiMode } = input

  // Calculate solar cap (50% of usage or actual production, whichever is lower)
  const solarCap = Math.min(annualUsageKwh * 0.5, Math.max(0, solarProductionKwh || 0))

  // FRD 7.1: Hard Caps
  const MAX_BATTERY_OUTPUT_KWH = battery.usableKwh * 365 // e.g., 14.4 × 365 = 5,256 kWh
  const MIN_GRID_PURCHASES_KWH = annualUsageKwh * ULO_FRD_CONSTANTS.MIN_GRID_PURCHASES_PERCENT

  // FRD 3: Best-Case Annual Energy Allocation
  // Calculate target allocations based on usage (scaled from 10k baseline)
  const scaleFactor = annualUsageKwh / ULO_FRD_CONSTANTS.BASELINE_USAGE_KWH
  const targetSolarDirect = Math.min(
    annualUsageKwh * ULO_FRD_CONSTANTS.TARGET_SOLAR_DIRECT_PERCENT,
    solarCap
  )
  const targetSolarToBattery = Math.min(
    annualUsageKwh * ULO_FRD_CONSTANTS.TARGET_SOLAR_TO_BATTERY_PERCENT * scaleFactor,
    ULO_FRD_CONSTANTS.MAX_SOLAR_TO_BATTERY_KWH,
    ULO_FRD_CONSTANTS.MAX_SOLAR_TO_BATTERY_SUMMER + ULO_FRD_CONSTANTS.MAX_SOLAR_TO_BATTERY_WINTER
  )
  const targetUloToBattery = Math.min(
    annualUsageKwh * ULO_FRD_CONSTANTS.TARGET_ULO_TO_BATTERY_PERCENT * scaleFactor,
    ULO_FRD_CONSTANTS.MAX_ULO_TO_BATTERY_KWH
  )

  // Allocate solar directly to load (50% target)
  const { solarAllocation, remainingUsage: usageAfterSolar } = allocateSolarToPeriods(
    usageOriginal,
    Math.min(targetSolarDirect, solarCap),
    ['midPeak', 'onPeak', 'offPeak', 'ultraLow']
  )

  const postSolarAnnualBill = costFromUsage(usageAfterSolar, rates)

  // Calculate solar excess available for battery charging (capped per FRD)
  const solarUsedForLoad =
    solarAllocation.midPeak +
    solarAllocation.onPeak +
    solarAllocation.offPeak +
    (solarAllocation.ultraLow || 0)
  const solarExcess = Math.max(0, solarCap - solarUsedForLoad)
  const batteryFromSolar = Math.min(
    solarExcess,
    targetSolarToBattery,
    ULO_FRD_CONSTANTS.MAX_SOLAR_TO_BATTERY_KWH
  )

  // Calculate total battery discharge capacity (capped per FRD)
  // Total battery = solar-charged + ULO-charged (if AI Mode ON)
  const batteryFromUlo = aiMode
    ? Math.min(targetUloToBattery, ULO_FRD_CONSTANTS.MAX_ULO_TO_BATTERY_KWH)
    : 0
  const totalBatteryCapacity = batteryFromSolar + batteryFromUlo
  const maxBatteryDischarge = Math.min(totalBatteryCapacity, MAX_BATTERY_OUTPUT_KWH)

  // Discharge battery to cover expensive periods
  const { batteryOffsets, remainingUsage: usageAfterBattery } = dischargeBatteryToPeriods(
    usageAfterSolar,
    maxBatteryDischarge,
    ['onPeak', 'midPeak', 'offPeak']
  )

  // Calculate grid-charged battery (ULO → Battery)
  const batteryChargeRequired =
    batteryOffsets.midPeak + batteryOffsets.onPeak + batteryOffsets.offPeak
  const batterySolarCharged = Math.min(batteryFromSolar, batteryChargeRequired)
  const gridChargedBattery = aiMode
    ? Math.min(batteryChargeRequired - batterySolarCharged, batteryFromUlo)
    : 0

  // Add grid-charged battery to ultra-low usage cost
  if (gridChargedBattery > 0) {
    usageAfterBattery.ultraLow = (usageAfterBattery.ultraLow || 0) + gridChargedBattery
  }

  // FRD 7.1: Cap total offset at 85% first
  const { usageAfterBattery: cappedUsage, batteryOffsets: cappedBatteryOffsets } =
    capTotalOffset(
      usageAfterBattery,
      batteryOffsets,
      solarUsedForLoad,
      annualUsageKwh,
      ULO_FRD_CONSTANTS.MAX_OFFSET_PERCENT
    )

  // FRD 7.1: Enforce minimum grid purchases (≥ 10%)
  const { usageAfterBattery: finalUsage, batteryOffsets: finalBatteryOffsets } =
    enforceMinimumGridPurchases(cappedUsage, cappedBatteryOffsets, MIN_GRID_PURCHASES_KWH)

  const postSolarBatteryAnnualBill = costFromUsage(finalUsage, rates)

  return {
    postSolarAnnualBill,
    postSolarBatteryAnnualBill,
    batteryOffsets: finalBatteryOffsets,
    usageAfterSolar,
    usageAfterBattery: finalUsage,
    solarAllocation,
    batteryChargeRequired: gridChargedBattery, // Return ULO-charged battery amount
    solarCap,
  }
}

