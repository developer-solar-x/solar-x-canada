// Peak Shaving Calculator for Zero-Export Solar Systems
// Optimizes battery usage to minimize costs during Time-of-Use (TOU) periods

/**
 * Ontario Time-of-Use (TOU) Rate Structure
 * Based on Ontario Energy Board rates
 */
export const TOU_RATES = {
  ultraLowOffPeak: {
    name: 'Ultra-Low Off-Peak + Weekend',
    pricePerKwh: 0.039,
    avgUsagePercent: 37, // OEB average
    color: '#16A34A', // Green
  },
  offPeak: {
    name: 'Off-Peak',
    pricePerKwh: 0.098,
    avgUsagePercent: 22,
    color: '#2563EB', // Blue
  },
  midPeak: {
    name: 'Mid-Peak',
    pricePerKwh: 0.157,
    avgUsagePercent: 27,
    color: '#F59E0B', // Orange
  },
  onPeak: {
    name: 'On-Peak',
    pricePerKwh: 0.39,
    avgUsagePercent: 14,
    color: '#DC143C', // Red
  },
} as const

/**
 * Calculate battery capacity (annual usable energy)
 */
export function calculateBatteryCapacity(batteryKwh: number): {
  nominalCapacity: number
  usableCapacity: number
  depthOfDischarge: number
  dailyCapacity: number
  annualCapacity: number
} {
  const depthOfDischarge = 0.9 // 90% DoD for modern lithium batteries
  const usableCapacity = batteryKwh * depthOfDischarge
  const dailyCapacity = usableCapacity
  const annualCapacity = usableCapacity * 365

  return {
    nominalCapacity: batteryKwh,
    usableCapacity,
    depthOfDischarge,
    dailyCapacity,
    annualCapacity,
  }
}

/**
 * Calculate pre-solar consumption breakdown by TOU period
 */
export function calculatePreSolarUsage(annualConsumptionKwh: number): {
  ultraLowOffPeak: number
  offPeak: number
  midPeak: number
  onPeak: number
  total: number
} {
  return {
    ultraLowOffPeak: annualConsumptionKwh * (TOU_RATES.ultraLowOffPeak.avgUsagePercent / 100),
    offPeak: annualConsumptionKwh * (TOU_RATES.offPeak.avgUsagePercent / 100),
    midPeak: annualConsumptionKwh * (TOU_RATES.midPeak.avgUsagePercent / 100),
    onPeak: annualConsumptionKwh * (TOU_RATES.onPeak.avgUsagePercent / 100),
    total: annualConsumptionKwh,
  }
}

/**
 * Calculate pre-solar costs by TOU period
 */
export function calculatePreSolarCosts(usage: ReturnType<typeof calculatePreSolarUsage>): {
  ultraLowOffPeak: number
  offPeak: number
  midPeak: number
  onPeak: number
  total: number
} {
  return {
    ultraLowOffPeak: usage.ultraLowOffPeak * TOU_RATES.ultraLowOffPeak.pricePerKwh,
    offPeak: usage.offPeak * TOU_RATES.offPeak.pricePerKwh,
    midPeak: usage.midPeak * TOU_RATES.midPeak.pricePerKwh,
    onPeak: usage.onPeak * TOU_RATES.onPeak.pricePerKwh,
    total: 
      usage.ultraLowOffPeak * TOU_RATES.ultraLowOffPeak.pricePerKwh +
      usage.offPeak * TOU_RATES.offPeak.pricePerKwh +
      usage.midPeak * TOU_RATES.midPeak.pricePerKwh +
      usage.onPeak * TOU_RATES.onPeak.pricePerKwh,
  }
}

/**
 * Peak Shaving Strategy:
 * 1. Use solar to offset consumption during daytime
 * 2. Charge battery with excess solar
 * 3. Use battery to eliminate high-cost periods (On-Peak, Mid-Peak)
 * 4. Minimize grid usage during expensive periods
 */
