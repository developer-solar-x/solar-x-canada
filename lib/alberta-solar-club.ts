// Alberta Solar Club Net Metering Calculation
// Uses seasonal rates: High Production (33¢/kWh) and Low Production (6.89¢/kWh)

import type { NetMeteringResult, MonthlyNetMeteringResult, HourlyNetMeteringData } from './net-metering'
import { generateAnnualUsagePattern } from './usage-parser'
import { TOU_RATE_PLAN } from '../config/rate-plans'
import type { UsageDistribution } from './simple-peak-shaving'
import type { BatterySpec } from '../config/battery-specs'

// Monthly derate factors for solar production (from net-metering.ts)
const MONTHLY_DERATE_FACTORS = [0.35, 0.50, 0.70, 1.0, 1.0, 1.0, 1.0, 1.0, 0.80, 0.60, 0.45, 0.25]

// Typical hourly solar production distribution (normalized to 1.0)
const HOURLY_PRODUCTION_PATTERN = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  // 0-5 AM: no production
  0.0, 0.05, 0.15, 0.35, 0.55, 0.75,  // 6-11 AM: rising
  0.90, 1.0, 0.95, 0.85, 0.70, 0.50,  // 12-5 PM: peak then declining
  0.25, 0.10, 0.0, 0.0, 0.0, 0.0   // 6-11 PM: declining to zero
]

/**
 * Generate hourly solar production pattern from monthly totals
 */
function generateHourlyProductionPattern(
  monthlyKwh: number[],
  year: number = new Date().getFullYear()
): Array<{ timestamp: Date; kwh: number }> {
  const hourlyProduction: Array<{ timestamp: Date; kwh: number }> = []
  
  for (let month = 0; month < 12; month++) {
    const monthIndex = month // 0-11
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const monthlyTotal = monthlyKwh[month] || 0
    
    const dailyAverage = monthlyTotal / daysInMonth
    
    // Normalize hourly pattern to sum to 1.0
    const hourlyPatternSum = HOURLY_PRODUCTION_PATTERN.reduce((sum, val) => sum + val, 0)
    
    for (let day = 1; day <= daysInMonth; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(year, monthIndex, day, hour, 0, 0)
        const hourlyKwh = dailyAverage * (HOURLY_PRODUCTION_PATTERN[hour] / hourlyPatternSum)
        hourlyProduction.push({ timestamp, kwh: hourlyKwh })
      }
    }
  }
  
  return hourlyProduction.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Alberta Solar Club Rates
const HIGH_PRODUCTION_RATE = 33.00 // cents per kWh (for exports during high production months)
const LOW_PRODUCTION_RATE = 6.89 // cents per kWh (for imports during low production months)
const CASH_BACK_RATE = 0.03 // 3% cash back on imports

// High production months (typically April-September) - months 3-8 (0-indexed)
const HIGH_PRODUCTION_MONTHS = [3, 4, 5, 6, 7, 8] // April, May, June, July, August, September
// Low production months (typically October-March) - months 9, 10, 11, 0, 1, 2
const LOW_PRODUCTION_MONTHS = [9, 10, 11, 0, 1, 2] // October, November, December, January, February, March

export interface AlbertaSolarClubResult extends NetMeteringResult {
  alberta: {
    highProductionSeason: {
      months: number[]
      exportedKwh: number
      exportCredits: number
      importedKwh: number
      importCost: number
    }
    lowProductionSeason: {
      months: number[]
      exportedKwh: number
      exportCredits: number
      importedKwh: number
      importCost: number
    }
    cashBackAmount: number
    estimatedCarbonCredits: number
  }
}

/**
 * Calculate net metering for Alberta Solar Club
 * Uses seasonal rates: 33¢/kWh for exports in high production months, 6.89¢/kWh for imports in low production months
 * @param snowLossFactor - Winter snow loss (0.03 = 3% loss, 0.05 = 5% loss). Default: 0.03
 */
