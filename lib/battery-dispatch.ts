// Battery dispatch optimization for peak shaving
// Optimizes charging and discharging to minimize electricity costs

import { BatterySpec } from '../config/battery-specs'
import { RatePlan, getRateForDateTime, RatePeriod } from '../config/rate-plans'

// Hourly usage data point
export interface UsageDataPoint {
  timestamp: Date
  kwh: number
  rate: number
  period: RatePeriod
}

// Battery state at a given time
export interface BatteryState {
  timestamp: Date
  stateOfCharge: number // kWh currently in battery
  charging: boolean
  discharging: boolean
  chargeKw: number // kW charging rate (positive)
  dischargeKw: number // kW discharging rate (positive)
  gridUsageKwh: number // kWh drawn from grid after battery action
}

// Dispatch schedule for a day
export interface DailyDispatch {
  date: Date
  battery: BatterySpec
  ratePlan: RatePlan
  originalUsage: UsageDataPoint[]
  optimizedStates: BatteryState[]
  savings: {
    originalCost: number
    optimizedCost: number
    dailySavings: number
    kwhShifted: number
  }
}

// Annual dispatch analysis
export interface AnnualDispatchAnalysis {
  battery: BatterySpec
  ratePlan: RatePlan
  totalSavings: number
  averageDailySavings: number
  totalKwhShifted: number
  cyclesPerYear: number
  originalAnnualCost: number
  optimizedAnnualCost: number
}

// Helper: Find cheapest consecutive hours for charging
function findCheapestChargingWindow(
  usageData: UsageDataPoint[],
  hoursNeeded: number
): number[] {
  // Create array of hour indices with their rates
  const hourRates = usageData.map((data, index) => ({
    index,
    rate: data.rate,
    hour: data.timestamp.getHours()
  }))
  
  // Sort by rate (cheapest first)
  hourRates.sort((a, b) => a.rate - b.rate)
  
  // Take the cheapest hours
  const cheapestIndices = hourRates.slice(0, hoursNeeded).map(h => h.index)
  
  // Sort by index to maintain time order
  return cheapestIndices.sort((a, b) => a - b)
}

// Helper: Find most expensive consecutive hours for discharging
function findMostExpensiveDischargeWindow(
  usageData: UsageDataPoint[],
  hoursNeeded: number,
  skipWeekends: boolean = false
): number[] {
  // Create array of ALL hour indices with their rates and metadata
  const hourRates = usageData.map((data, index) => ({
    index,
    rate: data.rate,
    hour: data.timestamp.getHours(),
    day: data.timestamp.getDay(),
    usage: data.kwh
  }))
  
  // Filter out weekends if requested (for ULO plan)
  let eligibleHours = hourRates
  if (skipWeekends) {
    eligibleHours = hourRates.filter(h => h.day !== 0 && h.day !== 6) // Not Sunday or Saturday
  }
  
  // Sort by rate (most expensive first)
  eligibleHours.sort((a, b) => b.rate - a.rate)
  
  // Take the most expensive hours
  const expensiveIndices = eligibleHours.slice(0, hoursNeeded).map(h => h.index)
  
  // Sort by index to maintain time order
  return expensiveIndices.sort((a, b) => a - b)
}

