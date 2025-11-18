'use client'

import type { RoofSizePresetsProps } from '../types'

export function RoofSizePresets({ presets, selectedSize, onSelectSize }: RoofSizePresetsProps) {
  return (
    <div className="space-y-3 sm:space-y-4 mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
        Select approximate roof size:
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectSize(preset.id)}
            className={`p-4 sm:p-5 border-2 rounded-xl transition-all text-left ${
              selectedSize === preset.id
                ? 'border-red-500 bg-red-50 shadow-[0_2px_10px_rgba(255,59,48,0.08)]'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="font-semibold text-navy-500 text-base sm:text-lg">{preset.label}</div>
            <div className="text-sm text-gray-600">{preset.range}</div>
            <div className="text-xs text-gray-500 mt-1">~{preset.sqft.toLocaleString()} sq ft</div>
          </button>
        ))}
      </div>
    </div>
  )
}

