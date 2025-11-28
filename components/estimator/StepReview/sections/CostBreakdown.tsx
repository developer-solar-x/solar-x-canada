'use client'

import { formatCurrency } from '@/lib/utils'
import { Sun, Battery, Minus, Plus } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

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
  programType?: string
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
  programType,
}: CostBreakdownProps) {
  const isNetMetering = programType === 'net_metering'
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
              {isNetMetering ? (
                <div className="flex justify-between items-center bg-gray-50 rounded-md px-2 py-1.5">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Minus size={14} className="text-gray-400" />
                    Solar rebate
                  </span>
                  <span className="font-bold text-gray-500 text-base">$0 (no rebates for net metering)</span>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-50 rounded-md px-2 py-1.5">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Minus size={14} className="text-green-600" />
                    Solar rebate
                  </span>
                  <span className="font-bold text-green-600 text-base">-{formatCurrency(solarIncentives)}</span>
                </div>
              )}
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
              {isNetMetering ? (
                <div className="flex justify-between items-center bg-gray-50 rounded-md px-2 py-1.5">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Minus size={14} className="text-gray-400" />
                    Battery rebate
                  </span>
                  <span className="font-bold text-gray-500 text-base">$0 (no rebates for net metering)</span>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-50 rounded-md px-2 py-1.5">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Minus size={14} className="text-green-600" />
                    Battery rebate
                  </span>
                  <span className="font-bold text-green-600 text-base">-{formatCurrency(batteryProgramRebate)}</span>
                </div>
              )}
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

      {/* Pricing, rebates & incentives disclaimer */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-700">
        <InfoTooltip
          content="Estimated pricing, incentives, and rebates are based on current publicly available program information. Programs may change, close, or require specific eligibility criteria. Final pricing and incentives are confirmed only through a formal proposal from a qualified installer."
        />
        <span>Pricing and rebates are estimates only – final amounts come from your installer proposal.</span>
      </div>
    </div>
  )
}

