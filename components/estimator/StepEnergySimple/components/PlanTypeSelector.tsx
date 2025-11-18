'use client'

import { Sun, Battery } from 'lucide-react'
import type { PlanTypeSelectorProps } from '../types'

export function PlanTypeSelector({ planType, onPlanTypeChange }: PlanTypeSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Which system are you interested in?
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-left opacity-70 cursor-not-allowed">
          <div className="p-3 rounded-lg bg-gray-200">
            <Sun size={24} className="text-gray-500" />
          </div>
          <div>
            <div className="font-semibold text-gray-500">Solar Only (Net Metering)</div>
            <p className="text-xs text-gray-500 mt-1">
              Coming soon. Quick Estimate currently supports the solar + battery path.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPlanTypeChange('battery')}
          className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${
            planType === 'battery' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
          }`}
        >
          <div className={`p-3 rounded-lg ${planType === 'battery' ? 'bg-blue-500' : 'bg-gray-100'}`}>
            <Battery size={24} className={planType === 'battery' ? 'text-white' : 'text-gray-500'} />
          </div>
          <div>
            <div className="font-semibold text-navy-500">Solar + Battery (Peak Shaving)</div>
            <p className="text-xs text-gray-600 mt-1">
              Add a battery to shift usage out of expensive hours and keep essentials running during outages.
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

