'use client'

import type { AnnualInputProps } from '../types'

export function AnnualInput({ annualUsageKwh, onAnnualUsageChange }: AnnualInputProps) {
  return (
    <div className="card p-4 bg-gray-50">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Annual Energy Usage (kWh)
      </label>
      <input
        type="number"
        value={annualUsageKwh}
        onChange={(e) => onAnnualUsageChange(Number(e.target.value))}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        min="1000"
        max="50000"
        step="100"
      />
      <p className="text-xs text-gray-500 mt-2">
        Uses seasonal adjustment factors to estimate monthly variation
      </p>
    </div>
  )
}

