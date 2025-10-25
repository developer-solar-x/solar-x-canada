// Data conversion utilities for switching between Easy and Detailed modes

import { EstimatorData } from '@/app/estimator/page'

/**
 * Convert Easy Mode data to Detailed Mode data
 * Preserves user input and provides sensible defaults for detailed fields
 */
export function convertEasyToDetailed(data: EstimatorData): Partial<EstimatorData> {
  const converted: Partial<EstimatorData> = {
    ...data,
    estimatorMode: 'detailed',
  }

  // Convert roof size preset to manual area if no polygon exists
  if (data.roofSizePreset && !data.roofPolygon) {
    // Keep the roofAreaSqft already calculated from preset
    converted.roofEntryMethod = 'manual'
  }

  // Convert simple energy to appliances if no appliances exist
  if (data.energyUsage && !data.appliances && data.energyEntryMethod === 'simple') {
    // Generate estimated appliances based on home size and special appliances
    converted.appliances = generateEstimatedAppliances(
      data.homeSize,
      data.specialAppliances
    )
  }

  return converted
}

/**
 * Convert Detailed Mode data to Easy Mode data
 * Simplifies detailed data for easy mode display
 */
export function convertDetailedToEasy(data: EstimatorData): Partial<EstimatorData> {
  const converted: Partial<EstimatorData> = {
    ...data,
    estimatorMode: 'easy',
  }

  // Keep the detailed data but mark as simple entry for display purposes
  if (data.roofAreaSqft && !data.roofSizePreset) {
    // Categorize the area into a preset
    converted.roofSizePreset = categorizeRoofSize(data.roofAreaSqft)
  }

  // Keep energy usage but mark as simple
  if (data.appliances && data.appliances.length > 0) {
    // Energy usage should already be calculated
    converted.energyEntryMethod = 'simple'
  }

  return converted
}

/**
 * Generate estimated appliances based on home size and special needs
 */
function generateEstimatedAppliances(
  homeSize?: string,
  specialAppliances?: string[]
): any[] {
  const appliances: any[] = []

  // Base appliances for all homes
  appliances.push(
    { name: 'Refrigerator', category: 'essential', watts: 150, hoursPerDay: 24, quantity: 1 },
    { name: 'LED Lights', category: 'essential', watts: 60, hoursPerDay: 6, quantity: 10 },
    { name: 'Wi-Fi Router', category: 'essential', watts: 10, hoursPerDay: 24, quantity: 1 },
  )

  // Adjust based on home size
  switch (homeSize) {
    case '1-2br':
      appliances.push(
        { name: 'TV', category: 'comfort', watts: 100, hoursPerDay: 4, quantity: 1 },
        { name: 'Laptop', category: 'comfort', watts: 50, hoursPerDay: 6, quantity: 1 },
      )
      break
    case '3-4br':
      appliances.push(
        { name: 'TV', category: 'comfort', watts: 100, hoursPerDay: 5, quantity: 2 },
        { name: 'Laptop', category: 'comfort', watts: 50, hoursPerDay: 8, quantity: 2 },
        { name: 'Microwave', category: 'essential', watts: 1200, hoursPerDay: 0.5, quantity: 1 },
        { name: 'Dishwasher', category: 'comfort', watts: 1800, hoursPerDay: 1, quantity: 1 },
      )
      break
    case '5+br':
      appliances.push(
        { name: 'TV', category: 'comfort', watts: 100, hoursPerDay: 6, quantity: 3 },
        { name: 'Laptop', category: 'comfort', watts: 50, hoursPerDay: 10, quantity: 3 },
        { name: 'Microwave', category: 'essential', watts: 1200, hoursPerDay: 1, quantity: 1 },
        { name: 'Dishwasher', category: 'comfort', watts: 1800, hoursPerDay: 1.5, quantity: 1 },
        { name: 'Washing Machine', category: 'essential', watts: 500, hoursPerDay: 1, quantity: 1 },
        { name: 'Dryer', category: 'essential', watts: 3000, hoursPerDay: 1, quantity: 1 },
      )
      break
  }

  // Add special appliances
  if (specialAppliances?.includes('ev')) {
    appliances.push({
      name: 'Electric Vehicle Charger',
      category: 'future',
      watts: 7200,
      hoursPerDay: 2,
      quantity: 1,
    })
  }
  if (specialAppliances?.includes('pool')) {
    appliances.push({
      name: 'Pool Pump',
      category: 'comfort',
      watts: 1500,
      hoursPerDay: 8,
      quantity: 1,
    })
  }
  if (specialAppliances?.includes('ac')) {
    appliances.push({
      name: 'Central A/C',
      category: 'comfort',
      watts: 3500,
      hoursPerDay: 6,
      quantity: 1,
    })
  }

  return appliances
}

/**
 * Categorize roof area into a size preset
 */
function categorizeRoofSize(areaSquareFeet: number): string {
  if (areaSquareFeet < 1000) return 'small'
  if (areaSquareFeet < 2000) return 'medium'
  if (areaSquareFeet < 3000) return 'large'
  return 'xlarge'
}

/**
 * Validate that data has minimum required fields for mode
 */
export function validateModeData(data: EstimatorData, mode: 'easy' | 'detailed'): {
  valid: boolean
  missingFields: string[]
} {
  const missing: string[] = []

  // Common required fields
  if (!data.address) missing.push('address')
  if (!data.coordinates) missing.push('coordinates')

  if (mode === 'easy') {
    // Easy mode minimum requirements
    if (!data.roofAreaSqft) missing.push('roofAreaSqft')
    if (!data.monthlyBill) missing.push('monthlyBill')
  } else {
    // Detailed mode minimum requirements
    if (!data.roofPolygon && !data.roofAreaSqft) missing.push('roofPolygon or roofAreaSqft')
    if (!data.appliances && !data.energyUsage) missing.push('appliances or energyUsage')
  }

  return {
    valid: missing.length === 0,
    missingFields: missing,
  }
}

