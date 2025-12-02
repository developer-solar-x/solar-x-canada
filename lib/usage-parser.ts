// Usage data parsing and handling
// Supports Green Button CSV, manual entry, and fallback patterns

import { RatePlan, getRateForDateTime, RatePeriod } from '../config/rate-plans'
import type { UsageDataPoint } from './battery-dispatch'
import type { UsageDistribution } from './simple-peak-shaving'

// Re-export for consumers that only need the shape, not the implementation details
export type { UsageDataPoint } from './battery-dispatch'

// Green Button data format
export interface GreenButtonEntry {
  timestamp: Date
  kwh: number
  intervalMinutes: number // Typically 15 or 60
}

// Manual monthly entry
export interface MonthlyUsageEntry {
  month: number // 1-12
  year: number
  totalKwh: number
  // Optional breakdown by period (if user knows their TOU/ULO split)
  onPeakPercent?: number
  midPeakPercent?: number
  offPeakPercent?: number
  ultraLowPercent?: number
}

// Fallback usage pattern for typical Ontario household
export const TYPICAL_USAGE_PATTERNS = {
  // Hourly distribution percentages for a typical day (must sum to 100)
  hourlyDistribution: [
    2.5, // 00:00 - Low overnight usage
    2.0, // 01:00
    1.8, // 02:00
    1.6, // 03:00
    1.5, // 04:00
    1.8, // 05:00
    2.5, // 06:00 - Morning wake up
    4.5, // 07:00 - Morning peak
    5.5, // 08:00
    5.0, // 09:00
    4.5, // 10:00
    4.0, // 11:00
    4.0, // 12:00
    3.8, // 13:00
    3.5, // 14:00
    3.8, // 15:00
    5.0, // 16:00 - Evening ramp up
    6.5, // 17:00 - Evening peak
    7.5, // 18:00 - Peak dinner/cooking
    7.0, // 19:00
    6.0, // 20:00
    5.5, // 21:00
    4.5, // 22:00
    3.5  // 23:00
  ],
  
  // Typical TOU period distribution (percentage of total usage)
  touDistribution: {
    onPeak: 35,
    midPeak: 30,
    offPeak: 35
  },
  
  // Typical ULO period distribution (percentage of total usage)
  uloDistribution: {
    onPeak: 25,
    midPeak: 40,
    offPeak: 20,
    ultraLow: 15
  }
}

// Parse Green Button CSV data
export function parseGreenButtonCSV(csvContent: string): GreenButtonEntry[] {
  const lines = csvContent.split('\n')
  const entries: GreenButtonEntry[] = []
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Expected format: timestamp, kwh, interval_minutes
    const parts = line.split(',')
    if (parts.length < 2) continue
    
    try {
      const timestamp = new Date(parts[0].trim())
      const kwh = parseFloat(parts[1].trim())
      const intervalMinutes = parts[2] ? parseInt(parts[2].trim()) : 60
      
      if (isNaN(kwh) || isNaN(timestamp.getTime())) {
        console.warn(`Skipping invalid line: ${line}`)
        continue
      }
      
      entries.push({
        timestamp,
        kwh,
        intervalMinutes
      })
    } catch (error) {
      console.warn(`Error parsing line: ${line}`, error)
    }
  }
  
  return entries
}

// Convert Green Button data to usage data points with rates
export function greenButtonToUsageData(
  greenButtonData: GreenButtonEntry[],
  ratePlan: RatePlan
): UsageDataPoint[] {
  return greenButtonData.map(entry => {
    const hour = entry.timestamp.getHours()
    const { rate, period } = getRateForDateTime(ratePlan, entry.timestamp, hour)
    
    return {
      timestamp: entry.timestamp,
      kwh: entry.kwh,
      rate,
      period
    }
  })
}

