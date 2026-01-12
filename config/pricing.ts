// Tiered pricing structure for solar systems
// Pricing based on system size (kW) with cost per watt

/**
 * Tiered pricing table for solar systems
 * Prices are in $/watt and decrease as system size increases
 */
const PRICING_TIERS = [
  { sizeKw: 4, pricePerWatt: 5.33 },
  { sizeKw: 4.5, pricePerWatt: 4.76 },
  { sizeKw: 5, pricePerWatt: 4.34 },
  { sizeKw: 5.5, pricePerWatt: 4.18 },
  { sizeKw: 6, pricePerWatt: 4.05 },
  { sizeKw: 6.5, pricePerWatt: 3.92 },
  { sizeKw: 7, pricePerWatt: 3.81 },
  { sizeKw: 7.5, pricePerWatt: 3.67 },
  { sizeKw: 8, pricePerWatt: 3.56 },
  { sizeKw: 8.5, pricePerWatt: 3.48 },
  { sizeKw: 9, pricePerWatt: 3.39 },
  { sizeKw: 10, pricePerWatt: 3.31 },
  { sizeKw: 11, pricePerWatt: 3.29 },
  { sizeKw: 12, pricePerWatt: 3.27 },
  { sizeKw: 13, pricePerWatt: 3.27 },
  { sizeKw: 14, pricePerWatt: 3.27 },
  { sizeKw: 15, pricePerWatt: 3.22 },
  { sizeKw: 16, pricePerWatt: 3.22 },
  { sizeKw: 17, pricePerWatt: 3.21 },
  { sizeKw: 18, pricePerWatt: 3.18 },
  { sizeKw: 19, pricePerWatt: 3.15 },
  { sizeKw: 20, pricePerWatt: 3.14 },
  { sizeKw: 21, pricePerWatt: 3.13 },
  { sizeKw: 22, pricePerWatt: 3.12 },
  { sizeKw: 23, pricePerWatt: 3.11 },
  { sizeKw: 24, pricePerWatt: 3.10 },
  { sizeKw: 25, pricePerWatt: 3.09 },
] as const

/**
 * Calculate the price per watt for a given system size
 * Uses tiered pricing with interpolation for sizes between tiers
 */
export function getPricePerWatt(systemSizeKw: number): number {
  // Handle edge cases
  if (systemSizeKw < PRICING_TIERS[0].sizeKw) {
    // Below minimum tier - use first tier price
    return PRICING_TIERS[0].pricePerWatt
  }
  
  if (systemSizeKw >= PRICING_TIERS[PRICING_TIERS.length - 1].sizeKw) {
    // Above maximum tier - use last tier price
    return PRICING_TIERS[PRICING_TIERS.length - 1].pricePerWatt
  }
  
  // Find the two pricing tiers that bracket this system size
  for (let i = 0; i < PRICING_TIERS.length - 1; i++) {
    const lowerTier = PRICING_TIERS[i]
    const upperTier = PRICING_TIERS[i + 1]
    
    if (systemSizeKw >= lowerTier.sizeKw && systemSizeKw <= upperTier.sizeKw) {
      // Check for exact match first
      if (systemSizeKw === lowerTier.sizeKw) {
        return lowerTier.pricePerWatt
      }
      if (systemSizeKw === upperTier.sizeKw) {
        return upperTier.pricePerWatt
      }
      
      // Linear interpolation between tiers for in-between sizes
      const sizeDiff = upperTier.sizeKw - lowerTier.sizeKw
      const priceDiff = upperTier.pricePerWatt - lowerTier.pricePerWatt
      const ratio = (systemSizeKw - lowerTier.sizeKw) / sizeDiff
      
      return lowerTier.pricePerWatt + (priceDiff * ratio)
    }
  }
  
  // Fallback (should not reach here)
  return PRICING_TIERS[PRICING_TIERS.length - 1].pricePerWatt
}

/**
 * Calculate the total system cost based on system size
 * Converts price per watt to total cost for the system
 */
export function calculateSystemCost(systemSizeKw: number): number {
  const pricePerWatt = getPricePerWatt(systemSizeKw)
  // Convert kW to watts, then multiply by price per watt
  const systemCost = systemSizeKw * 1000 * pricePerWatt
  
  return Math.round(systemCost)
}

/**
 * Get the price per kW for a given system size
 * This is a convenience function that returns $/kW instead of $/watt
 */
export function getPricePerKw(systemSizeKw: number): number {
  return getPricePerWatt(systemSizeKw) * 1000
}

/**
 * Get pricing tier information for display
 */
export function getPricingTierInfo(systemSizeKw: number): {
  pricePerWatt: number
  pricePerKw: number
  totalSystemCost: number
} {
  const pricePerWatt = getPricePerWatt(systemSizeKw)
  const pricePerKw = pricePerWatt * 1000
  const totalSystemCost = calculateSystemCost(systemSizeKw)
  
  return {
    pricePerWatt: Math.round(pricePerWatt * 100) / 100,
    pricePerKw: Math.round(pricePerKw),
    totalSystemCost
  }
}