export function calculateAlbertaSolarClub(
  monthlySolarProduction: number[], // 12 values (Jan-Dec) in kWh
  annualUsageKwh: number,
  usageData?: any[], // Optional: hourly usage data
  year: number = new Date().getFullYear(),
  usageDistribution?: UsageDistribution,
  battery?: BatterySpec | null,
  aiMode: boolean = false,
  snowLossFactor: number = 0.03 // Default: 3% winter snow loss
): AlbertaSolarClubResult {
  // Generate hourly solar production pattern
  const hourlySolarProduction = generateHourlyProductionPattern(monthlySolarProduction, year)
  
  // Generate hourly usage pattern
  const hourlyUsage = usageData && usageData.length > 0
    ? usageData
    : generateAnnualUsagePattern(annualUsageKwh, TOU_RATE_PLAN, year, true, usageDistribution)
  
  const hourlyData: HourlyNetMeteringData[] = []
  let totalSolarProduction = 0
  let totalLoad = 0
  let totalExported = 0
  let totalImported = 0
  
  // Season-specific totals
  let highProductionExported = 0
  let highProductionExportCredits = 0
  let highProductionImported = 0
  let highProductionImportCost = 0
  
  let lowProductionExported = 0
  let lowProductionExportCredits = 0
  let lowProductionImported = 0
  let lowProductionImportCost = 0
  
  // Battery state tracking
  const hasBattery = battery != null
  const batteryUsableKwh = battery?.usableKwh || 0
  const batteryEfficiency = battery?.roundTripEfficiency || 0.90
  const batteryInverterKw = battery?.inverterKw || 0
  let batteryStateOfCharge = 0
  let totalBatteryGridCharged = 0
  let totalBatterySolarCharged = 0
  
  // Process each hour
  const maxLength = Math.max(hourlySolarProduction.length, hourlyUsage.length)
  
  for (let i = 0; i < maxLength; i++) {
    const solar = hourlySolarProduction[i] || { timestamp: hourlyUsage[i]?.timestamp || new Date(), kwh: 0 }
    const usage = hourlyUsage[i] || { timestamp: solar.timestamp, kwh: 0, rate: 0, period: 'off-peak' as const }
    
    const timestamp = solar.timestamp
    const month = timestamp.getMonth()
    const isHighProductionMonth = HIGH_PRODUCTION_MONTHS.includes(month)
    
    // Apply snow loss reduction for low production (winter) months
    const isLowProductionMonth = LOW_PRODUCTION_MONTHS.includes(month)
    const snowMultiplier = isLowProductionMonth ? (1 - snowLossFactor) : 1.0
    const solarKwh = solar.kwh * snowMultiplier
    const loadKwh = usage.kwh || 0
    
    // Determine rates based on season
    const exportRate = isHighProductionMonth ? HIGH_PRODUCTION_RATE : LOW_PRODUCTION_RATE
    const importRate = LOW_PRODUCTION_RATE // Always use low rate for imports
    
    // Step 1: Direct solar consumption
    const directSolarUsed = Math.min(solarKwh, loadKwh)
    const remainingSolar = Math.max(0, solarKwh - directSolarUsed)
    const remainingLoad = Math.max(0, loadKwh - directSolarUsed)
    
    // Step 2: Battery operations
    let batteryDischarge = 0
    let batteryChargeFromSolar = 0
    let batteryChargeFromGrid = 0
    
    if (hasBattery) {
      // Priority 1: Charge battery from excess solar
      if (remainingSolar > 0 && batteryStateOfCharge < batteryUsableKwh) {
        const batteryHeadroom = batteryUsableKwh - batteryStateOfCharge
        const maxChargeFromSolar = Math.min(remainingSolar, batteryHeadroom / batteryEfficiency, batteryInverterKw)
        batteryChargeFromSolar = maxChargeFromSolar
        batteryStateOfCharge += batteryChargeFromSolar * batteryEfficiency
        totalBatterySolarCharged += batteryChargeFromSolar
      }
      
      // Priority 2: Discharge battery to meet load
      if (remainingLoad > 0 && batteryStateOfCharge > 0) {
        const maxDischarge = Math.min(remainingLoad, batteryStateOfCharge, batteryInverterKw)
        batteryDischarge = maxDischarge
        batteryStateOfCharge -= batteryDischarge
      }
      
      // For Solar Club, skip grid charging arbitrage to avoid extra imports at the same rate.
      // Battery only charges from solar excess; no import charging.
    }
    
    // Step 3: Calculate final exports and imports
    const finalExported = Math.max(0, remainingSolar - batteryChargeFromSolar)
    const finalImported = Math.max(0, remainingLoad - batteryDischarge) + batteryChargeFromGrid
    
    // Calculate credits and costs
    const exportCredits = (finalExported * exportRate) / 100
    const importCost = (finalImported * importRate) / 100
    
    // Accumulate totals
    totalSolarProduction += solarKwh
    totalLoad += loadKwh
    totalExported += finalExported
    totalImported += finalImported
    
    // Accumulate by season
    if (isHighProductionMonth) {
      highProductionExported += finalExported
      highProductionExportCredits += exportCredits
      highProductionImported += finalImported
      highProductionImportCost += importCost
    } else {
      lowProductionExported += finalExported
      lowProductionExportCredits += exportCredits
      lowProductionImported += finalImported
      lowProductionImportCost += importCost
    }
    
    hourlyData.push({
      timestamp,
      solarProductionKwh: solarKwh,
      loadKwh: loadKwh,
      surplusKwh: finalExported,
      gridDrawKwh: finalImported,
      exportCreditRate: exportRate,
      importRate: importRate,
      period: isHighProductionMonth ? 'on-peak' : 'off-peak' // Use period to indicate season
    })
  }
  
  // Calculate annual totals
  const totalExportCredits = highProductionExportCredits + lowProductionExportCredits
  const totalImportCost = highProductionImportCost + lowProductionImportCost
  const netAnnualBill = totalImportCost - totalExportCredits
  
  // Credit-to-Import Ratio (for technical users - can be >100%)
  const creditToImportRatio = totalImportCost > 0 ? (totalExportCredits / totalImportCost) * 100 : 100
  
  // Net Bill Reduction (homeowner-friendly metric)
  // Calculate pre-solar bill estimate (if not provided, use import cost as baseline)
  // This will be passed from the UI, but we need a fallback
  const billOffsetPercent = creditToImportRatio // Keep for backwards compatibility
  
  // Calculate cash back (3% on imports)
  const cashBackAmount = totalImportCost * CASH_BACK_RATE
  
  // Estimate carbon credits (rough estimate: $50-200 per year depending on system size)
  const estimatedCarbonCredits = Math.max(50, Math.min(200, totalSolarProduction * 0.01))
  
  // Calculate monthly breakdown with rollover
  const monthlyResults = calculateAlbertaMonthlyRollover(hourlyData, year)
  
  // Calculate period summaries (by season instead of time-of-day)
  const byPeriod = [
    {
      period: 'high-production' as any,
      kwhExported: highProductionExported,
      kwhImported: highProductionImported,
      exportCredits: highProductionExportCredits,
      importCost: highProductionImportCost,
    },
    {
      period: 'low-production' as any,
      kwhExported: lowProductionExported,
      kwhImported: lowProductionImported,
      exportCredits: lowProductionExportCredits,
      importCost: lowProductionImportCost,
    },
  ]
  
  return {
    annual: {
      totalSolarProduction,
      totalLoad,
      totalExported,
      totalImported,
      exportCredits: totalExportCredits,
      importCost: totalImportCost,
      netAnnualBill,
      billOffsetPercent,
    },
    monthly: monthlyResults,
    byPeriod,
    hourly: hourlyData,
    warnings: [],
    battery: hasBattery ? {
      totalGridCharged: totalBatteryGridCharged,
      totalSolarCharged: totalBatterySolarCharged,
    } : undefined,
    alberta: {
      highProductionSeason: {
        months: HIGH_PRODUCTION_MONTHS.map(m => m + 1), // Convert to 1-12
        exportedKwh: highProductionExported,
        exportCredits: highProductionExportCredits,
        importedKwh: highProductionImported,
        importCost: highProductionImportCost,
      },
      lowProductionSeason: {
        months: LOW_PRODUCTION_MONTHS.map(m => m + 1), // Convert to 1-12
        exportedKwh: lowProductionExported,
        exportCredits: lowProductionExportCredits,
        importedKwh: lowProductionImported,
        importCost: lowProductionImportCost,
      },
      cashBackAmount,
      estimatedCarbonCredits,
    },
  }
}

