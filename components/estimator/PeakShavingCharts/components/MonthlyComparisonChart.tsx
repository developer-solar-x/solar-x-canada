'use client'

import type { MonthlyComparisonChartProps } from '../types'

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