export function calculatePeakShaving(
  annualConsumptionKwh: number,
  annualSolarProductionKwh: number,
  batteryKwh: number
): {
  preSolar: ReturnType<typeof calculatePreSolarUsage>
  preSolarCosts: ReturnType<typeof calculatePreSolarCosts>
  postSolar: {
    ultraLowOffPeak: number
    offPeak: number
    midPeak: number
    onPeak: number
    total: number
  }
  postSolarCosts: {
    ultraLowOffPeak: number
    offPeak: number
    midPeak: number
    onPeak: number
    total: number
  }
  solarUsed: number
  batteryUsed: number
  peakShavingEffect: {
    onPeakReduction: number
    midPeakReduction: number
    offPeakReduction: number
  }
  savings: {
    annual: number
    monthly: number
    percentSaved: number
  }
} {
  // Calculate pre-solar usage and costs
  const preSolar = calculatePreSolarUsage(annualConsumptionKwh)
  const preSolarCosts = calculatePreSolarCosts(preSolar)
  
  // Calculate battery capacity
  const battery = calculateBatteryCapacity(batteryKwh)
  
  // Calculate how much solar and battery can offset
  const totalEnergyAvailable = annualSolarProductionKwh + battery.annualCapacity
  
  // Peak Shaving Strategy Priority (eliminate highest cost first):
  // 1. On-Peak ($0.39/kWh) - highest priority
  // 2. Mid-Peak ($0.157/kWh)
  // 3. Off-Peak ($0.098/kWh)
  // 4. Ultra-Low Off-Peak ($0.039/kWh) - lowest priority
  
  let remainingEnergy = totalEnergyAvailable
  let solarAndBatteryUsed = 0
  
  // Start with highest cost period
  const onPeakOffset = Math.min(preSolar.onPeak, remainingEnergy)
  remainingEnergy -= onPeakOffset
  solarAndBatteryUsed += onPeakOffset
  
  const midPeakOffset = Math.min(preSolar.midPeak, remainingEnergy)
  remainingEnergy -= midPeakOffset
  solarAndBatteryUsed += midPeakOffset
  
  const offPeakOffset = Math.min(preSolar.offPeak, remainingEnergy)
  remainingEnergy -= offPeakOffset
  solarAndBatteryUsed += offPeakOffset
  
  const ultraLowOffPeakOffset = Math.min(preSolar.ultraLowOffPeak, remainingEnergy)
  solarAndBatteryUsed += ultraLowOffPeakOffset
  
  // Calculate post-solar grid usage
  const postSolar = {
    onPeak: Math.max(0, preSolar.onPeak - onPeakOffset),
    midPeak: Math.max(0, preSolar.midPeak - midPeakOffset),
    offPeak: Math.max(0, preSolar.offPeak - offPeakOffset),
    ultraLowOffPeak: Math.max(0, preSolar.ultraLowOffPeak - ultraLowOffPeakOffset),
    total: 0,
  }
  postSolar.total = postSolar.onPeak + postSolar.midPeak + postSolar.offPeak + postSolar.ultraLowOffPeak
  
  // Calculate post-solar costs
  const postSolarCosts = {
    onPeak: postSolar.onPeak * TOU_RATES.onPeak.pricePerKwh,
    midPeak: postSolar.midPeak * TOU_RATES.midPeak.pricePerKwh,
    offPeak: postSolar.offPeak * TOU_RATES.offPeak.pricePerKwh,
    ultraLowOffPeak: postSolar.ultraLowOffPeak * TOU_RATES.ultraLowOffPeak.pricePerKwh,
    total: 0,
  }
  postSolarCosts.total = 
    postSolarCosts.onPeak + 
    postSolarCosts.midPeak + 
    postSolarCosts.offPeak + 
    postSolarCosts.ultraLowOffPeak
  
  // Calculate savings
  const annualSavings = preSolarCosts.total - postSolarCosts.total
  const monthlySavings = annualSavings / 12
  const percentSaved = (annualSavings / preSolarCosts.total) * 100
  
  // Calculate battery usage (energy that came from battery vs direct solar)
  const directSolarUsed = Math.min(annualSolarProductionKwh, solarAndBatteryUsed)
  const batteryUsed = solarAndBatteryUsed - directSolarUsed
  
  return {
    preSolar,
    preSolarCosts,
    postSolar,
    postSolarCosts,
    solarUsed: directSolarUsed,
    batteryUsed,
    peakShavingEffect: {
      onPeakReduction: ((preSolar.onPeak - postSolar.onPeak) / preSolar.onPeak) * 100,
      midPeakReduction: ((preSolar.midPeak - postSolar.midPeak) / preSolar.midPeak) * 100,
      offPeakReduction: ((preSolar.offPeak - postSolar.offPeak) / preSolar.offPeak) * 100,
    },
    savings: {
      annual: annualSavings,
      monthly: monthlySavings,
      percentSaved,
    },
  }
}

