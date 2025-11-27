'use client'

// Step 1: Address/Location input

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { validateServiceArea } from '@/lib/geofencing'
import { isValidEmail } from '@/lib/utils'
import { EmailInput } from './components/EmailInput'
import { AddressInput } from './components/AddressInput'
import { CoordinatesInput } from './components/CoordinatesInput'
import { ServiceAreaWarning } from './components/ServiceAreaWarning'
import { UseLocationButton } from './components/UseLocationButton'
import { useAddressAutocomplete } from './hooks/useAddressAutocomplete'
import { usePartialLeadSave } from './hooks/usePartialLeadSave'
import type { StepLocationProps, LocationData } from './types'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

export function StepLocation({ data, onComplete }: StepLocationProps) {
  const [address, setAddress] = useState(data.address || '')
  const [email, setEmail] = useState(data.email || '')
  const [useCoords, setUseCoords] = useState(false)
  const [lat, setLat] = useState<string>(data.coordinates?.lat ? String(data.coordinates.lat) : '')
  const [lng, setLng] = useState<string>(data.coordinates?.lng ? String(data.coordinates.lng) : '')
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [error, setError] = useState('')
  const [serviceAreaWarning, setServiceAreaWarning] = useState<string | null>(null)
  const [pendingData, setPendingData] = useState<any>(null)

  const {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    loadingSuggestions,
    autocompleteRef,
    handleAddressChange: handleAutocompleteChange,
  } = useAddressAutocomplete()

  const { savingProgress, saveProgressToPartialLead } = usePartialLeadSave(email, data)

  // Handle address input change with debounce
  const handleAddressChange = (value: string) => {
    setAddress(value)
    setError('')
    setServiceAreaWarning(null)
    handleAutocompleteChange(value)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: any) => {
    // Validate email before proceeding
    if (!email || !email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address before selecting an address')
      setShowSuggestions(false)
      return
    }

    setAddress(suggestion.place_name)
    setShowSuggestions(false)
    
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
      // Within service area - proceed
      const locationData: LocationData = {
        address: suggestion.place_name,
        coordinates: { lat, lng },
        city,
        province,
        email: email || undefined,
      }
      onComplete(locationData)
      
      // Save to partial leads if email is provided
      if (email && isValidEmail(email)) {
        saveProgressToPartialLead(locationData)
      }
    }
  }

  // Auto-save when email is entered and address is valid
  useEffect(() => {
    if (email && isValidEmail(email) && address && !loading) {
      const timer = setTimeout(() => {
        if (data.coordinates || (lat && lng)) {
          // Only save if we have valid coordinates
          const locationData: LocationData = {
            address,
            coordinates: data.coordinates || (lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined),
            email,
          }
          saveProgressToPartialLead(locationData)
        }
      }, 1000) // Debounce 1 second
      
      return () => clearTimeout(timer)
    }
  }, [email, address, data.coordinates, lat, lng, loading, saveProgressToPartialLead])

  // Handle address submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowSuggestions(false)

    // Validate email is required
    if (!email || !email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

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
          const locationData: LocationData = {
            address: result.data.address,
            coordinates: result.data.coordinates,
            city: result.data.city,
            province: result.data.province,
            email: email,
          }
          onComplete(locationData)
          
          // Save to partial leads (email is required)
          saveProgressToPartialLead(locationData)
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
    
    // Validate email before proceeding
    if (!email || !email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address before using your location')
      return
    }
    
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
                const locationData: LocationData = {
                  address: result.data.address,
                  coordinates: result.data.coordinates,
                  city: result.data.city,
                  province: result.data.province,
                  email: email,
                }
                onComplete(locationData)
                
                // Save to partial leads (email is required)
                saveProgressToPartialLead(locationData)
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

  // Handle coordinates submission
  const handleCoordinatesSubmit = async () => {
    setError('')
    
    // Validate email before proceeding
    if (!email || !email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setLoading(true)
    const parsedLat = Number(lat)
    const parsedLng = Number(lng)
    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      setError('Please enter valid decimal degree coordinates (lat between -90 and 90, lng between -180 and 180).')
      setLoading(false)
      return
    }
    try {
      const resp = await fetch('/api/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: parsedLat, lng: parsedLng })
      })
      if (resp.ok) {
        const result = await resp.json()
        const dataOut: LocationData = result.success && result.data ? {
          address: result.data.address,
          coordinates: { lat: parsedLat, lng: parsedLng },
          city: result.data.city,
          province: result.data.province,
          email: email,
        } : { 
          coordinates: { lat: parsedLat, lng: parsedLng },
          email: email,
        }
        onComplete(dataOut)
        
        // Save to partial leads (email is required)
        saveProgressToPartialLead(dataOut)
      } else {
        const coordData: LocationData = {
          coordinates: { lat: parsedLat, lng: parsedLng },
          email: email,
        }
        onComplete(coordData)
        
        // Save to partial leads (email is required)
        saveProgressToPartialLead(coordData)
      }
    } catch (e) {
      const coordData: LocationData = {
        coordinates: { lat: parsedLat, lng: parsedLng },
        email: email,
      }
      onComplete(coordData)
      
      // Save to partial leads (email is required)
      saveProgressToPartialLead(coordData)
    } finally {
      setLoading(false)
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
          {/* Email capture (required) */}
          <EmailInput
            email={email}
            onEmailChange={(value) => {
              setEmail(value)
              setError('')
            }}
            error={error}
            disabled={loading}
          />

          {/* Address input with autocomplete */}
          {!useCoords && (
            <>
              <AddressInput
                address={address}
                onAddressChange={handleAddressChange}
                suggestions={suggestions}
                showSuggestions={showSuggestions}
                loadingSuggestions={loadingSuggestions}
                onSelectSuggestion={handleSelectSuggestion}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                disabled={loading}
                autocompleteRef={autocompleteRef}
              />
              {/* Toggle to coordinates */}
              <div className="mt-3 text-xs text-gray-600">
                Prefer to enter latitude/longitude?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setUseCoords(true)
                    setError('')
                  }}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Use coordinates
                </button>
              </div>
            </>
          )}

          {/* Manual coordinates input */}
          {useCoords && (
            <>
              <CoordinatesInput
                lat={lat}
                lng={lng}
                onLatChange={setLat}
                onLngChange={setLng}
                disabled={loading}
              />
              <div className="mt-3 text-xs text-gray-600">
                Want to search by street address instead?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setUseCoords(false)
                    setError('')
                  }}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Use address
                </button>
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm text-left bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Service area blocked */}
          {serviceAreaWarning && (
            <ServiceAreaWarning
              warning={serviceAreaWarning}
              onDismiss={() => {
                setServiceAreaWarning(null)
                setPendingData(null)
                setAddress('')
                setError('')
              }}
            />
          )}

          {/* Auto-detect location button */}
          <UseLocationButton
            onClick={handleUseLocation}
            loading={loadingLocation}
            disabled={loading}
          />

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
              disabled={loading || loadingLocation || !address.trim() || !email.trim() || !isValidEmail(email)}
              className="btn-primary w-full h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Finding address...
                </>
              ) : savingProgress ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving progress...
                </>
              ) : (
                'Continue to Map'
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || loadingLocation || !lat || !lng || !email.trim() || !isValidEmail(email)}
              onClick={handleCoordinatesSubmit}
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

          {/* User data accuracy disclaimer */}
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
            <InfoTooltip
              content="Results rely on the information entered by the user. Incorrect or incomplete details—such as address, email, or service area—will impact the accuracy of the estimates and installer matching."
            />
            <span>User-entered address and email affect estimate accuracy and installer matching.</span>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-gray-500 text-center border-t border-gray-200 pt-4 mt-4">
            Your information is secure and never shared
          </p>
        </form>
      </div>
    </div>
  )
}

