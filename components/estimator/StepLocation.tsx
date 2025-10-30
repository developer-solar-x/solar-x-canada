'use client'

// Step 1: Address/Location input

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, AlertTriangle } from 'lucide-react'
import { validateServiceArea } from '@/lib/geofencing'

interface StepLocationProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export function StepLocation({ data, onComplete }: StepLocationProps) {
  const [address, setAddress] = useState(data.address || '')
  const [useCoords, setUseCoords] = useState(false)
  const [lat, setLat] = useState<string>(data.coordinates?.lat ? String(data.coordinates.lat) : '')
  const [lng, setLng] = useState<string>(data.coordinates?.lng ? String(data.coordinates.lng) : '')
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [error, setError] = useState('')
  const [serviceAreaWarning, setServiceAreaWarning] = useState<string | null>(null)
  const [pendingData, setPendingData] = useState<any>(null)
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch address suggestions from Mapbox
  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoadingSuggestions(true)

    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      // Limit autocomplete to Ontario, Canada
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${mapboxToken}&country=CA&region=ON&types=address,place&limit=5&autocomplete=true`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        setSuggestions(data.features)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (err) {
      console.error('Autocomplete error:', err)
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Handle address input change with debounce
  const handleAddressChange = (value: string) => {
    setAddress(value)
    setError('')
    setServiceAreaWarning(null)
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value)
    }, 300) // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: any) => {
    setAddress(suggestion.place_name)
    setShowSuggestions(false)
    setSuggestions([])
    
    // Automatically submit the selected address
    const [lng, lat] = suggestion.center
    
    // Extract city, province, postal code from context
    let city = ''
    let province = ''
    let postalCode = ''

    if (suggestion.context) {
      for (const item of suggestion.context) {
        if (item.id.startsWith('place.')) city = item.text
        if (item.id.startsWith('region.')) province = item.short_code?.replace('CA-', '') || item.text
        if (item.id.startsWith('postcode.')) postalCode = item.text
      }
    }

    // If city not found in context, try to extract from place_name
    if (!city && suggestion.place_type.includes('address')) {
      const parts = suggestion.place_name.split(',').map((p: string) => p.trim())
      if (parts.length >= 2) city = parts[1]
    }

    // Validate service area
    const validation = validateServiceArea(
      city,
      province,
      lat,
      lng,
      postalCode,
      true
    )

    if (!validation.isValid) {
      setServiceAreaWarning(validation.suggestedAction || validation.message || 'Outside service area')
      setPendingData({
        address: suggestion.place_name,
        coordinates: { lat, lng },
        city,
        province,
      })
    } else {
      onComplete({
        address: suggestion.place_name,
        coordinates: { lat, lng },
        city,
        province,
      })
    }
  }

  // Handle address submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowSuggestions(false)

    if (!address.trim()) {
      setError('Please enter an address')
      return
    }

    setLoading(true)

    try {
      // Geocode address using Mapbox Geocoding API with caching
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Validate service area (Toronto only)
        const validation = validateServiceArea(
          result.data.city,
          result.data.province,
          result.data.coordinates.lat,
          result.data.coordinates.lng,
          result.data.postalCode,
          true // Strict mode - Toronto only
        )

        if (!validation.isValid) {
          // Outside service area
          setServiceAreaWarning(validation.suggestedAction || validation.message || 'Outside service area')
          setPendingData({
            address: result.data.address,
            coordinates: result.data.coordinates,
            city: result.data.city,
            province: result.data.province,
          })
        } else {
          // Within service area - proceed
          onComplete({
            address: result.data.address,
            coordinates: result.data.coordinates,
            city: result.data.city,
            province: result.data.province,
          })
        }
      } else {
        setError('Address not found. Please try a different address.')
      }
    } catch (err) {
      setError('Failed to geocode address. Please try again.')
      console.error('Geocoding error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle geolocation (Use My Location)
  const handleUseLocation = async () => {
    setError('')
    setLoadingLocation(true)

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoadingLocation(false)
      return
    }

    try {
      // Get user's current position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords

            // Reverse geocode coordinates to get address
            const response = await fetch('/api/reverse-geocode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            })

            if (!response.ok) {
              throw new Error('Reverse geocoding failed')
            }

            const result = await response.json()

            if (result.success && result.data) {
              // Update address field
              setAddress(result.data.address)
              
              // Validate service area
              const validation = validateServiceArea(
                result.data.city,
                result.data.province,
                latitude,
                longitude,
                result.data.postalCode,
                true // Strict mode - Toronto only
              )

              if (!validation.isValid) {
                // Outside service area
                setServiceAreaWarning(validation.suggestedAction || validation.message || 'Outside service area')
                setPendingData({
                  address: result.data.address,
                  coordinates: result.data.coordinates,
                  city: result.data.city,
                  province: result.data.province,
                })
              } else {
                // Within service area - proceed
                onComplete({
                  address: result.data.address,
                  coordinates: result.data.coordinates,
                  city: result.data.city,
                  province: result.data.province,
                })
              }
            } else {
              setError('Could not determine your address. Please enter it manually.')
            }
          } catch (err) {
            setError('Failed to get address from location. Please enter it manually.')
            console.error('Reverse geocoding error:', err)
          } finally {
            setLoadingLocation(false)
          }
        },
        (err) => {
          // Handle geolocation errors
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError('Location access denied. Please enable location permissions.')
              break
            case err.POSITION_UNAVAILABLE:
              setError('Location information unavailable.')
              break
            case err.TIMEOUT:
              setError('Location request timed out. Please try again.')
              break
            default:
              setError('Failed to get your location. Please enter address manually.')
          }
          setLoadingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } catch (err) {
      setError('Failed to access location. Please enter address manually.')
      setLoadingLocation(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Centered card */}
      <div className="card p-8 md:p-12 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <MapPin className="text-white" size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-navy-500 mb-4">
          Find Your Property
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          Enter your address to view your roof on satellite imagery
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Address input with autocomplete */}
          {!useCoords && (
          <div className="text-left relative" ref={autocompleteRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Property Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              placeholder="Start typing your address..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-colors"
              disabled={loading}
              autoComplete="off"
            />
            
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id || index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0 focus:bg-red-50 focus:outline-none"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <div className="text-sm font-medium text-navy-500">
                          {suggestion.place_name}
                        </div>
                        {suggestion.properties?.address && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {suggestion.properties.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Loading indicator for suggestions */}
            {loadingSuggestions && (
              <div className="absolute right-3 top-11 text-gray-400">
                <Loader2 className="animate-spin" size={20} />
              </div>
            )}
            {/* Toggle to coordinates */}
            <div className="mt-3 text-xs text-gray-600">
              Prefer to enter latitude/longitude?{' '}
              <button type="button" onClick={() => { setUseCoords(true); setError(''); }} className="text-red-600 font-semibold hover:underline">
                Use coordinates
              </button>
            </div>
          </div>
          )}

          {/* Manual coordinates input */}
          {useCoords && (
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Coordinates (Decimal Degrees)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Latitude e.g. 43.6532"
                  value={lat}
                  onChange={(e)=>setLat(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  disabled={loading}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Longitude e.g. -79.3832"
                  value={lng}
                  onChange={(e)=>setLng(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  disabled={loading}
                />
              </div>
              <div className="mt-3 text-xs text-gray-600">
                Want to search by street address instead?{' '}
                <button type="button" onClick={() => { setUseCoords(false); setError(''); }} className="text-red-600 font-semibold hover:underline">
                  Use address
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm text-left bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Service area blocked */}
          {serviceAreaWarning && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-left">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-red-900 mb-2">Service Area Restricted</h3>
                  <p className="text-sm text-red-800 mb-3">
                    {serviceAreaWarning}
                  </p>
                  <p className="text-xs text-red-700 mb-3">
                    We currently only provide solar installation services in Ontario. 
                    This ensures we can deliver the highest quality service and support to our customers.
                  </p>
                  <p className="text-xs text-red-600 font-semibold">
                    Please enter an Ontario address to continue with your solar estimate.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setServiceAreaWarning(null)
                  setPendingData(null)
                  setAddress('')
                  setError('')
                }}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Try Ontario Address
              </button>
            </div>
          )}

          {/* Auto-detect location button */}
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={loading || loadingLocation}
            className="btn-outline border-blue-500 text-blue-500 w-full h-12 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50"
          >
            {loadingLocation ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Getting your location...
              </>
            ) : (
              <>
                <MapPin size={20} />
                Use My Location
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Submit button */}
          {!useCoords ? (
            <button
              type="submit"
              disabled={loading || loadingLocation || !address.trim()}
              className="btn-primary w-full h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Finding address...
                </>
              ) : (
                'Continue to Map'
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || loadingLocation || !lat || !lng}
              onClick={async ()=>{
                setError('')
                setLoading(true)
                const parsedLat = Number(lat)
                const parsedLng = Number(lng)
                if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat<-90 || parsedLat>90 || parsedLng<-180 || parsedLng>180){
                  setError('Please enter valid decimal degree coordinates (lat between -90 and 90, lng between -180 and 180).')
                  setLoading(false)
                  return
                }
                try {
                  const resp = await fetch('/api/reverse-geocode', {
                    method: 'POST', headers: { 'Content-Type':'application/json' },
                    body: JSON.stringify({ lat: parsedLat, lng: parsedLng })
                  })
                  if (resp.ok){
                    const result = await resp.json()
                    const dataOut = result.success && result.data ? {
                      address: result.data.address,
                      coordinates: { lat: parsedLat, lng: parsedLng },
                      city: result.data.city,
                      province: result.data.province,
                    } : { coordinates: { lat: parsedLat, lng: parsedLng } }
                    onComplete(dataOut)
                  } else {
                    onComplete({ coordinates: { lat: parsedLat, lng: parsedLng } })
                  }
                } catch (e){
                  onComplete({ coordinates: { lat: parsedLat, lng: parsedLng } })
                } finally {
                  setLoading(false)
                }
              }}
              className="btn-primary w-full h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Validating coordinates...
                </>
              ) : (
                'Use Coordinates'
              )}
            </button>
          )}

          {/* Privacy note */}
          <p className="text-xs text-gray-500 text-center border-t border-gray-200 pt-4 mt-4">
            Your information is secure and never shared
          </p>
        </form>
      </div>
    </div>
  )
}

