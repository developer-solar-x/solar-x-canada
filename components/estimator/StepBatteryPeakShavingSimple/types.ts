import type { SimplePeakShavingResult } from '@/lib/simple-peak-shaving'

export interface StepBatteryPeakShavingSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
  manualMode?: boolean
}

export type CombinedPlanResult = {
  annual: number
  monthly: number
  projection: any
  netCost: number
  baselineAnnualBill?: number
  postAnnualBill?: number
  baselineAnnualBillEnergyOnly?: number
  postSolarBatteryAnnualBillEnergyOnly?: number
  solarOnlyAnnual?: number
  batteryAnnual?: number
  solarNetCost?: number
  solarRebateApplied?: number
  batteryNetCost?: number
  batteryRebateApplied?: number
  batteryGrossCost?: number
  solarProductionKwh?: number
  breakdown?: {
    originalUsage: Record<'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow', number>
    usageAfterSolar: Record<'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow', number>
    usageAfterBattery: Record<'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow', number>
    solarAllocation?: Record<'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow', number>
    batteryOffsets: Record<'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow', number>
    batteryChargeFromUltraLow?: number
    batteryChargeFromOffPeak?: number
    solarCapKwh?: number
  }
}

export type PlanResultEntry = {
  result: SimplePeakShavingResult
  projection: any
  combined?: CombinedPlanResult
}

export type PlanResultMap = Map<string, PlanResultEntry>

