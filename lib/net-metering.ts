// Net Metering Calculation Module
// Implements Ontario net metering credit calculations with hourly resolution

import { RatePlan, getRateForDateTime, getExportCreditRate, TOU_RATE_PLAN } from '@/config/rate-plans'
import { UsageDataPoint, generateAnnualUsagePattern } from './usage-parser'

// Monthly derate factors for Ontario solar production (from FRD)
// Jan: 35%, Feb: 50%, Mar: 70%, Apr-Aug: 100%, Sept: 80%, Oct: 60%, Nov: 45%, Dec: 25%
const MONTHLY_DERATE_FACTORS = [0.35, 0.50, 0.70, 1.0, 1.0, 1.0, 1.0, 1.0, 0.80, 0.60, 0.45, 0.25]

// Typical hourly solar production distribution (normalized to 1.0)
// Based on Ontario solar irradiance patterns - peak around noon
const HOURLY_PRODUCTION_PATTERN = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  // 0-5 AM: no production
  0.0, 0.05, 0.15, 0.35, 0.55, 0.75,  // 6-11 AM: rising
  0.90, 1.0, 0.95, 0.85, 0.70, 0.50,  // 12-5 PM: peak then declining
  0.25, 0.10, 0.0, 0.0, 0.0, 0.0   // 6-11 PM: declining to zero
]

export interface HourlyNetMeteringData {
  timestamp: Date
  solarProductionKwh: number
  loadKwh: number
  surplusKwh: number // Exported to grid
  gridDrawKwh: number // Imported from grid
  exportCreditRate: number // cents per kWh
  importRate: number // cents per kWh
  period: 'ultra-low' | 'off-peak' | 'mid-peak' | 'on-peak'
}

export interface NetMeteringPeriodSummary {
  period: 'ultra-low' | 'off-peak' | 'mid-peak' | 'on-peak'
  kwhExported: number
  kwhImported: number
  exportCredits: number // dollars
  importCost: number // dollars
}

export interface MonthlyNetMeteringResult {
  month: number // 1-12
  year: number
  totalSolarProduction: number
  totalLoad: number
  totalExported: number
  totalImported: number
  exportCredits: number // dollars
  importCost: number // dollars
  netBill: number // importCost - exportCredits (can be negative = credit)
  creditRollover: number // cumulative credits carried forward
  creditRolloverAfterCap: number // after 12-month cap applied
}

export interface NetMeteringResult {
  annual: {
    totalSolarProduction: number
    totalLoad: number
    totalExported: number
    totalImported: number
    exportCredits: number // dollars
    importCost: number // dollars
    netAnnualBill: number // can be negative = annual credit
    billOffsetPercent: number // % of bill offset by credits
  }
  monthly: MonthlyNetMeteringResult[]
  byPeriod: NetMeteringPeriodSummary[]
  hourly: HourlyNetMeteringData[]
  warnings: string[]
}

/**
 * Generate hourly solar production pattern from monthly totals
 * Uses monthly derate factors and hourly distribution pattern
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
    
    // PVWatts monthly totals already account for seasonal variations
    // Don't apply derate factors - they're already in the PVWatts data
    // Distribute monthly total across days, then hours
    const dailyAverage = monthlyTotal / daysInMonth
    
    // Normalize hourly pattern to sum to 1.0 (for proper distribution)
    const hourlyPatternSum = HOURLY_PRODUCTION_PATTERN.reduce((sum, val) => sum + val, 0)
    
    for (let day = 1; day <= daysInMonth; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(year, monthIndex, day, hour, 0, 0)
        // Distribute daily average across hours using normalized pattern
        // Each hour gets: dailyAverage * (hourlyPattern[hour] / sum of all patterns)
        const hourlyKwh = dailyAverage * (HOURLY_PRODUCTION_PATTERN[hour] / hourlyPatternSum)
        hourlyProduction.push({ timestamp, kwh: hourlyKwh })
      }
    }
  }
  
  return hourlyProduction.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Calculate net metering for 8,760 hours
 * Compares hourly solar production vs load and calculates exports/imports
 */
