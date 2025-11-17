// Custom hooks for StepBatteryPeakShavingSimple calculations

import { useEffect, useMemo, useState } from 'react'
import { BATTERY_SPECS, BatterySpec, calculateBatteryFinancials } from '@/config/battery-specs'
import { calculateSystemCost } from '@/config/pricing'
import {
  calculateSimplePeakShaving,
  calculateSimpleMultiYear,
  calculateCombinedMultiYear,
  calculateSolarBatteryCombined,
  calculateFRDPeakShaving,
  UsageDistribution,
  SimplePeakShavingResult,
  computeSolarBatteryOffsetCap,
  FRDPeakShavingResult,
} from '@/lib/simple-peak-shaving'
import type { CombinedPlanResult, PlanResultMap } from './types'
import { getCustomTouRatePlan, getCustomUloRatePlan, type CustomRates } from './rate-plans'

interface UseCalculationResultsParams {
  annualUsageKwh: number
  selectedBatteries: string[]
  touDistribution: UsageDistribution
  uloDistribution: UsageDistribution
  customRates: CustomRates
  effectiveSystemSizeKw: number
  effectiveSolarProductionKwh: number
  displayedMonthlyBill: number
  overrideEstimate: any
  dataEstimate: any
  offsetCapInfo: ReturnType<typeof computeSolarBatteryOffsetCap>
  aiMode: boolean
}

/**
 * Combine multiple battery specs into a single combined battery
 */
function combineBatteries(batteries: BatterySpec[]): BatterySpec | null {
  if (batteries.length === 0) return null
  
  return batteries.reduce((combined, current, idx) => {
    if (idx === 0) return { ...current }
    return {
      ...combined,
      nominalKwh: combined.nominalKwh + current.nominalKwh,
      usableKwh: combined.usableKwh + current.usableKwh,
      price: combined.price + current.price
    }
  }, batteries[0])
}

/**
 * Calculate solar rebate based on system size
 */
function calculateSolarRebate(systemSizeKw: number): number {
  const solarRebatePerKw = 1000
  const solarMaxRebate = 5000
  return systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0
}

/**
 * Calculate combined plan result for a rate plan
 */
function calculateCombinedResult(
  params: UseCalculationResultsParams,
  ratePlan: ReturnType<typeof getCustomTouRatePlan> | ReturnType<typeof getCustomUloRatePlan>,
  distribution: UsageDistribution,
  customRatesKey: 'tou' | 'ulo'
): CombinedPlanResult | null {
  const {
    annualUsageKwh,
    selectedBatteries,
    effectiveSystemSizeKw,
    effectiveSolarProductionKwh,
    displayedMonthlyBill,
    overrideEstimate,
    dataEstimate,
    offsetCapInfo,
    aiMode,
  } = params

  const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
  const battery = combineBatteries(batteries)
  
  if (!battery) return null

  const solarRebate = calculateSolarRebate(effectiveSystemSizeKw)
  const batteryRebate = Math.min(battery.nominalKwh * 300, 5000)
  const netCost = battery.price - batteryRebate

  const calcResult = calculateSimplePeakShaving(
    annualUsageKwh,
    battery,
    ratePlan,
    distribution,
    effectiveSolarProductionKwh > 0 ? effectiveSolarProductionKwh : undefined
  )

  const multiYear = calculateSimpleMultiYear(calcResult, netCost, 0.05, 25)
  const currentEstimate = overrideEstimate || dataEstimate

  const combinedModel = calculateSolarBatteryCombined(
    annualUsageKwh,
    effectiveSolarProductionKwh,
    battery,
    ratePlan,
    distribution,
    offsetCapInfo.capFraction,
    aiMode
  )

  const combinedAnnualRaw = combinedModel.combinedAnnualSavings
  const baselineAnnualDisplay = displayedMonthlyBill * 12
  const combinedAnnual = Math.min(baselineAnnualDisplay, combinedAnnualRaw)
  const combinedMonthly = Math.round(combinedAnnual / 12)
  const newBillAnnual = Math.max(0, baselineAnnualDisplay - combinedAnnual)

  const solarRaw = Math.max(0, combinedModel.solarOnlySavings)
  const batteryRaw = Math.max(0, combinedModel.batteryOnTopSavings)
  const totalRaw = solarRaw + batteryRaw
  const scalingFactor = totalRaw > 0 ? Math.min(1, combinedAnnual / totalRaw) : 0
  const solarScaled = totalRaw > 0 ? solarRaw * scalingFactor : 0
  const batteryScaled = totalRaw > 0 ? batteryRaw * scalingFactor : 0

  const manualSolarNet = Math.max(0, calculateSystemCost(effectiveSystemSizeKw) - solarRebate)
  const solarNet = (currentEstimate?.costs?.netCost != null) ? currentEstimate.costs.netCost : manualSolarNet
  const combinedNet = Math.max(0, solarNet + netCost)

  const combinedProjection = calculateCombinedMultiYear(
    combinedAnnual,
    combinedNet,
    0.05,
    0.005,
    25,
    {
      baselineAnnualBill: baselineAnnualDisplay,
      offsetCapFraction: offsetCapInfo.capFraction,
    }
  )

  return {
    annual: combinedAnnual,
    monthly: combinedMonthly,
    projection: combinedProjection,
    netCost: combinedNet,
    baselineAnnualBill: combinedModel.baselineAnnualBill,
    postAnnualBill: newBillAnnual,
    baselineAnnualBillEnergyOnly: combinedModel.baselineAnnualBill,
    postSolarBatteryAnnualBillEnergyOnly: combinedModel.postSolarBatteryAnnualBill,
    postSolarBatteryAnnualBill: combinedModel.postSolarBatteryAnnualBill,
    uncappedAnnualSavings: combinedModel.uncappedAnnualSavings,
    solarOnlyAnnual: solarScaled,
    batteryAnnual: batteryScaled,
    solarNetCost: solarNet,
    solarRebateApplied: solarRebate,
    solarProductionKwh: effectiveSolarProductionKwh,
    batteryNetCost: netCost,
    batteryRebateApplied: batteryRebate,
    batteryGrossCost: battery.price,
    breakdown: combinedModel.breakdown,
  }
}

