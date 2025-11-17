// Utility functions for LeadDetailView component

/**
 * Safe JSON parse helper
 */
export function parseJson(value: any): any {
  if (typeof value === 'string') {
    try { 
      return JSON.parse(value) 
    } catch { 
      return null 
    }
  }
  return value
}

/**
 * Numeric coercion helper
 */
export function asNumber(value: any): number | null {
  if (typeof value === 'number' && isFinite(value)) return value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return isNaN(n) ? null : n
  }
  return null
}

/**
 * Get status badge color classes
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'new': return 'bg-red-100 text-red-700'
    case 'contacted': return 'bg-yellow-100 text-yellow-700'
    case 'qualified': return 'bg-green-100 text-green-700'
    case 'closed': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

/**
 * Get add-on display name
 */
export function getAddOnName(addOnId: string): string {
  const names: Record<string, string> = {
    'ev_charger': 'EV Charger',
    'heat_pump': 'Heat Pump',
    'new_roof': 'New Roof',
    'water_heater': 'Water Heater',
    'battery': 'Battery Storage'
  }
  return names[addOnId] || addOnId
}

/**
 * Extract combined block from plan data
 */
export function getCombinedBlock(plan: any) {
  if (!plan) return null
  return plan?.allResults?.combined?.combined
    || plan?.allResults?.combined
    || plan?.combined
    || null
}

/**
 * Extract city from address string
 */
export function extractCityFromAddress(address: string | undefined): string {
  if (!address) return ''
  const parts = address.split(',').map(p => p.trim())
  // Expect: [street, city, province postal, country]
  return parts[1] || parts[0] || ''
}

/**
 * Parse coordinates from lead data
 */
export function parseCoordinates(coordinates: any): { lat: number; lng: number } | null {
  if (!coordinates) return null
  const parsed = typeof coordinates === 'string' 
    ? parseJson(coordinates)
    : coordinates
  if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
    return parsed
  }
  return null
}

