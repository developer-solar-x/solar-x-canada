'use client'

import { Info } from 'lucide-react'
import { SHADE_LEVELS } from '../constants'
import type { ShadeLevelSelectorProps } from '../types'

export function ShadeLevelSelector({ shadeLevel, onShadeLevelChange }: ShadeLevelSelectorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <label className="block text-sm font-semibold text-gray-700">
          How much shade does your roof get?
        </label>
        <div className="relative group">
          <Info className="text-blue-500 cursor-help hover:text-blue-600 transition-colors" size={18} />
          <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
            <div className="font-semibold mb-2">Usable Roof Area Deductions</div>
            <div className="space-y-1">
              <div><strong>None:</strong> ~19% total deduction (10% obstructions + 10% shading)</div>
              <div><strong>Minimal:</strong> ~28% total deduction (10% obstructions + 20% shading)</div>
              <div><strong>Partial:</strong> ~41.5% total deduction (10% obstructions + 35% shading)</div>
              <div><strong>Significant:</strong> ~55% total deduction (10% obstructions + 50% shading)</div>
            </div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
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

