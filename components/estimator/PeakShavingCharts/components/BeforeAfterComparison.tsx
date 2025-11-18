'use client'

import type { BeforeAfterComparisonProps } from '../types'

export function BeforeAfterComparison({
  originalAnnualCost,
  optimizedAnnualCost,
  totalSavings,
}: BeforeAfterComparisonProps) {
  return (
    <div className="card p-6">
      <h4 className="text-lg font-semibold text-navy-500 mb-4">
        Before vs After Battery
      </h4>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Before */}
        <div className="text-center p-6 bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-sm font-medium text-red-800 mb-2">
            WITHOUT BATTERY
          </div>
          <div className="text-4xl font-bold text-red-600 mb-2">
            ${originalAnnualCost.toFixed(0)}
          </div>
          <div className="text-sm text-red-700">Annual Electricity Bill</div>
          <div className="text-xs text-red-600 mt-2">
            ~${(originalAnnualCost / 12).toFixed(0)}/month
          </div>
        </div>

        {/* After */}
        <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-sm font-medium text-green-800 mb-2">
            WITH BATTERY
          </div>
          <div className="text-4xl font-bold text-green-600 mb-2">
            ${optimizedAnnualCost.toFixed(0)}
          </div>
          <div className="text-sm text-green-700">Annual Electricity Bill</div>
          <div className="text-xs text-green-600 mt-2">
            ~${(optimizedAnnualCost / 12).toFixed(0)}/month
          </div>
        </div>
      </div>

      {/* Savings highlight */}
      <div className="mt-6 text-center p-4 bg-gradient-to-r from-red-50 to-gray-50 rounded-lg border border-red-200">
        <div className="text-sm text-red-800 font-medium mb-1">
          YOU SAVE
        </div>
        <div className="text-3xl font-bold text-red-600">
          ${totalSavings.toFixed(0)}
        </div>
        <div className="text-sm text-red-700 mt-1">
          in your first year
        </div>
        <div className="text-xs text-red-600 mt-2">
          That's {((totalSavings / originalAnnualCost) * 100).toFixed(1)}% off your electricity bill
        </div>
      </div>
    </div>
  )
}

