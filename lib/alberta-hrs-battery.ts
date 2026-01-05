// Alberta HRS Battery Savings Calculation
// Uses Alberta Solar Club seasonal rates for HRS detailed estimate with battery

import { calculateAlbertaSolarClub } from './alberta-solar-club'
import { calculateCombinedMultiYear } from './simple-peak-shaving'
import type { BatterySpec } from '../config/battery-specs'
import type { UsageDistribution, UsageDataPoint } from './usage-parser'

// Alberta Solar Club baseline rate (6.89¢/kWh for all usage)
const ALBERTA_BASELINE_RATE = 0.0689 // dollars per kWh

export interface AlbertaHRSBatteryResult {
  // Baseline (pre-solar)
  baselineAnnualBill: number
  
  // Solar-only results
  postSolarAnnualBill: number
  solarOnlySavings: number
  
  // Solar + Battery results
  postSolarBatteryAnnualBill: number
  batteryOnTopSavings: number
  combinedAnnualSavings: number
  combinedMonthlySavings: number
  
  // Alberta-specific seasonal data
  alberta?: {
    // Solar-only seasonal data
    solarOnly: {
      highProductionSeason: {
        exportedKwh: number
        exportCredits: number
        importedKwh: number
        importCost: number
      }
      lowProductionSeason: {
        exportedKwh: number
        exportCredits: number
        importedKwh: number
        importCost: number
      }
      totalSolarProduction: number
      totalExported: number
      totalImported: number
      totalExportCredits: number
      totalImportCost: number
    }
    // Solar + Battery seasonal data
    solarBattery: {
      highProductionSeason: {
        exportedKwh: number
        exportCredits: number
        importedKwh: number
        importCost: number
      }
      lowProductionSeason: {
        exportedKwh: number
        exportCredits: number
        importedKwh: number
        importCost: number
      }
      totalSolarProduction: number
      totalExported: number
      totalImported: number
      totalExportCredits: number
      totalImportCost: number
      batterySolarCharged: number
      batteryGridCharged: number
    }
  }
  