/**
 * Calculate incentives for zero-export systems
 */
export function calculateZeroExportIncentives(
  systemSizeKw: number,
  batteryKwh: number
): {
  solarIncentive: number
  batteryIncentive: number
  totalIncentive: number
  details: {
    solarRatePerKw: number
    solarMaxIncentive: number
    solarCalculated: number
    batteryRatePerKwh: number
    batteryMaxIncentive: number
    batteryCalculated: number
  }
} {
  // Solar incentive: $500 per kW, max $5,000 - applies to all systems
  const solarRatePerKw = 500
  const solarMaxIncentive = 5000
  const solarCalculated = systemSizeKw * solarRatePerKw
  const solarIncentive = Math.min(solarCalculated, solarMaxIncentive)
  
  // Battery incentive: $300 per kWh, max $5,000 - only applies if battery is included
  const batteryRatePerKwh = 300
  const batteryMaxIncentive = 5000
  const batteryCalculated = batteryKwh * batteryRatePerKwh
  const batteryIncentive = Math.min(batteryCalculated, batteryMaxIncentive)
  
  return {
    solarIncentive,
    batteryIncentive,
    totalIncentive: solarIncentive + batteryIncentive,
    details: {
      solarRatePerKw,
      solarMaxIncentive,
      solarCalculated,
      batteryRatePerKwh,
      batteryMaxIncentive,
      batteryCalculated,
    },
  }
}

/**
 * Comprehensive zero-export system analysis
 */
export function analyzeZeroExportSystem(
  annualConsumptionKwh: number,
  systemSizeKw: number,
  annualSolarProductionKwh: number,
  batteryKwh: number,
  systemCost: number
): {
  peakShaving: ReturnType<typeof calculatePeakShaving>
  incentives: ReturnType<typeof calculateZeroExportIncentives>
  economics: {
    systemCost: number
    incentives: number
    netCost: number
    annualSavings: number
    paybackYears: number
    roi25Year: number
    lifetimeSavings: number
  }
  batteryInfo: ReturnType<typeof calculateBatteryCapacity>
} {
  const peakShaving = calculatePeakShaving(
    annualConsumptionKwh,
    annualSolarProductionKwh,
    batteryKwh
  )
  
  const incentives = calculateZeroExportIncentives(systemSizeKw, batteryKwh)
  
  const netCost = systemCost - incentives.totalIncentive
  const annualSavings = peakShaving.savings.annual
  const paybackYears = netCost / annualSavings
  const lifetimeSavings = (annualSavings * 25) - netCost
  const roi25Year = (lifetimeSavings / netCost) * 100
  
  const batteryInfo = calculateBatteryCapacity(batteryKwh)
  
  return {
    peakShaving,
    incentives,
    economics: {
      systemCost,
      incentives: incentives.totalIncentive,
      netCost,
      annualSavings,
      paybackYears: Math.round(paybackYears * 10) / 10,
      roi25Year: Math.round(roi25Year),
      lifetimeSavings: Math.round(lifetimeSavings),
    },
    batteryInfo,
  }
}

/**
 * Recommend optimal battery size based on consumption and solar production
 */
export function recommendBatterySize(
  annualConsumptionKwh: number,
  systemSizeKw: number
): {
  recommendedKwh: number
  reasoning: string
  dailyConsumption: number
  estimatedDailyProduction: number
} {
  const dailyConsumption = annualConsumptionKwh / 365
  const estimatedDailyProduction = (systemSizeKw * 1250) / 365 // Conservative estimate
  
  // Target: Store 50-70% of daily consumption to cover evening peak
  const targetBattery = dailyConsumption * 0.6
  
  // Round to nearest common battery size (10, 13.5, 16, 20 kWh)
  const commonSizes = [10, 13.5, 16, 20, 25, 30]
  const recommendedKwh = commonSizes.reduce((prev, curr) => 
    Math.abs(curr - targetBattery) < Math.abs(prev - targetBattery) ? curr : prev
  )
  
  return {
    recommendedKwh,
    reasoning: `Based on daily consumption of ${Math.round(dailyConsumption)} kWh, a ${recommendedKwh} kWh battery can store enough energy to cover evening peak periods and maximize savings.`,
    dailyConsumption,
    estimatedDailyProduction,
  }
}

