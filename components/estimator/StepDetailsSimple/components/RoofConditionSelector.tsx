'use client'

import { ROOF_CONDITIONS } from '../constants'
import type { RoofConditionSelectorProps } from '../types'

export function RoofConditionSelector({ roofCondition, onRoofConditionChange }: RoofConditionSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        What's the condition of your roof?
      </label>
      <div className="grid sm:grid-cols-3 gap-3">
        {ROOF_CONDITIONS.map((condition) => (
          <button
            key={condition.id}
            onClick={() => onRoofConditionChange(condition.id)}
            className={`p-4 border-2 rounded-lg transition-all text-center ${
              roofCondition === condition.id
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="font-semibold text-navy-500 mb-1">{condition.label}</div>
            <div className="text-xs text-gray-600">{condition.range}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Not sure? Choose "Good" - we'll verify during site visit
      </p>
    </div>
  )
}

