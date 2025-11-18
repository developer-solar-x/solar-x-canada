'use client'

import { Gauge } from 'lucide-react'
import type { AnnualUsageInputProps } from '../types'

export function AnnualUsageInput({ annualUsageInput, onAnnualUsageChange }: AnnualUsageInputProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        What's your annual electricity usage? * (kWh)
      </label>
      <div className="relative">
        <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="number"
          value={annualUsageInput}
          onChange={(e) => onAnnualUsageChange(e.target.value)}
          placeholder="e.g., 12000"
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-lg"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Grab the annual total from your utility summary. Switch to the bill tab if you only know the dollar amount.
      </p>
    </div>
  )
}