export function calculateNetMetering(
  monthlySolarProduction: number[], // 12 values (Jan-Dec) in kWh
  annualUsageKwh: number,
  ratePlan: RatePlan,
  usageData?: UsageDataPoint[], // Optional: use provided hourly usage data
  year: number = new Date().getFullYear()
): NetMeteringResult {
  // Generate hourly solar production pattern
  const hourlySolarProduction = generateHourlyProductionPattern(monthlySolarProduction, year)
  
  // Generate or use provided hourly usage data
  let hourlyUsage: UsageDataPoint[]
  if (usageData && usageData.length > 0) {
    hourlyUsage = usageData
  } else {
    hourlyUsage = generateAnnualUsagePattern(annualUsageKwh, ratePlan, year, true)
  }
  
  // Ensure we have exactly 8,760 hours (365 days * 24 hours)
  // Or 8,784 for leap year
  const expectedHours = new Date(year, 2, 0).getDate() === 29 ? 8784 : 8760
  
  if (hourlySolarProduction.length !== expectedHours) {
    console.warn(`Expected ${expectedHours} hours but got ${hourlySolarProduction.length} for solar production`)
  }
  if (hourlyUsage.length !== expectedHours) {
    console.warn(`Expected ${expectedHours} hours but got ${hourlyUsage.length} for usage`)
  }
  
  const warnings: string[] = []
  
  // Calculate net metering for each hour
  const hourlyData: HourlyNetMeteringData[] = []
  let totalSolarProduction = 0
  let totalLoad = 0
  let totalExported = 0
  let totalImported = 0
  
  // Track by period
  const periodSummaries: Record<string, NetMeteringPeriodSummary> = {
    'ultra-low': { period: 'ultra-low', kwhExported: 0, kwhImported: 0, exportCredits: 0, importCost: 0 },
    'off-peak': { period: 'off-peak', kwhExported: 0, kwhImported: 0, exportCredits: 0, importCost: 0 },
    'mid-peak': { period: 'mid-peak', kwhExported: 0, kwhImported: 0, exportCredits: 0, importCost: 0 },
    'on-peak': { period: 'on-peak', kwhExported: 0, kwhImported: 0, exportCredits: 0, importCost: 0 },
  }
  
  // Match up hourly data
  const maxLength = Math.max(hourlySolarProduction.length, hourlyUsage.length)
  
  for (let i = 0; i < maxLength; i++) {
    const solar = hourlySolarProduction[i] || { timestamp: hourlyUsage[i]?.timestamp || new Date(), kwh: 0 }
    const usage = hourlyUsage[i] || { timestamp: solar.timestamp, kwh: 0, rate: 0, period: 'off-peak' as const }
    
    // Ensure timestamps match (use solar timestamp as reference)
    const timestamp = solar.timestamp
    const solarKwh = solar.kwh
    const loadKwh = usage.kwh
    
    // Calculate surplus (export) and grid draw (import)
    const surplusKwh = Math.max(0, solarKwh - loadKwh)
    const gridDrawKwh = Math.max(0, loadKwh - solarKwh)
    
    // Get rates for this hour
    const hour = timestamp.getHours()
    const { rate: exportCreditRate, period } = getExportCreditRate(ratePlan, timestamp, hour)
    const { rate: importRate } = getRateForDateTime(ratePlan, timestamp, hour)
    
    // Calculate credits and costs
    const exportCredits = (surplusKwh * exportCreditRate) / 100 // Convert cents to dollars
    const importCost = (gridDrawKwh * importRate) / 100 // Convert cents to dollars
    
    // Accumulate totals
    totalSolarProduction += solarKwh
    totalLoad += loadKwh
    totalExported += surplusKwh
    totalImported += gridDrawKwh
    
    // Accumulate by period
    const periodSummary = periodSummaries[period]
    periodSummary.kwhExported += surplusKwh
    periodSummary.kwhImported += gridDrawKwh
    periodSummary.exportCredits += exportCredits
    periodSummary.importCost += importCost
    
    hourlyData.push({
      timestamp,
      solarProductionKwh: solarKwh,
      loadKwh: loadKwh,
      surplusKwh,
      gridDrawKwh,
      exportCreditRate,
      importRate,
      period
    })
  }
  
  // Calculate annual totals
  const totalExportCredits = Object.values(periodSummaries).reduce((sum, p) => sum + p.exportCredits, 0)
  const totalImportCost = Object.values(periodSummaries).reduce((sum, p) => sum + p.importCost, 0)
  const netAnnualBill = totalImportCost - totalExportCredits
  
  // Calculate bill offset percentage
  // If net bill is negative (credit), offset is > 100%
  const billOffsetPercent = totalImportCost > 0 
    ? (totalExportCredits / totalImportCost) * 100 
    : 100
  
  
  // Check for under-producing system
  if (totalSolarProduction < totalLoad * 0.6) {
    warnings.push('Your solar system covers less than 60% of your usage. Consider adding battery storage to maximize savings.')
  }
  
  // Calculate monthly breakdown with rollover
  const monthlyResults = calculateMonthlyRollover(hourlyData, ratePlan, year, warnings)
  
  return {
    annual: {
      totalSolarProduction,
      totalLoad,
      totalExported,
      totalImported,
      exportCredits: totalExportCredits,
      importCost: totalImportCost,
      netAnnualBill,
      billOffsetPercent
    },
    monthly: monthlyResults,
    byPeriod: Object.values(periodSummaries),
    hourly: hourlyData,
    warnings
  }
}