// Generate hourly usage data from monthly totals using typical patterns
export function generateHourlyFromMonthly(
  monthlyData: MonthlyUsageEntry[],
  ratePlan: RatePlan
): UsageDataPoint[] {
  const usageData: UsageDataPoint[] = []
  
  monthlyData.forEach(monthEntry => {
    const daysInMonth = new Date(monthEntry.year, monthEntry.month, 0).getDate()
    const dailyAverage = monthEntry.totalKwh / daysInMonth
    
    // Generate hourly data for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Apply hourly distribution pattern
      TYPICAL_USAGE_PATTERNS.hourlyDistribution.forEach((percent, hour) => {
        const timestamp = new Date(monthEntry.year, monthEntry.month - 1, day, hour, 0, 0)
        const hourlyKwh = (dailyAverage * percent) / 100
        
        const { rate, period } = getRateForDateTime(ratePlan, timestamp, hour)
        
        usageData.push({
          timestamp,
          kwh: hourlyKwh,
          rate,
          period
        })
      })
    }
  })
  
  // Sort by timestamp
  usageData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  return usageData
}

// Generate full year usage data from annual total using typical patterns.
// If a custom TOU/ULO usage distribution is provided, we reshape the typical
// pattern so that the share of kWh in each period matches the requested
// percentages while keeping the annual total fixed.
export function generateAnnualUsagePattern(
  annualKwh: number,
  ratePlan: RatePlan,
  year: number = new Date().getFullYear(),
  useSeasonalAdjustment: boolean = true,
  usageDistribution?: UsageDistribution
): UsageDataPoint[] {
  // Monthly distribution (percentage of annual usage)
  // Higher in winter (heating) and summer (cooling) - Ontario climate
  const monthlyDistribution = useSeasonalAdjustment ? [
    11.0, // January - high (winter heating, cold temps)
    10.0, // February - high (winter heating)
    8.5,  // March - moderate (transitional)
    7.0,  // April - lower (mild spring)
    6.5,  // May - lower (mild spring)
    7.5,  // June - rising (AC starts, longer days)
    9.5,  // July - high (peak summer AC)
    9.5,  // August - high (peak summer AC)
    7.5,  // September - moderate (AC tapers off)
    7.0,  // October - lower (mild fall)
    8.0,  // November - rising (heating starts)
    9.5   // December - high (winter heating, holidays)
  ] : [
    8.33, 8.33, 8.33, 8.33, 8.33, 8.33, // Uniform distribution
    8.33, 8.33, 8.33, 8.33, 8.33, 8.33  // if seasonal adjustment is off
  ]
  
  // Create monthly entries
  const monthlyData: MonthlyUsageEntry[] = monthlyDistribution.map((percent, index) => ({
    month: index + 1,
    year,
    totalKwh: (annualKwh * percent) / 100
  }))
  
  // Generate base hourly data from monthly using the typical pattern.
  const baseUsage = generateHourlyFromMonthly(monthlyData, ratePlan)

  // If no custom distribution supplied, use the base pattern.
  if (!usageDistribution) {
    return baseUsage
  }

  // --- Period-aware re-scaling -------------------------------------------
  // We scale all hours that fall into each TOU/ULO period so that the
  // resulting share of annual kWh for that period matches the requested
  // distribution. This mimics the peak‑shaving calculator behaviour where
  // users control how much of their load sits in on‑peak vs off‑peak hours.

  const totalsByPeriod: Record<RatePeriod, number> = {
    'ultra-low': 0,
    'off-peak': 0,
    'mid-peak': 0,
    'on-peak': 0,
  }

  baseUsage.forEach(d => {
    totalsByPeriod[d.period] += d.kwh
  })

  const totalKwhBase = Object.values(totalsByPeriod).reduce((sum, v) => sum + v, 0) || 1

  // Target shares from the provided distribution (fall back to current share
  // if a bucket is missing so we do not distort the pattern excessively).
  const targetShare = {
    'on-peak': usageDistribution.onPeakPercent ?? 0,
    'mid-peak': usageDistribution.midPeakPercent ?? 0,
    'off-peak': usageDistribution.offPeakPercent ?? 0,
    'ultra-low': usageDistribution.ultraLowPercent ?? 0,
  }

  const totalTargetPercent =
    (targetShare['on-peak'] || 0) +
    (targetShare['mid-peak'] || 0) +
    (targetShare['off-peak'] || 0) +
    (targetShare['ultra-low'] || 0)

  // Normalise to 100% if the user-entered values are slightly off.
  if (totalTargetPercent > 0 && Math.abs(totalTargetPercent - 100) > 0.01) {
    const normalise = 100 / totalTargetPercent
    ;(Object.keys(targetShare) as RatePeriod[]).forEach(p => {
      targetShare[p] = (targetShare[p] || 0) * normalise
    })
  }

  const currentShare: Record<RatePeriod, number> = {
    'ultra-low': (totalsByPeriod['ultra-low'] / totalKwhBase) * 100,
    'off-peak': (totalsByPeriod['off-peak'] / totalKwhBase) * 100,
    'mid-peak': (totalsByPeriod['mid-peak'] / totalKwhBase) * 100,
    'on-peak': (totalsByPeriod['on-peak'] / totalKwhBase) * 100,
  }

  // Compute a per-period scale factor so we move from the current share to
  // the requested share. If a period currently has zero usage, keep scale 1.
  const scaleByPeriod: Record<RatePeriod, number> = {
    'ultra-low':
      totalsByPeriod['ultra-low'] > 0 && targetShare['ultra-low'] != null
        ? (targetShare['ultra-low'] || 0) / Math.max(currentShare['ultra-low'], 0.0001)
        : 1,
    'off-peak':
      totalsByPeriod['off-peak'] > 0 && targetShare['off-peak'] != null
        ? (targetShare['off-peak'] || 0) / Math.max(currentShare['off-peak'], 0.0001)
        : 1,
    'mid-peak':
      totalsByPeriod['mid-peak'] > 0 && targetShare['mid-peak'] != null
        ? (targetShare['mid-peak'] || 0) / Math.max(currentShare['mid-peak'], 0.0001)
        : 1,
    'on-peak':
      totalsByPeriod['on-peak'] > 0 && targetShare['on-peak'] != null
        ? (targetShare['on-peak'] || 0) / Math.max(currentShare['on-peak'], 0.0001)
        : 1,
  }

  const scaled = baseUsage.map(d => ({
    ...d,
    kwh: d.kwh * scaleByPeriod[d.period],
  }))

  const scaledTotal = scaled.reduce((sum, d) => sum + d.kwh, 0) || 1
  const globalScale = annualKwh > 0 ? annualKwh / scaledTotal : 1

  return scaled.map(d => ({
    ...d,
    kwh: d.kwh * globalScale,
  }))
}

