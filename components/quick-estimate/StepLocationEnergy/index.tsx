'use client'

// Step 1: Location & Energy (Combined)
// Address input with autocomplete + Energy usage (monthly bill or annual kWh)

import { useState, useRef, useEffect } from 'react'
import { MapPin, Zap, Loader2, DollarSign, Bolt } from 'lucide-react'
import { isValidEmail } from '@/lib/utils'
import type { QuickEstimateData } from '@/app/quick-estimate/page'

interface StepLocationEnergyProps {
  data: QuickEstimateData
  onComplete: (data: Partial<QuickEstimateData>) => void
  onBack?: () => void
}

const BLENDED_RATE = 0.223 // 22.3 cents/kWh blended rate for conversion

export function StepLocationEnergy({ data, onComplete, onBack }: StepLocationEnergyProps) {
  // Location fields
  const [address, setAddress] = useState(data.address || '')
  const [email, setEmail] = useState(data.email || '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Energy fields
  const [energyMethod, setEnergyMethod] = useState<'bill' | 'usage'>(data.energyEntryMethod || 'bill')
  const [monthlyBill, setMonthlyBill] = useState<string>(data.monthlyBill?.toString() || '')
  const [annualUsage, setAnnualUsage] = useState<string>(data.annualUsageKwh?.toString() || '')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string
    coordinates: { lat: number; lng: number }
    city: string
    province: string
  } | null>(data.address && data.coordinates ? {
    address: data.address,
    coordinates: data.coordinates,
    city: data.city || '',
    province: data.province || '',
  } : null)

  const autocompleteRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch address suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setLoadingSuggestions(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&` +
        `country=ca&` +
        `types=address&` +
        `limit=5`
      )
      const data = await response.json()
      setSuggestions(data.features || [])
      setShowSuggestions(true)
    } catch (err) {
      console.error('Autocomplete error:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Handle address change with debounce
  const handleAddressChange = (value: string) => {
    setAddress(value)
    setError('')
    setSelectedLocation(null)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: any) => {
    const [lng, lat] = suggestion.center
    let city = ''
    let province = ''

    if (suggestion.context) {
      for (const item of suggestion.context) {
        if (item.id.startsWith('place.')) city = item.text
        if (item.id.startsWith('region.')) province = item.short_code?.replace('CA-', '') || item.text
      }
    }

    setAddress(suggestion.place_name)
    setSelectedLocation({
      address: suggestion.place_name,
      coordinates: { lat, lng },
      city,
      province,
    })
    setShowSuggestions(false)
  }

  // Calculate derived values
  const getEnergyValues = () => {
    if (energyMethod === 'bill' && monthlyBill) {
      const bill = parseFloat(monthlyBill)
      const annualKwh = (bill / BLENDED_RATE) * 12
      return { monthlyBill: bill, annualUsageKwh: Math.round(annualKwh) }
    } else if (energyMethod === 'usage' && annualUsage) {
      const kwh = parseFloat(annualUsage)
      const bill = (kwh / 12) * BLENDED_RATE
      return { monthlyBill: Math.round(bill), annualUsageKwh: kwh }
    }
    return { monthlyBill: 0, annualUsageKwh: 0 }
  }

  // Validate form
  const isValid = () => {
    if (!email || !isValidEmail(email)) return false
    if (!selectedLocation) return false
    if (energyMethod === 'bill' && (!monthlyBill || parseFloat(monthlyBill) <= 0)) return false
    if (energyMethod === 'usage' && (!annualUsage || parseFloat(annualUsage) <= 0)) return false
    return true
  }

  // Handle continue
  const handleContinue = async () => {
    setError('')

    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!selectedLocation) {
      setError('Please select an address from the suggestions')
      return
    }

    const energyValues = getEnergyValues()
    if (energyValues.annualUsageKwh <= 0) {
      setError('Please enter your energy usage')
      return
    }

    setLoading(true)

    try {
      // Save partial lead
      await fetch('/api/quick-partial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          step: 1,
          data: {
            address: selectedLocation.address,
            coordinates: selectedLocation.coordinates,
            city: selectedLocation.city,
            province: selectedLocation.province,
            ...energyValues,
            energyEntryMethod: energyMethod,
          },
        }),
      })
    } catch (err) {
      console.error('Failed to save partial lead:', err)
    }

    setLoading(false)

    onComplete({
      address: selectedLocation.address,
      coordinates: selectedLocation.coordinates,
      city: selectedLocation.city,
      province: selectedLocation.province,
      email,
      ...energyValues,
      energyEntryMethod: energyMethod,
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
              <MapPin className="text-white" size={28} />
            </div>
            <div className="w-14 h-14 bg-navy-500 rounded-full flex items-center justify-center">
              <Zap className="text-white" size={28} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-navy-500 mb-2">
            Location & Energy
          </h1>
          <p className="text-gray-600">
            Tell us where you are and how much energy you use
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send your estimate to this email
            </p>
          </div>

          {/* Address */}
          <div ref={autocompleteRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Enter your address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {loadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={20} />
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-sm text-gray-700">{suggestion.place_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedLocation && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Address confirmed: {selectedLocation.city}, {selectedLocation.province}
              </p>
            )}
          </div>

          {/* Energy Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-navy-500 mb-4">Energy Usage</h3>

            {/* Toggle between bill and usage */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setEnergyMethod('bill')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  energyMethod === 'bill'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <DollarSign className="inline mr-1" size={16} />
                Monthly Bill
              </button>
              <button
                type="button"
                onClick={() => setEnergyMethod('usage')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  energyMethod === 'usage'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Bolt className="inline mr-1" size={16} />
                Annual kWh
              </button>
            </div>

            {/* Bill input */}
            {energyMethod === 'bill' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Monthly Electricity Bill *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(e.target.value)}
                    placeholder="150"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                {monthlyBill && parseFloat(monthlyBill) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated annual usage: {getEnergyValues().annualUsageKwh.toLocaleString()} kWh
                  </p>
                )}
              </div>
            )}

            {/* Usage input */}
            {energyMethod === 'usage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Electricity Usage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={annualUsage}
                    onChange={(e) => setAnnualUsage(e.target.value)}
                    placeholder="10000"
                    min="0"
                    className="w-full pr-16 py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">kWh</span>
                </div>
                {annualUsage && parseFloat(annualUsage) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated monthly bill: ${getEnergyValues().monthlyBill.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Privacy note */}
          <p className="text-xs text-gray-500 text-center">
            Your information is secure and never shared with third parties
          </p>

          {/* Continue button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading || !isValid()}
            className="btn-primary w-full h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
