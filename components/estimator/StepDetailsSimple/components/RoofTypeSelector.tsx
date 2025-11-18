'use client'

import { ROOF_TYPES } from '../constants'
import type { RoofTypeSelectorProps } from '../types'

export function RoofTypeSelector({ roofType, onRoofTypeChange }: RoofTypeSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        What type of roof do you have?
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        {ROOF_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onRoofTypeChange(type.id)}
            className={`p-4 border-2 rounded-lg transition-all text-left ${
              roofType === type.id
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="font-semibold text-navy-500">{type.label}</div>
            <div className="text-xs text-gray-600">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

