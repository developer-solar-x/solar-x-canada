'use client'

import { MONTH_NAMES } from '../constants'
import type { MonthlyInputProps } from '../types'

export function MonthlyInput({
  monthlyValues,
  onMonthlyChange,
  onAutoDistribute,
  onApply,
}: MonthlyInputProps) {
  return (
    <div className="card p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-navy-500">Monthly Usage (kWh)</h4>
        <button
          onClick={onAutoDistribute}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Auto-Fill Seasonal Pattern
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        {MONTH_NAMES.map((month, index) => (
          <div key={month}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {month}
            </label>
            <input
              type="number"
              value={monthlyValues[index]}
              onChange={(e) => onMonthlyChange(index, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="0"
              step="10"
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t">
        <div className="text-sm">
          <span className="text-gray-600">Annual Total:</span>
          <span className="font-bold text-navy-500 ml-2">
            {monthlyValues.reduce((sum, val) => sum + val, 0).toLocaleString()} kWh
          </span>
        </div>
        <button
          onClick={onApply}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
        >
          Apply Monthly Values
        </button>
      </div>
    </div>
  )
}

