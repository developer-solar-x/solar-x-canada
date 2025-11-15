// Reverse geocoding API endpoint - convert coordinates to address

import { NextResponse } from 'next/server'
import { withCache } from '@/lib/cache'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lat, lng } = body

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Check coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range' },
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

    // Use cache for reverse geocoding (coordinates are static)
    const result = await withCache(
      'reverse-geocode',
      { 
        lat: Math.round(lat * 10000) / 10000, // Round to 4 decimal places for cache key
        lng: Math.round(lng * 10000) / 10000 
      },
      async () => {
        // Call Mapbox reverse geocoding API (worldwide support for demo/development)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,place`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Mapbox API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.features && data.features.length > 0) {
          // Get the most relevant feature (usually the first one)
          const place = data.features[0]

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
      30 * 24 * 60 * 60 * 1000 // Cache for 30 days
    )

    if (!result) {
      return NextResponse.json(
        { error: 'No address found at these coordinates' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json(
      { error: 'Reverse geocoding failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