/**
 * Calculate monthly bill impact with 12-month credit rollover
 * Tracks when credits were first generated and expires them after 12 months
 */
function calculateMonthlyRollover(
  hourlyData: HourlyNetMeteringData[],
  ratePlan: RatePlan,
  year: number,
  warnings: string[]
): MonthlyNetMeteringResult[] {
  const monthlyResults: MonthlyNetMeteringResult[] = []
  const MAX_ROLLOVER_MONTHS = 12
  
  // Track credit rollover by month generated (FIFO queue)
  // Each entry: { monthGenerated: number, credits: number }
  interface CreditEntry {
    monthGenerated: number // Month index (0-11) when credits were generated
    credits: number // Dollar amount of credits
  }
  const creditQueue: CreditEntry[] = []
  
  // Group hourly data by month
  const monthlyGroups = new Map<number, HourlyNetMeteringData[]>()
  
  hourlyData.forEach(data => {
    const month = data.timestamp.getMonth() // 0-11
    if (!monthlyGroups.has(month)) {
      monthlyGroups.set(month, [])
    }
    monthlyGroups.get(month)!.push(data)
  })
  
  // Process each month
  for (let currentMonth = 0; currentMonth < 12; currentMonth++) {
    const monthData = monthlyGroups.get(currentMonth) || []
    
    // Aggregate monthly totals
    let totalSolarProduction = 0
    let totalLoad = 0
    let totalExported = 0
    let totalImported = 0
    let exportCredits = 0
    let importCost = 0
    
    monthData.forEach(data => {
      totalSolarProduction += data.solarProductionKwh
      totalLoad += data.loadKwh
      totalExported += data.surplusKwh
      totalImported += data.gridDrawKwh
      exportCredits += (data.surplusKwh * data.exportCreditRate) / 100
      importCost += (data.gridDrawKwh * data.importRate) / 100
    })
    
    // Step 1: Expire credits older than 12 months (FIFO - oldest first)
    let expiredCredits = 0
    while (creditQueue.length > 0) {
      const oldest = creditQueue[0]
      // Calculate months difference, accounting for year wrap-around
      let monthsDiff = currentMonth - oldest.monthGenerated
      if (monthsDiff < 0) monthsDiff += 12 // Handle year wrap-around
      
      if (monthsDiff >= MAX_ROLLOVER_MONTHS) {
        // This credit is 12+ months old, expire it
        const expired = creditQueue.shift()!
        expiredCredits += expired.credits
      } else {
        // Oldest credit is still valid, stop checking
        break
      }
    }
    
    // Warn if credits expired
    if (expiredCredits > 0) {
      warnings.push(`$${expiredCredits.toFixed(2)} in credits from more than ${MAX_ROLLOVER_MONTHS} months ago have expired and cannot be carried forward.`)
    }
    
    // Step 2: Calculate net monthly position (before applying rollover)
    const monthlyNetPosition = exportCredits - importCost
    
    // Step 3: Apply rollover credits to monthly bill if needed (FIFO - use oldest credits first)
    let netBill = 0
    let remainingToCover = 0
    
    if (monthlyNetPosition < 0) {
      // We have a bill (import cost > export credits)
      remainingToCover = Math.abs(monthlyNetPosition)
      
      // Apply rollover credits (FIFO - oldest first)
      while (remainingToCover > 0 && creditQueue.length > 0) {
        const oldestCredit = creditQueue[0]
        const creditsToApply = Math.min(oldestCredit.credits, remainingToCover)
        
        oldestCredit.credits -= creditsToApply
        remainingToCover -= creditsToApply
        
        // Remove entry if all credits have been applied
        if (oldestCredit.credits <= 0.01) { // Use small epsilon to avoid floating point issues
          creditQueue.shift()
        }
      }
      
      // Remaining bill after applying rollover credits
      netBill = Math.max(0, remainingToCover)
    } else {
      // Monthly surplus (export credits > import cost)
      netBill = 0 // No bill this month
    }
    
    // Step 4: Add any monthly surplus to rollover queue
    if (monthlyNetPosition > 0) {
      creditQueue.push({
        monthGenerated: currentMonth,
        credits: monthlyNetPosition
      })
    }
    
    // Calculate total rollover after this month (for reporting)
    const creditRollover = creditQueue.reduce((sum, entry) => sum + entry.credits, 0)
    const creditRolloverAfterCap = creditRollover // Already capped via FIFO expiration above
    
    monthlyResults.push({
      month: currentMonth + 1, // 1-12
      year,
      totalSolarProduction,
      totalLoad,
      totalExported,
      totalImported,
      exportCredits,
      importCost,
      netBill,
      creditRollover,
      creditRolloverAfterCap
    })
  }
  
  return monthlyResults
}

