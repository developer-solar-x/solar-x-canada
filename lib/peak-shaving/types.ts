// Types and interfaces for peak-shaving calculations

import { BatterySpec } from '../../config/battery-specs'
import { RatePlan } from '../../config/rate-plans'

// Usage distribution by period (user input or defaults)
export interface UsageDistribution {
  offPeakPercent: number    // % of annual usage during off-peak
  midPeakPercent: number    // % of annual usage during mid-peak
  onPeakPercent: number     // % of annual usage during on-peak
  ultraLowPercent?: number  // % of annual usage during ultra-low (ULO only)
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
    ratePerKwh: number  // Blended rate per kWh charged for leftover energy
    breakdown: {  // How leftover energy is distributed across rate periods
      ultraLow: number
      offPeak: number
      midPeak: number
      onPeak: number
    }
  }
}

// FRD-compliant calculation result with detailed breakdown
export interface FRDPeakShavingResult {
  // Step A: Day/Night split
  dayNightSplit: {
    dayUsageKwh: number
    nightUsageKwh: number
    dayPercent: number
    nightPercent: number
  }
  
  // Step B: Solar allocation
  solarAllocation: {
    daySolarKwh: number
    nightSolarKwh: number
    daySolarPercent: number
    nightSolarPercent: number
  }
  
  // Step C: Battery operation
  batteryOperation: {
    solarChargedBatteryKwh: number
    gridChargedBatteryKwh: number
    totalBatteryKwh: number
    batteryDischargeKwh: number
  }
  
  // Step D: Final offset percentages
  offsetPercentages: {
    solarDirect: number
    solarChargedBattery: number
    uloChargedBattery: number
    gridRemaining: number
  }
  
  // Cost breakdown
  costs: {
    baseline: number
    afterSolar: number
    afterBattery: number
    annualSavings: number
  }
}

// Formula result interface (used internally)
export interface FormulaResult {
  postSolarAnnualBill: number
  postSolarBatteryAnnualBill: number
  batteryOffsets: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  usageAfterSolar: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  usageAfterBattery: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  solarAllocation?: {
    ultraLow?: number
    offPeak: number
    midPeak: number
    onPeak: number
  }
  batteryChargeRequired?: number
  batteryChargeFromOffPeak?: number
  solarCap?: number
}

// Solar battery offset cap input
export interface SolarBatteryOffsetCapInput {
  usageKwh: number
  productionKwh: number
  roofPitch?: string | number
  roofAzimuth?: number
  roofSections?: Array<{ azimuth?: number; orientationAzimuth?: number; direction?: string }>
}

// Solar battery offset cap result
export interface SolarBatteryOffsetCapResult {
  capFraction: number
  baseFraction: number
  matchesUsage: boolean
  orientationBonus: boolean
  productionBonus: boolean
  productionToLoadRatio: number
}

// Usage breakdown by period (used internally in formulas)
export interface UsageBreakdown {
  ultraLow?: number
  offPeak: number
  midPeak: number
  onPeak: number
}

