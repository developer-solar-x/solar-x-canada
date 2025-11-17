'use client'

import { formatCurrency } from '@/lib/utils'

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
    <div className="card p-6 bg-white border border-gray-200">
      <h3 className="text-lg font-bold text-navy-600 mb-3">Cost Breakdown</h3>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="font-semibold text-gray-700 mb-2">Solar</div>
          <div className="flex justify-between"><span>Total (before rebates)</span><span className="font-bold text-navy-600">{formatCurrency(solarTotalCost)}</span></div>
          <div className="flex justify-between"><span>Solar rebate</span><span className="font-bold text-green-600">-{formatCurrency(solarIncentives)}</span></div>
          <div className="flex justify-between border-t border-gray-200 mt-2 pt-2"><span>Solar net</span><span className="font-bold text-navy-600">{formatCurrency(solarNetCost)}</span></div>
        </div>
        {includeBattery && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="font-semibold text-gray-700 mb-2">Battery ({aggregatedBattery?.labels?.join(' + ')})</div>
            <div className="flex justify-between"><span>Battery price</span><span className="font-bold text-navy-600">{formatCurrency(batteryPrice)}</span></div>
            <div className="flex justify-between"><span>Battery rebate</span><span className="font-bold text-green-600">-{formatCurrency(batteryProgramRebate)}</span></div>
            <div className="flex justify-between border-t border-gray-200 mt-2 pt-2"><span>Battery net</span><span className="font-bold text-navy-600">{formatCurrency(batteryProgramNet)}</span></div>
          </div>
        )}
      </div>
      {hasBatteryDetails && (
        <div className="mt-3 text-xs text-gray-600">
          Combined Net = Solar net {formatCurrency(solarNetCost)} + Battery net {formatCurrency(batteryProgramNet)} = <span className="font-semibold text-navy-600">{formatCurrency(combinedNetCost)}</span>
        </div>
      )}
    </div>
  )
}

