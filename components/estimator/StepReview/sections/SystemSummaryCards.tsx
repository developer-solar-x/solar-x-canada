'use client'

import { Zap, DollarSign, TrendingDown, TrendingUp, Sun, Moon } from 'lucide-react'
import { formatCurrency, formatKw } from '@/lib/utils'

interface SystemSummaryCardsProps {
  systemSizeKw: number
  numPanels: number
  selectedBattery?: any
  batteryDetails?: any
  combinedTotalCost: number
  solarTotalCost: number
  batteryPrice: number
  includeBattery: boolean
  combinedNetCost: number
  solarIncentives: number
  batteryProgramRebate: number
  aggregatedBattery?: any
  combinedMonthlySavings: number
  tou?: any
  ulo?: any
  peakShaving?: any
  displayPlan?: string
  solarMonthlySavings: number
  batteryMonthlySavings: number
  batteryAnnualSavings: number
}

export function SystemSummaryCards({
  systemSizeKw,
  numPanels,
  selectedBattery,
  batteryDetails,
  combinedTotalCost,
  solarTotalCost,
  batteryPrice,
  includeBattery,
  combinedNetCost,
  solarIncentives,
  batteryProgramRebate,
  aggregatedBattery,
  combinedMonthlySavings,
  tou,
  ulo,
  peakShaving,
  displayPlan,
  solarMonthlySavings,
  batteryMonthlySavings,
  batteryAnnualSavings,
}: SystemSummaryCardsProps) {
  // Get TOU and ULO monthly savings from Plan Comparison combined data
  let touMonthly = combinedMonthlySavings
  let uloMonthly = combinedMonthlySavings
  if (tou && ulo && includeBattery) {
    const touCombined = (peakShaving as any)?.tou?.allResults?.combined?.combined || 
                       (peakShaving as any)?.tou?.combined?.combined ||
                       (peakShaving as any)?.tou?.combined
    const uloCombined = (peakShaving as any)?.ulo?.allResults?.combined?.combined || 
                       (peakShaving as any)?.ulo?.combined?.combined ||
                       (peakShaving as any)?.ulo?.combined
    
    touMonthly = touCombined?.monthly || Math.round((touCombined?.annual || 0) / 12) || combinedMonthlySavings
    uloMonthly = uloCombined?.monthly || Math.round((uloCombined?.annual || 0) / 12) || combinedMonthlySavings
  }

  return (
    <div className="space-y-4">
      {/* System Size */}
      <div className="card p-6">
        <Zap className="text-red-500 mb-3" size={32} />
        <div className="text-3xl font-bold text-navy-500 mb-1">
          {formatKw(systemSizeKw)}
        </div>
        <div className="text-sm text-gray-600">Recommended System</div>
        <div className="text-xs text-gray-500 mt-1">~{numPanels} solar panels</div>
        {selectedBattery && batteryDetails && (
          <div className="text-xs text-navy-500 font-semibold mt-2 flex items-center gap-1">
            <Zap size={12} />
            + {batteryDetails.battery.brand} {batteryDetails.battery.usableKwh} kWh
          </div>
        )}
      </div>

      {/* Total Cost */}
      <div className="card p-6">
        <DollarSign className="text-navy-500 mb-3" size={32} />
        <div className="text-3xl font-bold text-navy-500 mb-1">
          {formatCurrency(combinedTotalCost)}
        </div>
        <div className="text-sm text-gray-600">Total System Cost</div>
        <div className="text-xs text-gray-500 mt-1">
          {includeBattery
            ? <>Solar {formatCurrency(solarTotalCost)} + Battery {formatCurrency(batteryPrice)}</>
            : 'Before incentives'}
        </div>
      </div>

      {/* Net Cost - Emphasized */}
      <div className="p-6 rounded-xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="text-green-600" size={28} />
          <div className="text-sm font-semibold text-green-800">Your Net Investment</div>
        </div>
        <div className="text-4xl font-extrabold text-green-600 leading-tight">
          {formatCurrency(combinedNetCost)}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          After {formatCurrency(solarIncentives + (includeBattery ? batteryProgramRebate : 0))} in rebates
          {includeBattery && (
            <>
              <div className="text-[11px] text-gray-500 mt-1">
                Solar rebate: {formatCurrency(solarIncentives)} • Battery rebate: {formatCurrency(batteryProgramRebate)}
              </div>
              <div className="text-[11px] text-gray-500">Battery: {batteryDetails?.battery?.brand ? `${batteryDetails?.battery?.brand} ${batteryDetails?.battery?.model}` : aggregatedBattery?.labels?.join(' + ')} ({batteryDetails?.battery?.usableKwh || aggregatedBattery?.usableKwh} kWh)</div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Savings */}
      <div className="p-6 rounded-xl border-2 border-red-400 bg-gradient-to-br from-red-50 to-white shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-red-600" size={28} />
          <div className="text-sm font-semibold text-red-800">Monthly Savings</div>
        </div>
        {tou && ulo && includeBattery ? (
          <>
            <div className="space-y-2 mb-3">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Sun size={14} className="text-navy-400" />
                  <div className="text-xs text-gray-600 font-medium">TOU Plan</div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(touMonthly)}
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center gap-1 mb-1">
                  <Moon size={14} className="text-navy-400" />
                  <div className="text-xs text-gray-600 font-medium">ULO Plan</div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(uloMonthly)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl font-extrabold text-red-600 leading-tight">
              {formatCurrency(combinedMonthlySavings)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {displayPlan && (
                <>
                  Based on {displayPlan.toUpperCase()} rate plan
                  {includeBattery && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      Solar ${solarMonthlySavings.toLocaleString()}/mo + Battery ${batteryMonthlySavings.toLocaleString()}/mo
                    </div>
                  )}
                </>
              )}
              {!displayPlan && (
                <>
                  {includeBattery ? 'Solar + Battery savings' : 'Estimated monthly savings'}
                </>
              )}
              {includeBattery && (
                <div className="text-[11px] text-gray-500 mt-2">
                  Battery-only savings: ${batteryAnnualSavings.toLocaleString()}/yr ({Math.round(batteryAnnualSavings/12).toLocaleString()}/mo)
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

