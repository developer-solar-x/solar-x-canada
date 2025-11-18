'use client'

import { DollarSign } from 'lucide-react'
import { BLENDED_RATE } from '../constants'
import type { MonthlyBillInputProps } from '../types'

export function MonthlyBillInput({ monthlyBillInput, onMonthlyBillChange }: MonthlyBillInputProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        What's your average monthly electric bill?
      </label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="number"
          value={monthlyBillInput}
          onChange={(e) => onMonthlyBillChange(e.target.value)}
          placeholder="e.g., 180"
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-lg"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        We convert your monthly bill to kWh using a blended {(BLENDED_RATE * 100).toFixed(1)}¢/kWh rate (energy + delivery + HST).
      </p>
    </div>
  )
}

