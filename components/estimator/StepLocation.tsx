'use client'

// Step 1: Address/Location input

import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface StepLocationProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export function StepLocation({ data, onComplete }: StepLocationProps) {
  const [address, setAddress] = useState(data.address || '')
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [error, setError] = useState('')

  // Handle address submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
        // Pass data to next step
        onComplete({
          address: result.data.address,
          coordinates: result.data.coordinates,
        })
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
              
              // Automatically proceed to next step
              onComplete({
                address: result.data.address,
                coordinates: result.data.coordinates,
              })
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
          {/* Address input */}
          <div className="text-left">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Property Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, Toronto, ON"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm text-left bg-red-50 p-3 rounded-lg">
              {error}
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

          {/* Privacy note */}
          <p className="text-xs text-gray-500 text-center border-t border-gray-200 pt-4 mt-4">
            Your information is secure and never shared
          </p>
        </form>
      </div>
    </div>
  )
}

