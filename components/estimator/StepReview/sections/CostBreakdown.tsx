'use client'

import { formatCurrency } from '@/lib/utils'
import { Sun, Battery, Minus, Plus } from 'lucide-react'

interface CostBreakdownProps {
  solarTotalCost: number
  solarIncentives: number
  solarNetCost: number
  includeBattery: boolean
  batteryPrice: number
  batteryProgramRebate: number
  batteryProgramNet: number
  aggregatedBattery?: any
  hasBatteryDetails: boolean
  combinedNetCost: number
}

export function CostBreakdown({
  solarTotalCost,
  solarIncentives,
  solarNetCost,
  includeBattery,
  batteryPrice,
  batteryProgramRebate,
  batteryProgramNet,
  aggregatedBattery,
  hasBatteryDetails,
  combinedNetCost,
}: CostBreakdownProps) {
  return (
    <div className="card p-6 bg-blue-50 border-2 border-blue-100 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Sun className="text-white" size={20} />
        </div>
        <h3 className="text-xl font-bold text-navy-600">Cost Breakdown</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Solar Card */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-100">
            <Sun className="text-blue-500" size={18} />
            <div className="font-bold text-gray-800 text-base">Solar</div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total (before rebates)</span>
              <span className="font-bold text-gray-800 text-base">{formatCurrency(solarTotalCost)}</span>
            </div>
            <div className="flex justify-between items-center bg-green-50 rounded-md px-2 py-1.5">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Minus size={14} className="text-green-600" />
                Solar rebate
              </span>
              <span className="font-bold text-green-600 text-base">-{formatCurrency(solarIncentives)}</span>
            </div>
            <div className="flex justify-between items-center border-t-2 border-blue-200 pt-2.5 mt-2.5">
              <span className="font-semibold text-gray-700">Solar net</span>
              <span className="font-bold text-navy-600 text-lg">{formatCurrency(solarNetCost)}</span>
            </div>
          </div>
        </div>

        {/* Battery Card */}
        {includeBattery && (
          <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-100">
              <Battery className="text-purple-500" size={18} />
              <div className="font-bold text-gray-800 text-base">
                Battery {aggregatedBattery?.labels && `(${aggregatedBattery.labels.join(' + ')})`}
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Battery price</span>
                <span className="font-bold text-gray-800 text-base">{formatCurrency(batteryPrice)}</span>
              </div>
              <div className="flex justify-between items-center bg-green-50 rounded-md px-2 py-1.5">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Minus size={14} className="text-green-600" />
                  Battery rebate
                </span>
                <span className="font-bold text-green-600 text-base">-{formatCurrency(batteryProgramRebate)}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-purple-200 pt-2.5 mt-2.5">
                <span className="font-semibold text-gray-700">Battery net</span>
                <span className="font-bold text-navy-600 text-lg">{formatCurrency(batteryProgramNet)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Combined Net Cost */}
      {hasBatteryDetails && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-navy-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-navy-600" />
              <span className="text-sm font-semibold text-gray-700">Combined Net Cost</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-0.5">
                {formatCurrency(solarNetCost)} + {formatCurrency(batteryProgramNet)}
              </div>
              <div className="text-xl font-bold text-navy-600">
                {formatCurrency(combinedNetCost)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