  // Breakdown (for compatibility with existing UI)
  breakdown?: {
    originalUsage: {
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
    solarAllocation: {
      ultraLow?: number
      offPeak: number
      midPeak: number
      onPeak: number
    }
    batteryOffsets: {
      ultraLow?: number
      offPeak: number
      midPeak: number
      onPeak: number
    }
    batteryChargeFromOffPeak?: number
    solarCapKwh?: number
  }
  
  // Projection data
  projection?: ReturnType<typeof calculateCombinedMultiYear>
}

/**
 * Calculate battery savings for Alberta HRS detailed estimate
 * Uses Alberta Solar Club seasonal rates (33¢/kWh export, 6.89¢/kWh import)
 * Battery savings come from self-consumption (storing solar for nighttime use)
 */
export function calculateAlbertaHRSBatterySavings(
  annualUsageKwh: number,
  solarProductionKwh: number,
  battery: BatterySpec,
  monthlySolarProduction: number[],
  usageData?: UsageDataPoint[],
  usageDistribution?: UsageDistribution,
  year: number = new Date().getFullYear(),
  snowLossFactor: number = 0.03
): AlbertaHRSBatteryResult {
  // Baseline: All usage at 6.89¢/kWh
  const baselineAnnualBill = annualUsageKwh * ALBERTA_BASELINE_RATE
  
  // Calculate solar-only scenario (no battery)
  const solarOnlyResult = calculateAlbertaSolarClub(
    monthlySolarProduction,
    annualUsageKwh,
    usageData,
    year,
    usageDistribution,
    null, // No battery
    false, // No AI mode
    snowLossFactor
  )
  
  const postSolarAnnualBill = solarOnlyResult.annual.netAnnualBill
  const solarOnlySavings = baselineAnnualBill - postSolarAnnualBill
  
  // Calculate solar + battery scenario
  const solarBatteryResult = calculateAlbertaSolarClub(
    monthlySolarProduction,
    annualUsageKwh,
    usageData,
    year,
    usageDistribution,
    battery, // With battery
    false, // No AI mode (Alberta doesn't support grid arbitrage)
    snowLossFactor
  )
  
  const postSolarBatteryAnnualBill = solarBatteryResult.annual.netAnnualBill
  const batteryOnTopSavings = postSolarAnnualBill - postSolarBatteryAnnualBill
  const combinedAnnualSavings = baselineAnnualBill - postSolarBatteryAnnualBill
  const combinedMonthlySavings = combinedAnnualSavings / 12
  
  // Extract Alberta-specific seasonal data
  const albertaData = {
    solarOnly: {
      highProductionSeason: {
        exportedKwh: solarOnlyResult.alberta.highProductionSeason.exportedKwh,
        exportCredits: solarOnlyResult.alberta.highProductionSeason.exportCredits,
        importedKwh: solarOnlyResult.alberta.highProductionSeason.importedKwh,
        importCost: solarOnlyResult.alberta.highProductionSeason.importCost,
      },
      lowProductionSeason: {
        exportedKwh: solarOnlyResult.alberta.lowProductionSeason.exportedKwh,
        exportCredits: solarOnlyResult.alberta.lowProductionSeason.exportCredits,
        importedKwh: solarOnlyResult.alberta.lowProductionSeason.importedKwh,
        importCost: solarOnlyResult.alberta.lowProductionSeason.importCost,
      },
      totalSolarProduction: solarOnlyResult.annual.totalSolarProduction,
      totalExported: solarOnlyResult.annual.totalExported,
      totalImported: solarOnlyResult.annual.totalImported,
      totalExportCredits: solarOnlyResult.annual.exportCredits,
      totalImportCost: solarOnlyResult.annual.importCost,
    },
    solarBattery: {
      highProductionSeason: {
        exportedKwh: solarBatteryResult.alberta.highProductionSeason.exportedKwh,
        exportCredits: solarBatteryResult.alberta.highProductionSeason.exportCredits,
        importedKwh: solarBatteryResult.alberta.highProductionSeason.importedKwh,
        importCost: solarBatteryResult.alberta.highProductionSeason.importCost,
      },
      lowProductionSeason: {
        exportedKwh: solarBatteryResult.alberta.lowProductionSeason.exportedKwh,
        exportCredits: solarBatteryResult.alberta.lowProductionSeason.exportCredits,
        importedKwh: solarBatteryResult.alberta.lowProductionSeason.importedKwh,
        importCost: solarBatteryResult.alberta.lowProductionSeason.importCost,
      },
      totalSolarProduction: solarBatteryResult.annual.totalSolarProduction,
      totalExported: solarBatteryResult.annual.totalExported,
      totalImported: solarBatteryResult.annual.totalImported,
      totalExportCredits: solarBatteryResult.annual.exportCredits,
      totalImportCost: solarBatteryResult.annual.importCost,
      batterySolarCharged: solarBatteryResult.battery?.totalSolarCharged || 0,
      batteryGridCharged: solarBatteryResult.battery?.totalGridCharged || 0,
    },
  }
  
  // Create breakdown structure for compatibility with existing UI
  // Since Alberta uses seasonal rates, we'll approximate period breakdown
  // by distributing usage evenly across periods (for display purposes only)
  const breakdown = {
    originalUsage: {
      offPeak: annualUsageKwh * 0.25, // Approximate distribution
      midPeak: annualUsageKwh * 0.25,
      onPeak: annualUsageKwh * 0.50,
    },
    usageAfterSolar: {
      offPeak: solarOnlyResult.annual.totalImported * 0.25,
      midPeak: solarOnlyResult.annual.totalImported * 0.25,
      onPeak: solarOnlyResult.annual.totalImported * 0.50,
    },
    usageAfterBattery: {
      offPeak: solarBatteryResult.annual.totalImported * 0.25,
      midPeak: solarBatteryResult.annual.totalImported * 0.25,
      onPeak: solarBatteryResult.annual.totalImported * 0.50,
    },
    solarAllocation: {
      offPeak: (solarOnlyResult.annual.totalSolarProduction - solarOnlyResult.annual.totalExported) * 0.25,
      midPeak: (solarOnlyResult.annual.totalSolarProduction - solarOnlyResult.annual.totalExported) * 0.25,
      onPeak: (solarOnlyResult.annual.totalSolarProduction - solarOnlyResult.annual.totalExported) * 0.50,
    },
    batteryOffsets: {
      offPeak: batteryOnTopSavings / ALBERTA_BASELINE_RATE * 0.25,
      midPeak: batteryOnTopSavings / ALBERTA_BASELINE_RATE * 0.25,
      onPeak: batteryOnTopSavings / ALBERTA_BASELINE_RATE * 0.50,
    },
    batteryChargeFromOffPeak: 0, // No grid charging in Alberta
    solarCapKwh: solarProductionKwh,
  }
  
  return {
    baselineAnnualBill,
    postSolarAnnualBill,
    solarOnlySavings,
    postSolarBatteryAnnualBill,
    batteryOnTopSavings,
    combinedAnnualSavings,
    combinedMonthlySavings,
    alberta: albertaData,
    breakdown,
  }
}

/**
 * Calculate 25-year projection for Alberta HRS battery savings
 */
export function calculateAlbertaHRSBatteryProjection(
  firstYearAnnualSavings: number,
  combinedNetCost: number,
  baselineAnnualBill: number,
  rateEscalation: number = 0.05,
  systemDegradation: number = 0.005,
  years: number = 25
): ReturnType<typeof calculateCombinedMultiYear> {
  return calculateCombinedMultiYear(
    firstYearAnnualSavings,
    combinedNetCost,
    rateEscalation,
    systemDegradation,
    years,
    {
      baselineAnnualBill,
      offsetCapFraction: undefined, // No cap for Alberta (seasonal rates)
    }
  )
}

