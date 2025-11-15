// Geocoding API endpoint with caching

import { NextResponse } from 'next/server'
import { withCache } from '@/lib/cache'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { address } = body

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!mapboxToken) {
      return NextResponse.json(
        { error: 'Mapbox token not configured' },
        { status: 500 }
      )
    }

    // Use cache to avoid repeated geocoding requests
    const result = await withCache(
      'geocode',
      { address: address.toLowerCase().trim() },
      async () => {
        // Allow worldwide addresses for demo/development (remove &country=CA restriction)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Mapbox API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.features && data.features.length > 0) {
          const place = data.features[0]
          const [lng, lat] = place.center

          // Extract city, province, postal code from context
          let city = ''
          let province = ''
          let postalCode = ''

          // Parse the context array for region and postal code
          if (place.context) {
            for (const item of place.context) {
              if (item.id.startsWith('place.')) {
                city = item.text
              }
              if (item.id.startsWith('region.')) {
                // Extract province code (e.g., "Ontario" -> get short code)
                province = item.short_code?.replace('CA-', '') || item.text
              }
              if (item.id.startsWith('postcode.')) {
                postalCode = item.text
              }
            }
          }

          // If city not found in context, try to extract from place_name
          if (!city && place.place_type.includes('address')) {
            // For addresses, city might be in the place_name
            const parts = place.place_name.split(',').map((p: string) => p.trim())
            if (parts.length >= 2) {
              city = parts[1] // Second part is usually the city
            }
          }

          return {
            address: place.place_name,
            coordinates: { lat, lng },
            city: city || 'Unknown',
            province: province || 'Unknown',
            postalCode: postalCode || '',
            place_type: place.place_type,
            context: place.context,
          }
        }

        return null
      },
      30 * 24 * 60 * 60 * 1000 // Cache geocoding for 30 days
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Geocoding failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

