// Geofencing utilities for service area validation

/**
 * Service area configuration
 * Define the geographic boundaries where solar services are available
 */
export interface ServiceArea {
  city: string
  province: string
  provinceCode: string
  // Optional: Define specific postal code prefixes for more granular control
  postalCodePrefixes?: string[]
  // Optional: Bounding box coordinates for more precise area validation
  boundingBox?: {
    north: number
    south: number
    east: number
    west: number
  }
}

/**
 * Toronto service area definition
 * Includes Greater Toronto Area (GTA) municipalities
 */
export const TORONTO_SERVICE_AREA: ServiceArea = {
  city: 'Toronto',
  province: 'Ontario',
  provinceCode: 'ON',
  // Toronto postal code prefixes (M)
  postalCodePrefixes: ['M'],
  // Toronto bounding box (approximate Greater Toronto Area)
  boundingBox: {
    north: 43.855,   // North of Richmond Hill
    south: 43.580,   // South of Toronto waterfront
    east: -79.115,   // East of Pickering
    west: -79.640    // West of Mississauga
  }
}

/**
 * Expanded GTA service areas (if you want to include surrounding cities)
 */
export const GTA_SERVICE_AREAS: ServiceArea[] = [
  TORONTO_SERVICE_AREA,
  {
    city: 'Mississauga',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L5'],
  },
  {
    city: 'Brampton',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L6'],
  },
  {
    city: 'Markham',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L3', 'L6'],
  },
  {
    city: 'Vaughan',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L4', 'L6'],
  },
  {
    city: 'Richmond Hill',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L4'],
  },
  {
    city: 'Oakville',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L6'],
  },
  {
    city: 'Pickering',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L1'],
  },
  {
    city: 'Ajax',
    province: 'Ontario',
    provinceCode: 'ON',
    postalCodePrefixes: ['L1'],
  },
]

/**
 * Check if coordinates are within Toronto's bounding box
 */
export function isWithinTorontoBounds(lat: number, lng: number): boolean {
  const { boundingBox } = TORONTO_SERVICE_AREA
  
  if (!boundingBox) return false
  
  return (
    lat <= boundingBox.north &&
    lat >= boundingBox.south &&
    lng <= boundingBox.east &&
    lng >= boundingBox.west
  )
}

/**
 * Check if postal code matches Toronto area
 */
export function isTorontoPostalCode(postalCode: string): boolean {
  if (!postalCode) return false
  
  // Remove spaces and convert to uppercase
  const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase()
  
  // Toronto postal codes start with M
  return cleanPostalCode.startsWith('M')
}

/**
 * Check if location is within any GTA service area
 */
export function isWithinGTAServiceArea(
  city: string | undefined,
  province: string | undefined,
  postalCode?: string
): boolean {
  if (!city || !province) return false
  
  // Normalize inputs
  const normalizedCity = city.toLowerCase().trim()
  const normalizedProvince = province.toUpperCase().trim()
  
  // Check if location matches any service area
  return GTA_SERVICE_AREAS.some(area => {
    // Check province first
    if (normalizedProvince !== area.provinceCode) return false
    
    // Check city name (case-insensitive, partial match)
    if (normalizedCity.includes(area.city.toLowerCase()) || 
        area.city.toLowerCase().includes(normalizedCity)) {
      return true
    }
    
    // Check postal code prefix if provided
    if (postalCode && area.postalCodePrefixes) {
      const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase()
      return area.postalCodePrefixes.some(prefix => 
        cleanPostalCode.startsWith(prefix)
      )
    }
    
    return false
  })
}

/**
 * Check if location is within Ontario (strict)
 * Accepts any city in Ontario province
 */
export function isWithinOntario(
  city: string | undefined,
  province: string | undefined,
  lat?: number,
  lng?: number,
  postalCode?: string
): boolean {
  if (!province) return false
  
  // MUST be Ontario - strict check
  const normalizedProvince = province.toUpperCase().trim()
  if (normalizedProvince !== 'ON' && normalizedProvince !== 'ONTARIO') {
    return false
  }
  
  // Any city in Ontario is accepted
  // Optional: Additional validation with Ontario postal codes if provided
  if (postalCode) {
    const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase()
    // Ontario postal codes: K, L, M, N, P
    const ontarioPostalPrefixes = ['K', 'L', 'M', 'N', 'P']
    const isOntarioPostal = ontarioPostalPrefixes.some(prefix => 
      cleanPostalCode.startsWith(prefix)
    )
    if (!isOntarioPostal) return false
  }
  
  return true
}

/**
 * Main geofencing check function
 * Returns validation result with helpful message
 */
export function validateServiceArea(
  city: string | undefined,
  province: string | undefined,
  lat?: number,
  lng?: number,
  postalCode?: string,
  strictMode: boolean = true
): {
  isValid: boolean
  message?: string
  suggestedAction?: string
} {
  // Check if location is in Ontario
  const isValid = isWithinOntario(city, province, lat, lng, postalCode)
  
  if (isValid) {
    return {
      isValid: true,
      message: `Great! We service ${city}, ${province}.`
    }
  }
  
  // Outside service area
  const locationStr = city && province ? `${city}, ${province}` : 'Your location'
  
  return {
    isValid: false,
    message: `We currently only service Ontario.`,
    suggestedAction: `We're currently serving Ontario only. ${locationStr} is outside our service area.`
  }
}

/**
 * Get distance from Toronto city center (approximate)
 * Useful for showing "X km from service area" messages
 */
export function getDistanceFromToronto(lat: number, lng: number): number {
  // Toronto City Hall coordinates
  const torontoLat = 43.6532
  const torontoLng = -79.3832
  
  // Haversine formula for distance calculation
  const R = 6371 // Earth's radius in km
  const dLat = (lat - torontoLat) * Math.PI / 180
  const dLng = (lng - torontoLng) * Math.PI / 180
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(torontoLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance)
}

