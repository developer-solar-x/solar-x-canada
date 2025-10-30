// Calculate month-by-month savings breakdown from usage data and battery dispatch
// This provides variable monthly savings that reflect seasonal usage patterns

import { UsageDataPoint, analyzeAnnualDispatch, optimizeDailyDispatch } from './battery-dispatch'
import { BatterySpec } from '../config/battery-specs'
import { RatePlan } from '../config/rate-plans'

// Monthly savings summary
export interface MonthlySavings {
  month: number // 1-12
  monthName: string
  year: number
  originalCost: number // Cost without battery
  optimizedCost: number // Cost with battery
  savings: number // Monthly savings
  kwhShifted: number // Energy shifted this month
  activeDays: number // Days battery operated
}

// Calculate monthly savings breakdown
export function calculateMonthlySavings(
  usageData: UsageDataPoint[],
  battery: BatterySpec,
  ratePlan: RatePlan
): MonthlySavings[] {
  // Group usage data by month
  const monthlyMap = new Map<string, UsageDataPoint[]>()
  
  usageData.forEach(data => {
    const month = data.timestamp.getMonth() + 1
    const year = data.timestamp.getFullYear()
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, [])
    }
    monthlyMap.get(monthKey)!.push(data)
  })
  
  // Calculate savings for each month
  const monthlySavings: MonthlySavings[] = []
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  monthlyMap.forEach((monthData, monthKey) => {
    const [yearStr, monthStr] = monthKey.split('-')
    const year = parseInt(yearStr)
    const month = parseInt(monthStr)
    
    // Group by day within this month
    const dayMap = new Map<string, UsageDataPoint[]>()
    
    monthData.forEach(data => {
      const dateKey = data.timestamp.toISOString().split('T')[0]
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, [])
      }
      dayMap.get(dateKey)!.push(data)
    })
    
    // Calculate daily dispatch for each day in the month
    let monthOriginalCost = 0
    let monthOptimizedCost = 0
    let monthKwhShifted = 0
    let activeDays = 0
    
    dayMap.forEach(dailyData => {
      // Sort by timestamp
      dailyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      // Run daily dispatch optimization
      const dispatch = optimizeDailyDispatch(dailyData, battery, ratePlan)
      
      monthOriginalCost += dispatch.savings.originalCost
      monthOptimizedCost += dispatch.savings.optimizedCost
      monthKwhShifted += dispatch.savings.kwhShifted
      
      if (dispatch.savings.kwhShifted > 0) {
        activeDays++
      }
    })
    
    const monthSavings = monthOriginalCost - monthOptimizedCost
    
    monthlySavings.push({
      month,
      monthName: monthNames[month - 1],
      year,
      originalCost: monthOriginalCost,
      optimizedCost: monthOptimizedCost,
      savings: monthSavings,
      kwhShifted: monthKwhShifted,
      activeDays
    })
  })
  
  // Sort by month
  monthlySavings.sort((a, b) => a.month - b.month)
  
  return monthlySavings
}

// Calculate summary statistics from monthly savings
export function calculateMonthlySavingsStats(monthlySavings: MonthlySavings[]) {
  const totalSavings = monthlySavings.reduce((sum, m) => sum + m.savings, 0)
  const averageMonthlySavings = totalSavings / monthlySavings.length
  
  const savingsValues = monthlySavings.map(m => m.savings)
  const maxMonthlySavings = Math.max(...savingsValues)
  const minMonthlySavings = Math.min(...savingsValues)
  
  const maxMonth = monthlySavings.find(m => m.savings === maxMonthlySavings)
  const minMonth = monthlySavings.find(m => m.savings === minMonthlySavings)
  
  return {
    totalAnnualSavings: totalSavings,
    averageMonthlySavings,
    maxMonthlySavings,
    minMonthlySavings,
    maxMonth: maxMonth?.monthName || '',
    minMonth: minMonth?.monthName || '',
    savingsRange: maxMonthlySavings - minMonthlySavings,
    variationPercent: ((maxMonthlySavings - minMonthlySavings) / averageMonthlySavings) * 100
  }
}

