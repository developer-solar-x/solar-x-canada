import { useState, useEffect, useRef, useCallback } from 'react'

export function useAddressAutocomplete() {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Fetch address suggestions from Mapbox
  const fetchSuggestions = useCallback(async (input: string) => {
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
  }, [])

  // Handle address input change with debounce
  const handleAddressChange = useCallback((value: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300) // Wait 300ms after user stops typing
  }, [fetchSuggestions])

  return {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    loadingSuggestions,
    autocompleteRef,
    handleAddressChange,
  }
}