// Optimize battery dispatch for a single day
// SIMPLIFIED VERSION based on test file logic
export function optimizeDailyDispatch(
  usageData: UsageDataPoint[],
  battery: BatterySpec,
  ratePlan: RatePlan
): DailyDispatch {
  const date = usageData[0].timestamp
  
  // Calculate original cost without battery
  const originalCost = usageData.reduce((sum, data) => {
    return sum + (data.kwh * data.rate / 100) // Convert cents to dollars
  }, 0)
  
  // Initialize battery states
  const optimizedStates: BatteryState[] = []
  
  // Check if this is a weekday (for ULO, weekends have no on-peak)
  const isWeekday = date.getDay() >= 1 && date.getDay() <= 5 // Monday=1, Friday=5
  const skipWeekends = ratePlan.id === 'ulo'
  
  // Find on-peak hours
  const onPeakHours = usageData.filter(data => {
    if (skipWeekends && !isWeekday) return false
    return data.period === 'on-peak'
  })
  
  const totalOnPeakUsage = onPeakHours.reduce((sum, data) => sum + data.kwh, 0)
  
  // If no on-peak usage, skip battery operation
  if (totalOnPeakUsage === 0 || !isWeekday && skipWeekends) {
    usageData.forEach(data => {
      optimizedStates.push({
        timestamp: data.timestamp,
        stateOfCharge: 0,
        charging: false,
        discharging: false,
        chargeKw: 0,
        dischargeKw: 0,
        gridUsageKwh: data.kwh
      })
    })
    
    return {
      date,
      battery,
      ratePlan,
      originalUsage: usageData,
      optimizedStates,
      savings: {
        originalCost,
        optimizedCost: originalCost,
        dailySavings: 0,
        kwhShifted: 0
      }
    }
  }
  
  // Determine target discharge (limited by battery size and on-peak usage)
  const targetDischargeKwh = Math.min(battery.usableKwh, totalOnPeakUsage)
  const targetChargeKwh = targetDischargeKwh / battery.roundTripEfficiency
  
  // Find cheapest hours for charging (ultra-low for ULO, off-peak for TOU)
  // Look for the cheapest rate period available in this rate plan
  const chargingPeriods = ratePlan.id === 'ulo' ? ['ultra-low'] : ['off-peak']
  const cheapestChargingHours = usageData
    .map((data, index) => ({ data, index }))
    .filter(({ data }) => chargingPeriods.includes(data.period))
    .sort((a, b) => a.data.rate - b.data.rate) // Sort by rate (cheapest first)
  
  // Find on-peak hours for discharging (sort by rate, most expensive first)
  const onPeakIndices = usageData
    .map((data, index) => ({ data, index }))
    .filter(({ data }) => data.period === 'on-peak')
    .sort((a, b) => b.data.rate - a.data.rate) // Sort by rate (most expensive first)
  
  // Two-pass battery simulation to ensure charging happens before discharging
  let batteryCharge = 0 // Start empty
  let totalCharged = 0
  let totalDischarged = 0
  const hourlyStates: Array<{
    charging: boolean
    discharging: boolean
    chargeKw: number
    dischargeKw: number
    batteryCharge: number
    gridUsageKwh: number
  }> = []
  
  // PASS 1: Charge the battery during cheapest hours (ultra-low for ULO, off-peak for TOU)
  usageData.forEach((data, index) => {
    let charging = false
    let chargeKw = 0
    let gridUsageKwh = data.kwh
    
    if (totalCharged < targetChargeKwh && cheapestChargingHours.some(h => h.index === index)) {
      charging = true
      const canCharge = Math.min(
        targetChargeKwh - totalCharged,
        battery.inverterKw,
        battery.usableKwh - batteryCharge
      )
      chargeKw = canCharge
      batteryCharge += canCharge * battery.roundTripEfficiency
      totalCharged += canCharge
      gridUsageKwh += canCharge
    }
    
    hourlyStates.push({
      charging,
      discharging: false,
      chargeKw,
      dischargeKw: 0,
      batteryCharge,
      gridUsageKwh
    })
  })
  
  // PASS 2: Discharge the battery during on-peak hours
  usageData.forEach((data, index) => {
    const state = hourlyStates[index]
    
    // Only discharge if we're not charging this hour AND we have battery charge
    if (!state.charging && batteryCharge > 0 && totalDischarged < targetDischargeKwh && 
        onPeakIndices.some(h => h.index === index)) {
      state.discharging = true
      const canDischarge = Math.min(
        targetDischargeKwh - totalDischarged,
        battery.inverterKw,
        batteryCharge,
        data.kwh // Can't discharge more than usage
      )
      state.dischargeKw = canDischarge
      batteryCharge -= canDischarge
      totalDischarged += canDischarge
      state.gridUsageKwh -= canDischarge
      state.gridUsageKwh = Math.max(0, state.gridUsageKwh)
    }
    
    state.batteryCharge = batteryCharge
  })
  
  // Build final states array
  usageData.forEach((data, index) => {
    const state = hourlyStates[index]
    optimizedStates.push({
      timestamp: data.timestamp,
      stateOfCharge: state.batteryCharge,
      charging: state.charging,
      discharging: state.discharging,
      chargeKw: state.chargeKw,
      dischargeKw: state.dischargeKw,
      gridUsageKwh: state.gridUsageKwh
    })
  })
  
  // Calculate optimized cost
  const optimizedCost = optimizedStates.reduce((sum, state, index) => {
    const rate = usageData[index].rate
    return sum + (state.gridUsageKwh * rate / 100)
  }, 0)
  
  const dailySavings = originalCost - optimizedCost
  const kwhShifted = totalDischarged
  
  return {
    date,
    battery,
    ratePlan,
    originalUsage: usageData,
    optimizedStates,
    savings: {
      originalCost,
      optimizedCost,
      dailySavings,
      kwhShifted
    }
  }
}

