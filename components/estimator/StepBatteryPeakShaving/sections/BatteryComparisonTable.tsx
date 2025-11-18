'use client'

import type { BatteryComparisonTableProps } from '../types'

export function BatteryComparisonTable({ batteryComparisons }: BatteryComparisonTableProps) {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-semibold text-navy-500 mb-4">
        Battery Comparison
      </h3>
    
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Battery
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Net Cost
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Year 1 Savings
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                25-Year Savings
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Payback
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                ROI/Year
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {batteryComparisons.map(comparison => (
              <tr key={comparison.battery.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="font-medium text-navy-500">
                    {comparison.battery.brand} {comparison.battery.model}
                  </div>
                  <div className="text-sm text-gray-600">
                    {comparison.battery.usableKwh} kWh usable
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-medium">
                  ${comparison.multiYearProjection.netCost.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right font-medium text-green-600">
                  ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
                </td>
                <td className="px-4 py-4 text-right font-bold text-green-600">
                  ${comparison.multiYearProjection.totalSavings25Year.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right font-medium">
                  {comparison.metrics.paybackYears.toFixed(1)} years
                </td>
                <td className="px-4 py-4 text-right font-medium text-red-600">
                  {comparison.metrics.annualROI.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

