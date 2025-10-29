'use client'

import { useMemo } from 'react'
import { BatteryComparison } from '../../lib/battery-dispatch'

interface PeakShavingChartsProps {
  comparison: BatteryComparison
}

export function PeakShavingCharts({ comparison }: PeakShavingChartsProps) {
  // Calculate monthly savings projection for first year
  const monthlyProjection = useMemo(() => {
    const monthlySavings = comparison.firstYearAnalysis.averageDailySavings * 30.42 // Average days per month
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i).toLocaleDateString('en-US', { month: 'short' }),
      savings: Math.round(monthlySavings)
    }))
  }, [comparison])

  // Calculate cumulative savings over 25 years
  const cumulativeSavings = useMemo(() => {
    return comparison.multiYearProjection.yearlyProjections.map(year => ({
      year: year.year,
      cumulative: year.cumulativeSavings,
      annual: year.annualSavings
    }))
  }, [comparison])

  // Find break-even point
  const breakEvenYear = useMemo(() => {
    return comparison.multiYearProjection.yearlyProjections.find(
      year => year.cumulativeSavings >= comparison.multiYearProjection.netCost
    )
  }, [comparison])

  // Calculate max value for scaling
  const maxCumulative = Math.max(...cumulativeSavings.map(d => d.cumulative))
  const chartHeight = 200

  return (
    <div className="space-y-6">
      {/* Monthly Savings Bar Chart */}
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
            ${Math.round(comparison.firstYearAnalysis.averageDailySavings * 30.42)}
          </div>
        </div>
      </div>

      {/* Cumulative Savings Line Chart */}
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
                top: `${((maxCumulative - comparison.multiYearProjection.netCost) / maxCumulative) * 100}%`
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
              {comparison.multiYearProjection.paybackYears.toFixed(1)} years
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Savings</div>
            <div className="text-xl font-bold text-green-600">
              ${comparison.multiYearProjection.totalSavings25Year.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Net Profit</div>
            <div className="text-xl font-bold text-navy-500">
              ${comparison.multiYearProjection.netProfit25Year.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Before vs After Bills */}
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
              ${comparison.firstYearAnalysis.originalAnnualCost.toFixed(0)}
            </div>
            <div className="text-sm text-red-700">Annual Electricity Bill</div>
            <div className="text-xs text-red-600 mt-2">
              ~${(comparison.firstYearAnalysis.originalAnnualCost / 12).toFixed(0)}/month
            </div>
          </div>

          {/* After */}
          <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="text-sm font-medium text-green-800 mb-2">
              WITH BATTERY
            </div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              ${comparison.firstYearAnalysis.optimizedAnnualCost.toFixed(0)}
            </div>
            <div className="text-sm text-green-700">Annual Electricity Bill</div>
            <div className="text-xs text-green-600 mt-2">
              ~${(comparison.firstYearAnalysis.optimizedAnnualCost / 12).toFixed(0)}/month
            </div>
          </div>
        </div>

        {/* Savings highlight */}
        <div className="mt-6 text-center p-4 bg-gradient-to-r from-red-50 to-gray-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-800 font-medium mb-1">
            YOU SAVE
          </div>
          <div className="text-3xl font-bold text-red-600">
            ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
          </div>
          <div className="text-sm text-red-700 mt-1">
            in your first year
          </div>
          <div className="text-xs text-red-600 mt-2">
            That's {((comparison.firstYearAnalysis.totalSavings / comparison.firstYearAnalysis.originalAnnualCost) * 100).toFixed(1)}% off your electricity bill
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="card p-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <h4 className="text-lg font-semibold text-navy-500 mb-4">
          How Peak Shaving Works
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Charging */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                1
              </div>
              <div className="font-semibold text-navy-500">Charge During Cheap Hours</div>
            </div>
            <p className="text-sm text-gray-600 ml-13">
              Your battery charges automatically during ultra-low or off-peak hours when electricity is cheapest (as low as 3.9¢/kWh).
            </p>
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
              Typically: 11 PM - 7 AM
            </div>
          </div>

          {/* Discharging */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold mr-3">
                2
              </div>
              <div className="font-semibold text-navy-500">Use During Peak Hours</div>
            </div>
            <p className="text-sm text-gray-600 ml-13">
              During expensive peak hours, your battery powers your home instead of drawing from the grid (avoiding rates up to 39.1¢/kWh).
            </p>
            <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-800">
              Typically: 4 PM - 9 PM
            </div>
          </div>
        </div>

        {/* Energy shifted */}
        <div className="mt-6 pt-6 border-t border-navy-200">
          <div className="text-center">
            <div className="text-sm text-navy-700 font-medium mb-2">
              Energy Shifted Per Year
            </div>
            <div className="text-3xl font-bold text-navy-600">
              {comparison.firstYearAnalysis.totalKwhShifted.toFixed(0)} kWh
            </div>
            <div className="text-sm text-navy-600 mt-1">
              ~{comparison.firstYearAnalysis.cyclesPerYear} full battery cycles per year
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple bar chart component for monthly comparisons
interface MonthlyComparisonChartProps {
  beforeData: number[]
  afterData: number[]
  labels: string[]
}

export function MonthlyComparisonChart({ beforeData, afterData, labels }: MonthlyComparisonChartProps) {
  const maxValue = Math.max(...beforeData, ...afterData)
  
  return (
    <div className="space-y-4">
      {labels.map((label, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-600">
              ${beforeData[index].toFixed(0)} → ${afterData[index].toFixed(0)}
            </span>
          </div>
          <div className="flex gap-2">
            {/* Before bar */}
            <div className="flex-1 relative h-6 bg-gray-100 rounded overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-red-400 transition-all"
                style={{ width: `${(beforeData[index] / maxValue) * 100}%` }}
              />
            </div>
            {/* After bar */}
            <div className="flex-1 relative h-6 bg-gray-100 rounded overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                style={{ width: `${(afterData[index] / maxValue) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      
      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span>Before Battery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>With Battery</span>
        </div>
      </div>
    </div>
  )
}