// Aggregate hourly data to daily summaries
export function aggregateToDaily(usageData: UsageDataPoint[]): Array<{
  date: string
  totalKwh: number
  totalCost: number
  usageByPeriod: Record<RatePeriod, number>
  costByPeriod: Record<RatePeriod, number>
}> {
  const dailyMap = new Map<string, {
    totalKwh: number
    totalCost: number
    usageByPeriod: Record<RatePeriod, number>
    costByPeriod: Record<RatePeriod, number>
  }>()
  
  usageData.forEach(data => {
    const dateKey = data.timestamp.toISOString().split('T')[0]
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        totalKwh: 0,
        totalCost: 0,
        usageByPeriod: {
          'ultra-low': 0,
          'off-peak': 0,
          'mid-peak': 0,
          'on-peak': 0
        },
        costByPeriod: {
          'ultra-low': 0,
          'off-peak': 0,
          'mid-peak': 0,
          'on-peak': 0
        }
      })
    }
    
    const daily = dailyMap.get(dateKey)!
    const cost = (data.kwh * data.rate) / 100 // Convert cents to dollars
    
    daily.totalKwh += data.kwh
    daily.totalCost += cost
    daily.usageByPeriod[data.period] += data.kwh
    daily.costByPeriod[data.period] += cost
  })
  
  // Convert map to array
  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    ...data
  }))
}

