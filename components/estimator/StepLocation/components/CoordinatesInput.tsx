'use client'

import type { CoordinatesInputProps } from '../types'

export function CoordinatesInput({
  lat,
  lng,
  onLatChange,
  onLngChange,
  disabled,
}: CoordinatesInputProps) {
  return (
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
          onChange={(e) => onLatChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
          disabled={disabled}
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Longitude e.g. -79.3832"
          value={lng}
          onChange={(e) => onLngChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

