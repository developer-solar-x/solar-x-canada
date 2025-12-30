import { NextRequest, NextResponse } from 'next/server'

// Helper to get country name from country code
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'CA': 'Canada',
    'US': 'United States',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'GR': 'Greece',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'IL': 'Israel',
    'TR': 'Turkey',
    'RU': 'Russia',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'NZ': 'New Zealand',
  }
  return countryNames[countryCode] || countryCode
}

// Get IP address from request headers
function getClientIP(request: NextRequest): string | null {
  // Try Vercel's IP header first (if deployed on Vercel)
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  if (vercelIP) {
    return vercelIP.split(',')[0].trim()
  }

  // Try standard headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Try Cloudflare header
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  return null
}

// Get country from Vercel headers (if available)
function getCountryFromHeaders(request: NextRequest): string | null {
  // Vercel provides country in headers automatically (primary method)
  const country = request.headers.get('x-vercel-ip-country')
  if (country && country !== 'ZZ') { // ZZ means unknown, ignore it
    return country
  }

  // Also check Vercel's region header (can sometimes help)
  const region = request.headers.get('x-vercel-ip-country-region')
  
  // Cloudflare provides country in headers (fallback if not on Vercel)
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry && cfCountry !== 'XX') { // XX means unknown
    return cfCountry
  }

  return null
}

// GET - Get IP geolocation information
export async function GET(request: NextRequest) {
  try {
    // First, try to get country from Vercel headers (fastest, no API call needed, free)
    const countryFromHeaders = getCountryFromHeaders(request)
    
    if (countryFromHeaders) {
      return NextResponse.json({
        success: true,
        country: countryFromHeaders,
        countryName: getCountryName(countryFromHeaders),
        source: 'vercel',
        isCanada: countryFromHeaders === 'CA',
      })
    }

    // If no country in headers, use IP geolocation API
    const ipAddress = getClientIP(request)
    
    if (!ipAddress) {
      return NextResponse.json(
        { error: 'Could not determine IP address' },
        { status: 400 }
      )
    }

    // Check if it's a localhost/private IP
    const isLocalhost = 
      ipAddress === '127.0.0.1' ||
      ipAddress === '::1' ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.16.') ||
      ipAddress.startsWith('172.17.') ||
      ipAddress.startsWith('172.18.') ||
      ipAddress.startsWith('172.19.') ||
      ipAddress.startsWith('172.20.') ||
      ipAddress.startsWith('172.21.') ||
      ipAddress.startsWith('172.22.') ||
      ipAddress.startsWith('172.23.') ||
      ipAddress.startsWith('172.24.') ||
      ipAddress.startsWith('172.25.') ||
      ipAddress.startsWith('172.26.') ||
      ipAddress.startsWith('172.27.') ||
      ipAddress.startsWith('172.28.') ||
      ipAddress.startsWith('172.29.') ||
      ipAddress.startsWith('172.30.') ||
      ipAddress.startsWith('172.31.')

    // In development (localhost), we can't determine real country from IP
    // So we return null/unknown to ensure address validation still works
    // This prevents bypassing validation by using localhost
    if (isLocalhost) {
      // Return unknown country so validation still checks the address itself
      // Only bypass if explicitly configured for testing
      const skipValidation = process.env.SKIP_IP_VALIDATION === 'true'
      
      if (skipValidation) {
        // Only allow bypass if explicitly configured (for testing)
        return NextResponse.json({
          success: true,
          country: 'CA',
          source: 'localhost',
          isCanada: true,
          isLocalhost: true,
          isDevelopment: true,
        })
      }
      
      // In development, return unknown country so address validation is still enforced
      return NextResponse.json({
        success: true,
        country: null,
        countryName: 'Unknown (Development)',
        source: 'localhost',
        isCanada: false,
        isLocalhost: true,
        isDevelopment: true,
      })
    }

    // Use ipapi.co API (free tier: 1,000 requests/day)
    // Alternative: ip-api.com (free tier: 45 requests/minute)
    const apiKey = process.env.IPAPI_API_KEY || ''
    
    // Option 1: ipapi.co (recommended - simple, reliable)
    const apiUrl = apiKey
      ? `https://ipapi.co/${ipAddress}/json/?key=${apiKey}`
      : `https://ipapi.co/${ipAddress}/json/`

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'SolarCalculatorCanada/1.0',
      },
    })

    if (!response.ok) {
      // Fallback to ip-api.com if ipapi.co fails
      const fallbackUrl = `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode`
      const fallbackResponse = await fetch(fallbackUrl)

      if (!fallbackResponse.ok) {
        throw new Error('IP geolocation API failed')
      }

      const fallbackData = await fallbackResponse.json()
      
      if (fallbackData.status === 'fail') {
        return NextResponse.json(
          { error: 'Could not determine location from IP address' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        country: fallbackData.countryCode || null,
        countryName: fallbackData.country || null,
        source: 'ip-api.com',
        isCanada: fallbackData.countryCode === 'CA',
      })
    }

    const data = await response.json()

    // Handle ipapi.co response
    if (data.error) {
      return NextResponse.json(
        { error: data.reason || 'Could not determine location from IP address' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      country: data.country_code || null,
      countryName: data.country_name || null,
      region: data.region || null,
      city: data.city || null,
      source: 'ipapi.co',
      isCanada: data.country_code === 'CA',
    })
  } catch (error: any) {
    console.error('IP geolocation error:', error)
    return NextResponse.json(
      { error: 'Failed to determine location', details: error.message },
      { status: 500 }
    )
  }
}

