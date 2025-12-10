// Battery specifications for peak-shaving calculator
// Prices in CAD, capacity in kWh

// Battery specification interface
export interface BatterySpec {
  id: string
  brand: string
  model: string
  nominalKwh: number // Total battery capacity
  usableKwh: number // Actually usable capacity (after depth of discharge limits)
  usablePercent: number // Percentage of nominal capacity that's usable
  roundTripEfficiency: number // Efficiency as decimal (0.90 = 90%)
  inverterKw: number // Maximum continuous power output in kW
  price: number // Price in CAD before rebates
  warranty: {
    years: number
    cycles: number
  }
  description?: string
}

// Battery rebate calculation constants
export const BATTERY_REBATE_PER_KWH = 300 // $300 per kWh of nominal capacity
export const BATTERY_REBATE_MAX = 5000 // Maximum rebate of $5,000

// Calculate battery rebate
export function calculateBatteryRebate(nominalKwh: number): number {
  const calculatedRebate = nominalKwh * BATTERY_REBATE_PER_KWH
  return Math.min(calculatedRebate, BATTERY_REBATE_MAX)
}

// Calculate net price after rebate
export function calculateNetPrice(price: number, nominalKwh: number): number {
  const rebate = calculateBatteryRebate(nominalKwh)
  return price - rebate
}

// Static battery specifications (fallback if database is unavailable)
const STATIC_BATTERY_SPECS: BatterySpec[] = [
  {
    id: 'renon-16',
    brand: 'Renon',
    model: '16 kWh',
    nominalKwh: 16,
    usableKwh: 14.4, // 90% usable
    usablePercent: 90,
    roundTripEfficiency: 0.90,
    inverterKw: 5.0, // Typical for this size
    price: 8000,
    warranty: {
      years: 10,
      cycles: 6000
    },
    description: 'Compact and affordable solution for basic peak shaving'
  },
  {
    id: 'renon-32',
    brand: 'Renon',
    model: '32 kWh',
    nominalKwh: 32,
    usableKwh: 28.8, // 90% usable
    usablePercent: 90,
    roundTripEfficiency: 0.90,
    inverterKw: 10.0, // Typical for this size
    price: 11000,
    warranty: {
      years: 10,
      cycles: 6000
    },
    description: 'High capacity for maximum peak shaving potential'
  },
  {
    id: 'tesla-powerwall',
    brand: 'Tesla',
    model: 'Powerwall 13.5',
    nominalKwh: 13.5,
    usableKwh: 12.825, // 95% usable
    usablePercent: 95,
    roundTripEfficiency: 0.92,
    inverterKw: 5.0,
    price: 17000,
    warranty: {
      years: 10,
      cycles: 3650
    },
    description: 'Premium battery with industry-leading efficiency'
  },
  {
    id: 'growatt-10',
    brand: 'Growatt',
    model: '10 kWh',
    nominalKwh: 10,
    usableKwh: 9.0, // 90% usable
    usablePercent: 90,
    roundTripEfficiency: 0.90,
    inverterKw: 5.0,
    price: 10000,
    warranty: {
      years: 10,
      cycles: 6000
    },
    description: 'Entry-level battery for small homes'
  },
  {
    id: 'growatt-15',
    brand: 'Growatt',
    model: '15 kWh',
    nominalKwh: 15,
    usableKwh: 13.5, // 90% usable
    usablePercent: 90,
    roundTripEfficiency: 0.90,
    inverterKw: 5.0,
    price: 13000,
    warranty: {
      years: 10,
      cycles: 6000
    },
    description: 'Mid-sized battery for average households'
  },
  {
    id: 'growatt-20',
    brand: 'Growatt',
    model: '20 kWh',
    nominalKwh: 20,
    usableKwh: 18.0, // 90% usable
    usablePercent: 90,
    roundTripEfficiency: 0.90,
    inverterKw: 5.0,
    price: 16000,
    warranty: {
      years: 10,
      cycles: 6000
    },
    description: 'Large capacity for high-usage homes'
  }
]

// Export static specs for backward compatibility
export const BATTERY_SPECS: BatterySpec[] = STATIC_BATTERY_SPECS