// Analyze battery performance over a full year
export function analyzeAnnualDispatch(
  annualUsageData: UsageDataPoint[],
  battery: BatterySpec,
  ratePlan: RatePlan
): AnnualDispatchAnalysis {
  // Group data by day
  const dayMap = new Map<string, UsageDataPoint[]>()
  
  annualUsageData.forEach(data => {
    const dateKey = data.timestamp.toISOString().split('T')[0]
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, [])
    }
    dayMap.get(dateKey)!.push(data)
  })
  
  // Optimize each day
  let totalSavings = 0
  let totalKwhShifted = 0
  let activeDays = 0
  let originalAnnualCost = 0
  let optimizedAnnualCost = 0
  
  dayMap.forEach(dailyData => {
    const dispatch = optimizeDailyDispatch(dailyData, battery, ratePlan)
    totalSavings += dispatch.savings.dailySavings
    totalKwhShifted += dispatch.savings.kwhShifted
    originalAnnualCost += dispatch.savings.originalCost
    optimizedAnnualCost += dispatch.savings.optimizedCost
    
    if (dispatch.savings.kwhShifted > 0) {
      activeDays++
    }
  })
  
  const averageDailySavings = totalSavings / dayMap.size
  const cyclesPerYear = activeDays // One cycle per active day
  
  return {
    battery,
    ratePlan,
    totalSavings,
    averageDailySavings,
    totalKwhShifted,
    cyclesPerYear,
    originalAnnualCost,
    optimizedAnnualCost
  }
}

// Multi-year projection with rate escalation
export interface MultiYearProjection {
  battery: BatterySpec
  ratePlan: RatePlan
  yearlyProjections: Array<{
    year: number
    annualSavings: number
    cumulativeSavings: number
    rateMultiplier: number
  }>
  totalSavings25Year: number
  netCost: number
  paybackYears: number
  netProfit25Year: number
}

export function calculateMultiYearProjection(
  firstYearAnalysis: AnnualDispatchAnalysis,
  batteryPrice: number,
  rebate: number,
  rateEscalation: number = 0.05, // 5% per year
  years: number = 25
): MultiYearProjection {
  const netCost = batteryPrice - rebate
  const yearlyProjections = []
  let cumulativeSavings = 0
  let paybackYears = 0
  let paybackFound = false
  
  for (let year = 1; year <= years; year++) {
    // Calculate rate multiplier for this year
    const rateMultiplier = Math.pow(1 + rateEscalation, year - 1)
    
    // Project savings for this year
    const annualSavings = firstYearAnalysis.totalSavings * rateMultiplier
    cumulativeSavings += annualSavings
    
    // Check for payback
    if (!paybackFound && cumulativeSavings >= netCost) {
      // Interpolate to find exact payback year
      const previousCumulative = cumulativeSavings - annualSavings
      const fractionOfYear = (netCost - previousCumulative) / annualSavings
      paybackYears = year - 1 + fractionOfYear
      paybackFound = true
    }
    
    yearlyProjections.push({
      year,
      annualSavings: Math.round(annualSavings),
      cumulativeSavings: Math.round(cumulativeSavings),
      rateMultiplier: Math.round(rateMultiplier * 100) / 100
    })
  }
  
  const totalSavings25Year = cumulativeSavings
  const netProfit25Year = totalSavings25Year - netCost
  
  return {
    battery: firstYearAnalysis.battery,
    ratePlan: firstYearAnalysis.ratePlan,
    yearlyProjections,
    totalSavings25Year: Math.round(totalSavings25Year),
    netCost: Math.round(netCost),
    paybackYears: Math.round(paybackYears * 10) / 10,
    netProfit25Year: Math.round(netProfit25Year)
  }
}

// Compare multiple batteries side by side
export interface BatteryComparison {
  battery: BatterySpec
  firstYearAnalysis: AnnualDispatchAnalysis
  multiYearProjection: MultiYearProjection
  metrics: {
    savingsPerDollarInvested: number // Total savings / net cost
    paybackYears: number
    annualROI: number // Average annual return on investment
  }
}

export function compareBatteryOptions(
  annualUsageData: UsageDataPoint[],
  batteries: BatterySpec[],
  ratePlan: RatePlan,
  rateEscalation: number = 0.05
): BatteryComparison[] {
  return batteries.map(battery => {
    // Analyze first year
    const firstYearAnalysis = analyzeAnnualDispatch(annualUsageData, battery, ratePlan)
    
    // Calculate rebate
    const rebate = Math.min(battery.nominalKwh * 300, 5000)
    
    // Project 25 years
    const multiYearProjection = calculateMultiYearProjection(
      firstYearAnalysis,
      battery.price,
      rebate,
      rateEscalation,
      25
    )
    
    // Calculate metrics
    const savingsPerDollarInvested = multiYearProjection.totalSavings25Year / multiYearProjection.netCost
    const annualROI = (multiYearProjection.netProfit25Year / multiYearProjection.netCost / 25) * 100
    
    return {
      battery,
      firstYearAnalysis,
      multiYearProjection,
      metrics: {
        savingsPerDollarInvested: Math.round(savingsPerDollarInvested * 100) / 100,
        paybackYears: multiYearProjection.paybackYears,
        annualROI: Math.round(annualROI * 10) / 10
      }
    }
  })
}