// Aggregate hourly data to monthly summaries
export function aggregateToMonthly(usageData: UsageDataPoint[]): Array<{
  month: number
  year: number
  totalKwh: number
  totalCost: number
  usageByPeriod: Record<RatePeriod, number>
  costByPeriod: Record<RatePeriod, number>
  averageDailyCost: number
}> {
  const monthlyMap = new Map<string, {
    month: number
    year: number
    totalKwh: number
    totalCost: number
    usageByPeriod: Record<RatePeriod, number>
    costByPeriod: Record<RatePeriod, number>
    days: number
  }>()
  
  usageData.forEach(data => {
    const month = data.timestamp.getMonth() + 1
    const year = data.timestamp.getFullYear()
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month,
        year,
        totalKwh: 0,
        totalCost: 0,
        usageByPeriod: {
          'ultra-low': 0,
          'off-peak': 0,
          'mid-peak': 0,
          'on-peak': 0
        },
        costByPeriod: {
          'ultra-low': 0,
          'off-peak': 0,
          'mid-peak': 0,
          'on-peak': 0
        },
        days: new Date(year, month, 0).getDate()
      })
    }
    
    const monthly = monthlyMap.get(monthKey)!
    const cost = (data.kwh * data.rate) / 100
    
    monthly.totalKwh += data.kwh
    monthly.totalCost += cost
    monthly.usageByPeriod[data.period] += data.kwh
    monthly.costByPeriod[data.period] += cost
  })
  
  // Convert map to array and add average daily cost
  return Array.from(monthlyMap.values()).map(data => ({
    ...data,
    averageDailyCost: data.totalCost / data.days
  }))
}

// Validate and clean usage data
export function validateUsageData(usageData: UsageDataPoint[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  cleanedData: UsageDataPoint[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const cleanedData: UsageDataPoint[] = []
  
  // Check if data exists
  if (!usageData || usageData.length === 0) {
    errors.push('No usage data provided')
    return { isValid: false, errors, warnings, cleanedData }
  }
  
  // Check for negative or zero values
  usageData.forEach((data, index) => {
    if (data.kwh < 0) {
      warnings.push(`Negative usage at index ${index}, setting to 0`)
      cleanedData.push({ ...data, kwh: 0 })
    } else if (data.kwh > 100) {
      warnings.push(`Unusually high usage (${data.kwh} kWh) at index ${index}`)
      cleanedData.push(data)
    } else {
      cleanedData.push(data)
    }
  })
  
  // Check for data gaps
  cleanedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  for (let i = 1; i < cleanedData.length; i++) {
    const timeDiff = cleanedData[i].timestamp.getTime() - cleanedData[i - 1].timestamp.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    
    if (hoursDiff > 2) {
      warnings.push(`Data gap detected: ${hoursDiff.toFixed(1)} hours between entries`)
    }
  }
  
  // Check date range
  const firstDate = cleanedData[0].timestamp
  const lastDate = cleanedData[cleanedData.length - 1].timestamp
  const daysCovered = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysCovered < 30) {
    warnings.push(`Limited data: only ${Math.round(daysCovered)} days of usage`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedData
  }
}

// Export usage data to CSV
export function exportUsageDataToCSV(usageData: UsageDataPoint[]): string {
  const header = 'Timestamp,kWh,Rate (¢/kWh),Period\n'
  const rows = usageData.map(data => {
    const timestamp = data.timestamp.toISOString()
    return `${timestamp},${data.kwh},${data.rate},${data.period}`
  })
  
  return header + rows.join('\n')
}

