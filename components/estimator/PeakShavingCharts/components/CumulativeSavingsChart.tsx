'use client'

import type { CumulativeSavingsChartProps } from '../types'

export function CumulativeSavingsChart({
  cumulativeSavings,
  maxCumulative,
  breakEvenYear,
  netCost,
  paybackYears,
  totalSavings25Year,
  netProfit25Year,
}: CumulativeSavingsChartProps) {
  const chartHeight = 200

  return (
    <div className="card p-6">
      <h4 className="text-lg font-semibold text-navy-500 mb-4">
        25-Year Cumulative Savings
      </h4>
      
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map(percent => (
            <div key={percent} className="border-t border-gray-200 w-full">
              <span className="text-xs text-gray-500 ml-2">
                ${Math.round((maxCumulative * percent) / 100).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Break-even line */}
        {breakEvenYear && (
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-red-500"
            style={{
              top: `${((maxCumulative - netCost) / maxCumulative) * 100}%`
            }}
          >
            <span className="absolute left-2 -top-3 text-xs font-semibold text-red-600 bg-white px-2">
              Break Even
            </span>
          </div>
        )}

        {/* SVG for line chart */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Area fill */}
          <defs>
            <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Create path for area */}
          <path
            d={(() => {
              const points = cumulativeSavings.map((data, index) => {
                const x = (index / (cumulativeSavings.length - 1)) * 100
                const y = ((maxCumulative - data.cumulative) / maxCumulative) * 100
                return `${x},${y}`
              })
              const areaPath = `M 0,100 L ${points.map(p => p).join(' L ')} L 100,100 Z`
              return areaPath
            })()}
            fill="url(#savingsGradient)"
            vectorEffect="non-scaling-stroke"
          />

          {/* Line */}
          <polyline
            points={cumulativeSavings.map((data, index) => {
              const x = (index / (cumulativeSavings.length - 1)) * 100
              const y = ((maxCumulative - data.cumulative) / maxCumulative) * 100
              return `${x}%,${y}%`
            }).join(' ')}
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {cumulativeSavings.filter((_, i) => i % 5 === 0 || i === cumulativeSavings.length - 1).map((data, index, arr) => {
            const actualIndex = cumulativeSavings.indexOf(data)
            const x = (actualIndex / (cumulativeSavings.length - 1)) * 100
            const y = ((maxCumulative - data.cumulative) / maxCumulative) * 100
            
            return (
              <g key={actualIndex}>
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill="rgb(34, 197, 94)"
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Year 1</span>
        <span>Year 5</span>
        <span>Year 10</span>
        <span>Year 15</span>
        <span>Year 20</span>
        <span>Year 25</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <div className="text-sm text-gray-600">Break Even</div>
          <div className="text-xl font-bold text-red-600">
            {paybackYears.toFixed(1)} years
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Savings</div>
          <div className="text-xl font-bold text-green-600">
            ${totalSavings25Year.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Net Profit</div>
          <div className="text-xl font-bold text-navy-500">
            ${netProfit25Year.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