/**
 * Calculate net metering for tiered rate plan
 * Uses blended annual rate + 2¢ for exports
 */
export function calculateNetMeteringTiered(
  monthlySolarProduction: number[],
  annualUsageKwh: number,
  tier1Rate: number = 12.0, // cents per kWh
  tier2Rate: number = 14.2, // cents per kWh
  tier1Threshold: number = 1000, // kWh per month
  year: number = new Date().getFullYear()
): NetMeteringResult {
  // Calculate blended annual rate
  // Tier 1: first 1,000 kWh/month * 12 = 12,000 kWh/year
  const tier1AnnualKwh = Math.min(annualUsageKwh, 12000)
  const tier2AnnualKwh = Math.max(0, annualUsageKwh - 12000)
  const blendedRate = annualUsageKwh > 0
    ? ((tier1AnnualKwh * tier1Rate) + (tier2AnnualKwh * tier2Rate)) / annualUsageKwh
    : tier1Rate
  
  // Export credit rate = blended rate + 2¢
  const exportCreditRate = blendedRate + 2.0
  
  // Generate hourly patterns
  const hourlySolarProduction = generateHourlyProductionPattern(monthlySolarProduction, year)
  const hourlyUsage = generateAnnualUsagePattern(annualUsageKwh, TOU_RATE_PLAN, year, true) // Use TOU for time structure
  
  const hourlyData: HourlyNetMeteringData[] = []
  let totalSolarProduction = 0
  let totalLoad = 0
  let totalExported = 0
  let totalImported = 0
  
  // Calculate net metering with tiered rates
  const maxLength = Math.max(hourlySolarProduction.length, hourlyUsage.length)
  let monthlyUsageAccumulator = 0
  let currentMonth = -1
  
  for (let i = 0; i < maxLength; i++) {
    const solar = hourlySolarProduction[i] || { timestamp: hourlyUsage[i]?.timestamp || new Date(), kwh: 0 }
    const usage = hourlyUsage[i] || { timestamp: solar.timestamp, kwh: 0, rate: 0, period: 'off-peak' as const }
    
    const timestamp = solar.timestamp
    const month = timestamp.getMonth()
    
    // Reset monthly accumulator on new month
    if (month !== currentMonth) {
      monthlyUsageAccumulator = 0
      currentMonth = month
    }
    
    const solarKwh = solar.kwh
    const loadKwh = usage.kwh
    monthlyUsageAccumulator += loadKwh
    
    // Determine import rate based on monthly tier
    const importRate = monthlyUsageAccumulator <= tier1Threshold ? tier1Rate : tier2Rate
    
    const surplusKwh = Math.max(0, solarKwh - loadKwh)
    const gridDrawKwh = Math.max(0, loadKwh - solarKwh)
    
    const exportCredits = (surplusKwh * exportCreditRate) / 100
    const importCost = (gridDrawKwh * importRate) / 100
    
    totalSolarProduction += solarKwh
    totalLoad += loadKwh
    totalExported += surplusKwh
    totalImported += gridDrawKwh
    
    hourlyData.push({
      timestamp,
      solarProductionKwh: solarKwh,
      loadKwh: loadKwh,
      surplusKwh,
      gridDrawKwh,
      exportCreditRate,
      importRate,
      period: 'off-peak' // Tiered plan doesn't have time periods
    })
  }
  
  const totalExportCredits = (totalExported * exportCreditRate) / 100
  const totalImportCost = (totalImported * blendedRate) / 100 // Approximate
  const netAnnualBill = totalImportCost - totalExportCredits
  const billOffsetPercent = totalImportCost > 0 ? (totalExportCredits / totalImportCost) * 100 : 100
  
  const warnings: string[] = []
  
  // Monthly breakdown (simplified for tiered)
  const monthlyResults = calculateMonthlyRollover(hourlyData, TOU_RATE_PLAN, year, warnings)
  
  return {
    annual: {
      totalSolarProduction,
      totalLoad,
      totalExported,
      totalImported,
      exportCredits: totalExportCredits,
      importCost: totalImportCost,
      netAnnualBill,
      billOffsetPercent
    },
    monthly: monthlyResults,
    byPeriod: [{
      period: 'off-peak',
      kwhExported: totalExported,
      kwhImported: totalImported,
      exportCredits: totalExportCredits,
      importCost: totalImportCost
    }],
    hourly: hourlyData,
    warnings
  }
}