// Get battery by ID (checks database first, then falls back to static)
export async function getBatteryById(id: string): Promise<BatterySpec | undefined> {
  try {
    // Try to fetch from database first
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/batteries/${id}`)
      if (response.ok) {
        const result = await response.json()
        return result.battery
      }
    }
  } catch (error) {
    console.warn('Failed to fetch battery from database, using static data:', error)
  }
  
  // Fallback to static data
  return STATIC_BATTERY_SPECS.find(battery => battery.id === id)
}

// Synchronous version for backward compatibility (uses static data only)
export function getBatteryByIdSync(id: string): BatterySpec | undefined {
  return STATIC_BATTERY_SPECS.find(battery => battery.id === id)
}

// Get batteries by brand (checks database first, then falls back to static)
export async function getBatteriesByBrand(brand: string): Promise<BatterySpec[]> {
  try {
    // Try to fetch from database first
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/batteries')
      if (response.ok) {
        const result = await response.json()
        return (result.batteries || []).filter((b: BatterySpec) => b.brand === brand)
      }
    }
  } catch (error) {
    console.warn('Failed to fetch batteries from database, using static data:', error)
  }
  
  // Fallback to static data
  return STATIC_BATTERY_SPECS.filter(battery => battery.brand === brand)
}

// Synchronous version for backward compatibility (uses static data only)
export function getBatteriesByBrandSync(brand: string): BatterySpec[] {
  return STATIC_BATTERY_SPECS.filter(battery => battery.brand === brand)
}

// Calculate battery financial details
export interface BatteryFinancials {
  battery: BatterySpec
  rebate: number
  netPrice: number
  pricePerUsableKwh: number
  netPricePerUsableKwh: number
}

export function calculateBatteryFinancials(battery: BatterySpec): BatteryFinancials {
  const rebate = calculateBatteryRebate(battery.nominalKwh)
  const netPrice = battery.price - rebate
  const pricePerUsableKwh = battery.price / battery.usableKwh
  const netPricePerUsableKwh = netPrice / battery.usableKwh
  
  return {
    battery,
    rebate,
    netPrice,
    pricePerUsableKwh: Math.round(pricePerUsableKwh),
    netPricePerUsableKwh: Math.round(netPricePerUsableKwh)
  }
}

// Get all batteries with financial details (checks database first, then falls back to static)
export async function getAllBatteriesWithFinancials(): Promise<BatteryFinancials[]> {
  let batteries: BatterySpec[] = []
  
  try {
    // Try to fetch from database first
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/batteries')
      if (response.ok) {
        const result = await response.json()
        batteries = result.batteries || []
      }
    }
  } catch (error) {
    console.warn('Failed to fetch batteries from database, using static data:', error)
  }
  
  // Fallback to static data if database fetch failed or returned empty
  if (batteries.length === 0) {
    batteries = STATIC_BATTERY_SPECS
  }
  
  return batteries.map(calculateBatteryFinancials)
}

// Synchronous version for backward compatibility (uses static data only)
export function getAllBatteriesWithFinancialsSync(): BatteryFinancials[] {
  return STATIC_BATTERY_SPECS.map(calculateBatteryFinancials)
}

// Recommend battery based on daily usage patterns
export function recommendBattery(
  dailyOnPeakKwh: number,
  budget?: number
): BatterySpec | undefined {
  // Filter by budget if provided
  let candidates = BATTERY_SPECS
  if (budget) {
    candidates = candidates.filter(battery => {
      const netPrice = calculateNetPrice(battery.price, battery.nominalKwh)
      return netPrice <= budget
    })
  }
  
  // Find battery with usable capacity closest to daily on-peak usage
  // Aim for battery that can cover 80-100% of on-peak usage
  const targetKwh = dailyOnPeakKwh * 0.9
  
  let bestMatch: BatterySpec | undefined
  let smallestDiff = Infinity
  
  for (const battery of candidates) {
    const diff = Math.abs(battery.usableKwh - targetKwh)
    if (diff < smallestDiff) {
      smallestDiff = diff
      bestMatch = battery
    }
  }
  
  return bestMatch
}

// Battery comparison helper
export interface BatteryComparison {
  battery: BatterySpec
  financials: BatteryFinancials
  score: number // Overall value score (0-100)
  strengths: string[]
  considerations: string[]
}

export function compareBatteries(batteries: BatterySpec[]): BatteryComparison[] {
  return batteries.map(battery => {
    const financials = calculateBatteryFinancials(battery)
    
    // Calculate value score
    const efficiencyScore = battery.roundTripEfficiency * 50 // Max 50 points
    const costScore = (1 - (financials.netPricePerUsableKwh / 1500)) * 30 // Max 30 points (assuming $1500/kWh is expensive)
    const capacityScore = Math.min((battery.usableKwh / 30) * 20, 20) // Max 20 points (30 kWh = perfect)
    
    const score = Math.max(0, Math.min(100, efficiencyScore + costScore + capacityScore))
    
    // Determine strengths
    const strengths: string[] = []
    if (battery.roundTripEfficiency >= 0.92) strengths.push('Excellent efficiency')
    if (financials.netPricePerUsableKwh < 600) strengths.push('Great value')
    if (battery.usableKwh >= 20) strengths.push('High capacity')
    if (battery.warranty.years >= 10) strengths.push('Strong warranty')
    
    // Determine considerations
    const considerations: string[] = []
    if (battery.roundTripEfficiency < 0.90) considerations.push('Lower efficiency')
    if (financials.netPricePerUsableKwh > 1000) considerations.push('Premium pricing')
    if (battery.usableKwh < 10) considerations.push('Limited capacity')
    
    return {
      battery,
      financials,
      score: Math.round(score),
      strengths,
      considerations
    }
  })
}

