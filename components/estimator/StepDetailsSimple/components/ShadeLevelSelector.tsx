'use client'

import { SHADE_LEVELS } from '../constants'
import type { ShadeLevelSelectorProps } from '../types'

export function ShadeLevelSelector({ shadeLevel, onShadeLevelChange }: ShadeLevelSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        How much shade does your roof get?
      </label>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {SHADE_LEVELS.map((shade) => (
          <button
            key={shade.id}
            onClick={() => onShadeLevelChange(shade.id)}
            className={`p-4 border-2 rounded-lg transition-all text-center ${
              shadeLevel === shade.id
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="text-3xl mb-2">{shade.icon}</div>
            <div className="font-semibold text-navy-500 text-sm">{shade.label}</div>
            <div className="text-xs text-gray-600 mt-1">{shade.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

