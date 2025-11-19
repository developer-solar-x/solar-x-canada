'use client'

import { Sun, BatteryCharging } from 'lucide-react'
import type { ProgramSelectorProps } from '../types'

export function ProgramSelector({ programType, onProgramTypeChange }: ProgramSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-base md:text-lg font-semibold text-gray-700 mb-3">
          Program Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onProgramTypeChange('net_metering')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              programType === 'net_metering'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                programType === 'net_metering'
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}>
                <Sun className="text-white" size={24} />
              </div>
              <div className="font-semibold text-gray-800">Solar Net Metering</div>
            </div>
            <div className="text-sm text-gray-600">
              Traditional grid-tied solar with bill credits for exports
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => onProgramTypeChange('hrs_residential')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              programType === 'hrs_residential'
                ? 'border-navy-500 bg-navy-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                programType === 'hrs_residential'
                  ? 'bg-navy-500'
                  : 'bg-gray-200'
              }`}>
                <BatteryCharging className="text-white" size={24} />
              </div>
              <div className="font-semibold text-gray-800">Solar + Battery</div>
            </div>
            <div className="text-sm text-gray-600">
              Solar + battery with peak shaving savings
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