/**
 * Calculate monthly rollover for Alberta Solar Club
 */
function calculateAlbertaMonthlyRollover(
  hourlyData: HourlyNetMeteringData[],
  year: number
): MonthlyNetMeteringResult[] {
  const monthlyResults: MonthlyNetMeteringResult[] = []
  const creditQueue: Array<{ monthGenerated: number; credits: number }> = []
  
  for (let currentMonth = 0; currentMonth < 12; currentMonth++) {
    // Filter hourly data for this month
    const monthData = hourlyData.filter(
      d => d.timestamp.getMonth() === currentMonth && d.timestamp.getFullYear() === year
    )
    
    // Calculate monthly totals
    const totalSolarProduction = monthData.reduce((sum, d) => sum + d.solarProductionKwh, 0)
    const totalLoad = monthData.reduce((sum, d) => sum + d.loadKwh, 0)
    const totalExported = monthData.reduce((sum, d) => sum + d.surplusKwh, 0)
    const totalImported = monthData.reduce((sum, d) => sum + d.gridDrawKwh, 0)
    
    // Calculate credits and costs
    const exportCredits = monthData.reduce((sum, d) => sum + (d.surplusKwh * d.exportCreditRate / 100), 0)
    const importCost = monthData.reduce((sum, d) => sum + (d.gridDrawKwh * d.importRate / 100), 0)
    
    // Calculate net position
    const monthlyNetPosition = exportCredits - importCost
    
    // Apply rollover credits (FIFO)
    let netBill = 0
    let remainingToCover = 0
    
    if (monthlyNetPosition < 0) {
      remainingToCover = Math.abs(monthlyNetPosition)
      
      while (remainingToCover > 0 && creditQueue.length > 0) {
        const oldestCredit = creditQueue[0]
        const creditsToApply = Math.min(oldestCredit.credits, remainingToCover)
        
        oldestCredit.credits -= creditsToApply
        remainingToCover -= creditsToApply
        
        if (oldestCredit.credits <= 0.01) {
          creditQueue.shift()
        }
      }
      
      netBill = Math.max(0, remainingToCover)
    } else {
      netBill = 0
    }
    
    // Add surplus to rollover queue
    if (monthlyNetPosition > 0) {
      creditQueue.push({
        monthGenerated: currentMonth,
        credits: monthlyNetPosition,
      })
    }
    
    // Remove expired credits (older than 12 months)
    const currentMonthIndex = currentMonth
    const expiredCredits = creditQueue.filter(
      entry => (currentMonthIndex - entry.monthGenerated + 12) % 12 > 12
    )
    expiredCredits.forEach(() => creditQueue.shift())
    
    const creditRollover = creditQueue.reduce((sum, entry) => sum + entry.credits, 0)
    
    monthlyResults.push({
      month: currentMonth + 1,
      year,
      totalSolarProduction,
      totalLoad,
      totalExported,
      totalImported,
      exportCredits,
      importCost,
      netBill,
      creditRollover,
      creditRolloverAfterCap: creditRollover,
    })
  }
  
  return monthlyResults
}


