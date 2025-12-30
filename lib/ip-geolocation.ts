// IP Geolocation utilities for country detection

export interface IPGeolocationResult {
  success: boolean
  country?: string
  countryName?: string
  isCanada?: boolean
  source?: string
  error?: string
}

/**
 * Get user's country from IP address
 * This helps prevent users from bypassing location restrictions
 * by using a Canadian address when they're actually in another country
 */
export async function getCountryFromIP(): Promise<IPGeolocationResult> {
  try {
    const response = await fetch('/api/ip-geolocation', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return {
        success: false,
        error: errorData.error || 'Failed to determine country',
      }
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('IP geolocation error:', error)
    return {
      success: false,
      error: error.message || 'Failed to determine country',
    }
  }
}

/**
 * Validate that user's IP country matches their entered address country
 * Returns true if:
 * - IP country is Canada (CA)
 * - IP country cannot be determined (allows access)
 * - IP is localhost (development)
 */
export async function validateIPCountry(
  enteredProvince?: string
): Promise<{
  isValid: boolean
  message?: string
  ipCountry?: string
}> {
  // If no province entered, skip validation
  if (!enteredProvince) {
    return { isValid: true }
  }

  // Check if entered province is Canadian
  const normalizedProvince = enteredProvince.toUpperCase().trim()
  const canadianProvinces = [
    'ON', 'ONTARIO',
    'AB', 'ALBERTA',
    'BC', 'BRITISH COLUMBIA',
    'MB', 'MANITOBA',
    'NB', 'NEW BRUNSWICK',
    'NL', 'NEWFOUNDLAND',
    'NS', 'NOVA SCOTIA',
    'NT', 'NORTHWEST TERRITORIES',
    'NU', 'NUNAVUT',
    'PE', 'PRINCE EDWARD ISLAND',
    'QC', 'QUEBEC',
    'SK', 'SASKATCHEWAN',
    'YT', 'YUKON',
  ]

  const isCanadianProvince = canadianProvinces.includes(normalizedProvince)

  // If not a Canadian province, allow (might be testing or valid use case)
  if (!isCanadianProvince) {
    return { isValid: true }
  }

  // Get IP country
  const ipResult = await getCountryFromIP()

  // If IP geolocation failed, allow access (don't block users due to API issues)
  if (!ipResult.success) {
    console.warn('IP geolocation failed, allowing access:', ipResult.error)
    return { isValid: true }
  }

  // If IP is localhost in development, treat as unknown country
  // This ensures address validation still works (won't bypass by using localhost)
  if (ipResult.source === 'localhost' || ipResult.isLocalhost) {
    // In development, we can't determine real country from localhost IP
    // So we allow access but address validation will still be enforced
    // This prevents bypassing validation by using localhost
    if (process.env.NEXT_PUBLIC_SKIP_IP_VALIDATION === 'true') {
      // Only bypass if explicitly configured (for testing)
      return { isValid: true, ipCountry: ipResult.country }
    }
    
    // In development, allow access but address validation will still check the address
    // This means non-Canadian addresses will still be rejected
    console.log('Development mode: IP country unknown (localhost), address validation will still apply')
    return { 
      isValid: true, 
      ipCountry: null, // Unknown country in development
      isDevelopment: true 
    }
  }

  // Check if IP country is Canada
  if (ipResult.isCanada) {
    return {
      isValid: true,
      ipCountry: ipResult.country,
    }
  }

  // IP country is not Canada but user entered Canadian address
  return {
    isValid: false,
    message: `Your IP address appears to be from ${ipResult.countryName || ipResult.country || 'another country'}, but you entered a Canadian address. Please verify your location.`,
    ipCountry: ipResult.country,
  }
}

