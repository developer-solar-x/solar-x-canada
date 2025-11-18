'use client'

import { MapPin, Loader2 } from 'lucide-react'
import type { AddressInputProps } from '../types'

export function AddressInput({
  address,
  onAddressChange,
  suggestions,
  showSuggestions,
  loadingSuggestions,
  onSelectSuggestion,
  onFocus,
  disabled,
  autocompleteRef,
}: AddressInputProps) {
  return (
    <div className="text-left relative" ref={autocompleteRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Property Address
      </label>
      <input
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) onFocus?.()
        }}
        placeholder="Start typing your address..."
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-colors"
        disabled={disabled}
        autoComplete="off"
      />
      
      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id || index}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
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
    </div>
  )
}