/**
 * Hook to calculate TOU results
 */
export function useTouResults(params: UseCalculationResultsParams) {
  const [touResults, setTouResults] = useState<PlanResultMap>(new Map())

  useEffect(() => {
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any, combined?: CombinedPlanResult}>()
    const touRatePlan = getCustomTouRatePlan(params.customRates.tou)

    const batteries = params.selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
    const battery = combineBatteries(batteries)

    if (battery) {
      const calcResult = calculateSimplePeakShaving(
        params.annualUsageKwh,
        battery,
        touRatePlan,
        params.touDistribution,
        params.effectiveSolarProductionKwh > 0 ? params.effectiveSolarProductionKwh : undefined
      )

      const batteryRebate = Math.min(battery.nominalKwh * 300, 5000)
      const netCost = battery.price - batteryRebate
      const multiYear = calculateSimpleMultiYear(calcResult, netCost, 0.05, 25)

      const combined = calculateCombinedResult(params, touRatePlan, params.touDistribution, 'tou')

      newResults.set('combined', {
        result: calcResult,
        projection: multiYear,
        combined: combined || undefined,
      })
    }

    setTouResults(newResults)
  }, [
    params.annualUsageKwh,
    params.selectedBatteries,
    params.touDistribution,
    params.customRates.tou,
    params.effectiveSystemSizeKw,
    params.effectiveSolarProductionKwh,
    params.offsetCapInfo.capFraction,
    params.aiMode,
  ])

  return touResults
}

/**
 * Hook to calculate ULO results
 */
export function useUloResults(params: UseCalculationResultsParams) {
  const [uloResults, setUloResults] = useState<PlanResultMap>(new Map())

  useEffect(() => {
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any, combined?: CombinedPlanResult}>()
    const uloRatePlan = getCustomUloRatePlan(params.customRates.ulo)

    const batteries = params.selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
    const battery = combineBatteries(batteries)

    if (battery) {
      const calcResult = calculateSimplePeakShaving(
        params.annualUsageKwh,
        battery,
        uloRatePlan,
        params.uloDistribution,
        params.effectiveSolarProductionKwh > 0 ? params.effectiveSolarProductionKwh : undefined
      )

      const batteryRebate = Math.min(battery.nominalKwh * 300, 5000)
      const netCost = battery.price - batteryRebate
      const multiYear = calculateSimpleMultiYear(calcResult, netCost, 0.05, 25)

      const combined = calculateCombinedResult(params, uloRatePlan, params.uloDistribution, 'ulo')

      newResults.set('combined', {
        result: calcResult,
        projection: multiYear,
        combined: combined || undefined,
      })
    }

    setUloResults(newResults)
  }, [
    params.annualUsageKwh,
    params.selectedBatteries,
    params.uloDistribution,
    params.customRates.ulo,
    params.effectiveSystemSizeKw,
    params.effectiveSolarProductionKwh,
    params.offsetCapInfo.capFraction,
    params.aiMode,
  ])

  return uloResults
}

/**
 * Hook to calculate FRD results for offset percentages
 */
export function useFrdResults(params: UseCalculationResultsParams) {
  return useMemo(() => {
    if (!params.annualUsageKwh || params.annualUsageKwh <= 0) return { tou: null, ulo: null }
    
    const batteries = params.selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
    if (batteries.length === 0) return { tou: null, ulo: null }
    
    const battery = combineBatteries(batteries)!
    
    try {
      const touResult = calculateFRDPeakShaving(
        params.annualUsageKwh,
        params.effectiveSolarProductionKwh,
        battery,
        getCustomTouRatePlan(params.customRates.tou),
        params.touDistribution,
        params.offsetCapInfo.capFraction,
        params.aiMode
      )

      const uloResult = calculateFRDPeakShaving(
        params.annualUsageKwh,
        params.effectiveSolarProductionKwh,
        battery,
        getCustomUloRatePlan(params.customRates.ulo),
        params.uloDistribution,
        params.offsetCapInfo.capFraction,
        params.aiMode
      )

      return { tou: touResult, ulo: uloResult }
    } catch (error) {
      console.error('FRD calculation error:', error)
      return { tou: null, ulo: null }
    }
  }, [
    params.annualUsageKwh,
    params.effectiveSolarProductionKwh,
    params.selectedBatteries,
    params.touDistribution,
    params.uloDistribution,
    params.customRates.tou,
    params.customRates.ulo,
    params.offsetCapInfo.capFraction,
    params.aiMode,
  ])
}

