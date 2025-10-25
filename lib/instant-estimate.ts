// Instant rough estimate calculations for real-time feedback

/**
 * Calculate instant rough estimate based on roof area
 * This provides immediate feedback while user is drawing
 */
export function calculateInstantEstimate(
  areaSquareFeet: number,
  province: string = 'ON'
): {
  systemSizeKw: number
  estimatedCost: number
  annualProduction: number
  annualSavings: number
  monthlySavings: number
  co2Offset: number
  panelCount: number
} {
  // Conservative estimate: 15% of roof area can be used for panels
  const usableArea = areaSquareFeet * 0.15
  
  // Average panel: 17.5 sq ft, 400W
  const panelArea = 17.5
  const panelWatts = 400
  const panelCount = Math.floor(usableArea / panelArea)
  
  // System size in kW
  const systemSizeKw = (panelCount * panelWatts) / 1000
  
  // Average production: 1,250 kWh per kW per year (conservative for Canada)
  const annualProduction = systemSizeKw * 1250
  
  // Average cost: $2,500 per kW installed (2024 pricing)
  const estimatedCost = systemSizeKw * 2500
  
  // Provincial electricity rates (simplified)
  const provinceRates: Record<string, number> = {
    ON: 0.129,
    BC: 0.114,
    AB: 0.165,
    SK: 0.145,
    MB: 0.105,
    QC: 0.085,
    NB: 0.135,
    NS: 0.165,
    PE: 0.155,
    NL: 0.135,
  }
  
  const electricityRate = provinceRates[province] || 0.129
  
  // Annual savings (80% self-consumed, 20% exported at 50% rate)
  const selfConsumedKwh = annualProduction * 0.8
  const exportedKwh = annualProduction * 0.2
  const annualSavings = (selfConsumedKwh * electricityRate) + (exportedKwh * electricityRate * 0.5)
  const monthlySavings = annualSavings / 12
  
  // CO2 offset: 0.7 lbs per kWh (Canadian average)
  const co2Offset = Math.round(annualProduction * 0.7)
  
  return {
    systemSizeKw: Math.round(systemSizeKw * 10) / 10,
    estimatedCost: Math.round(estimatedCost),
    annualProduction: Math.round(annualProduction),
    annualSavings: Math.round(annualSavings),
    monthlySavings: Math.round(monthlySavings),
    co2Offset,
    panelCount,
  }
}

/**
 * Get human-readable estimate summary
 */
export function getEstimateSummary(estimate: ReturnType<typeof calculateInstantEstimate>): string {
  return `~${estimate.systemSizeKw} kW system, ~$${estimate.estimatedCost.toLocaleString()}, Save ~$${estimate.monthlySavings}/mo`
}

/**
 * Check if estimate is viable (minimum system size)
 */
export function isViableSystem(areaSquareFeet: number): boolean {
  const estimate = calculateInstantEstimate(areaSquareFeet)
  // Minimum 3 kW system is typically viable
  return estimate.systemSizeKw >= 3
}

