'use client'

import { calculateBatteryFinancials } from '@/config/battery-specs'
import type { ComparisonBatteryCardsProps } from '../types'

export function ComparisonBatteryCards({ batteryComparisons }: ComparisonBatteryCardsProps) {
  return (
    <>
      {batteryComparisons.map(comparison => (
        <div key={comparison.battery.id} className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-xl font-bold text-navy-500">
                {comparison.battery.brand} {comparison.battery.model}
              </h4>
              <p className="text-gray-600">{comparison.battery.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Value Score</div>
              <div className="text-2xl font-bold text-red-500">
                {comparison.metrics.savingsPerDollarInvested.toFixed(2)}x
              </div>
              <div className="text-xs text-gray-500">Savings per $ invested</div>
            </div>
          </div>

          {/* Financial Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Battery Price</div>
              <div className="text-lg font-bold text-navy-500">
                ${comparison.battery.price.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Rebate</div>
              <div className="text-lg font-bold text-green-600">
                -${calculateBatteryFinancials(comparison.battery).rebate.toLocaleString()}
              </div>
            </div>
            <div className="bg-navy-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Net Cost</div>
              <div className="text-lg font-bold text-navy-600">
                ${comparison.multiYearProjection.netCost.toLocaleString()}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Payback Period</div>
              <div className="text-lg font-bold text-red-600">
                {comparison.metrics.paybackYears.toFixed(1)} yrs
              </div>
            </div>
          </div>

          {/* Savings Details */}
          <div className="border-t pt-4">
            <h5 className="font-semibold text-navy-500 mb-3">Savings Breakdown</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Year 1 Savings</div>
                <div className="text-xl font-bold text-green-600">
                  ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ~${(comparison.firstYearAnalysis.totalSavings / 12).toFixed(0)}/month
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">25-Year Total Savings</div>
                <div className="text-xl font-bold text-green-600">
                  ${comparison.multiYearProjection.totalSavings25Year.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  With 5% annual rate increase
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Net Profit (25 years)</div>
                <div className="text-xl font-bold text-navy-600">
                  ${comparison.multiYearProjection.netProfit25Year.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  After paying off battery cost
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

