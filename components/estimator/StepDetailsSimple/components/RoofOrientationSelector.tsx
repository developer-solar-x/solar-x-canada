'use client'

import { ROOF_ORIENTATIONS } from '@/lib/roof-calculations'
import type { RoofOrientationSelectorProps } from '../types'

export function RoofOrientationSelector({ roofOrientation, onRoofOrientationChange }: RoofOrientationSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Which direction does your roof face?
      </label>
      <p className="text-xs text-gray-600 mb-3">
        This affects how much solar energy your panels can capture
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROOF_ORIENTATIONS.slice(0, 4).map((orientation) => (
          <button
            key={orientation.value}
            onClick={() => onRoofOrientationChange(orientation.azimuth)}
            className={`p-3 border-2 rounded-lg transition-all text-center ${
              roofOrientation === orientation.azimuth
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="text-2xl mb-1">{orientation.icon}</div>
            <div className="font-semibold text-xs">{orientation.label}</div>
            <div className="text-xs text-gray-600">{orientation.efficiency}%</div>
            {orientation.value === 'south' && (
              <div className="text-xs text-green-600 mt-1 font-medium">Best</div>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        South-facing roofs get the most sun in Canada
      </p>
    </div>
  )
}

