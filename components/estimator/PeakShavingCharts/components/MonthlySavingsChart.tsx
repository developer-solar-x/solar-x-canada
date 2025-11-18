'use client'

import type { MonthlySavingsChartProps } from '../types'

export function MonthlySavingsChart({ monthlyProjection, averageMonthlySavings }: MonthlySavingsChartProps) {
  return (
    <div className="card p-6">
      <h4 className="text-lg font-semibold text-navy-500 mb-4">
        Monthly Savings (Year 1)
      </h4>
      <div className="flex items-end justify-between space-x-2 h-40">
        {monthlyProjection.map((month, index) => {
          const maxSavings = Math.max(...monthlyProjection.map(m => m.savings))
          const heightPercent = (month.savings / maxSavings) * 100
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="relative w-full group">
                <div
                  className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-500"
                  style={{ height: `${heightPercent}%`, minHeight: '24px' }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    ${month.savings}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-2">{month.month}</div>
            </div>
          )
        })}
      </div>
      <div className="text-center mt-4">
        <div className="text-sm text-gray-600">Average Monthly Savings</div>
        <div className="text-2xl font-bold text-green-600">
          ${Math.round(averageMonthlySavings)}
        </div>
      </div>
    </div>
  )
}

