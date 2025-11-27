'use client'

import { Zap, DollarSign, TrendingDown, TrendingUp, Sun, Moon } from 'lucide-react'
import { formatCurrency, formatKw } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

// Before/After Savings Bars Component (from PeakShavingSalesCalculatorFRD)
function BeforeAfterBars({ 
  before, 
  after, 
  savings 
}: { 
  before: number
  after: number
  savings: number
}) {
  const maxValue = Math.max(before, after) * 1.1
  const beforeWidth = (before / maxValue) * 100
  const afterWidth = (after / maxValue) * 100
  const savingsPercent = before > 0 ? (savings / before) * 100 : 0
  const monthlySavings = Math.round(savings / 12)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Before bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Before System</span>
            <span className="text-base font-bold text-gray-800">${before.toLocaleString()}/yr</span>
          </div>
          <div className="w-full h-12 bg-gray-200 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700 ease-out"
              style={{ width: `${beforeWidth}%` }}
            ></div>
          </div>
        </div>

        {/* After bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">After Solar + Battery + AI EMC</span>
            <span className="text-base font-bold text-green-600">${after.toLocaleString()}/yr</span>
          </div>
          <div className="w-full h-12 bg-gray-200 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700 ease-out"
              style={{ width: `${afterWidth}%` }}
            ></div>
          </div>
        </div>

        {/* Savings summary */}
        <div className="pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-800">Total Savings</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ${savings.toLocaleString()}
              </div>
            </div>
          </div>
          {/* Monthly savings display - FRD requirement */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Monthly Savings</span>
              <span className="text-lg font-bold text-green-600">
                ${monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  programType?: 'hrs_residential' | 'net_metering' | 'quick'
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
  programType,
}: SystemSummaryCardsProps) {
  // Extract before/after comparison data for TOU and ULO plans
  // Use the same extraction logic as PlanComparison component in StepReview/index.tsx
  let touBeforeAfter = null
  let uloBeforeAfter = null
  
  if (includeBattery) {
    // Try multiple data sources - same as PlanComparison uses
    const touCombined = (peakShaving as any)?.tou?.allResults?.combined?.combined || 
                       (peakShaving as any)?.tou?.combined?.combined ||
                       (peakShaving as any)?.tou?.combined ||
                       (tou as any)?.allResults?.combined?.combined ||
                       (tou as any)?.combined?.combined ||
                       (tou as any)?.combined
    
    const uloCombined = (peakShaving as any)?.ulo?.allResults?.combined?.combined || 
                       (peakShaving as any)?.ulo?.combined?.combined ||
                       (peakShaving as any)?.ulo?.combined ||
                       (ulo as any)?.allResults?.combined?.combined ||
                       (ulo as any)?.combined?.combined ||
                       (ulo as any)?.combined
    
    // Extract before/after for TOU
    if (touCombined) {
      const before = touCombined.baselineAnnualBill || touCombined.baselineAnnualBillEnergyOnly || 0
      const after = touCombined.postSolarBatteryAnnualBill || touCombined.postSolarBatteryAnnualBillEnergyOnly || 0
      const annualSavings = touCombined.annual || (before - after)
      
      if (before > 0 && after >= 0) {
        touBeforeAfter = { before, after, savings: annualSavings }
      }
    }
    
    // Extract before/after for ULO
    if (uloCombined) {
      const before = uloCombined.baselineAnnualBill || uloCombined.baselineAnnualBillEnergyOnly || 0
      const after = uloCombined.postSolarBatteryAnnualBill || uloCombined.postSolarBatteryAnnualBillEnergyOnly || 0
      const annualSavings = uloCombined.annual || (before - after)
      
      if (before > 0 && after >= 0) {
        uloBeforeAfter = { before, after, savings: annualSavings }
      }
    }
  }

  return (
    <>
      {/* System Size Card - will be placed in grid */}
      <div className="card p-6">
        <Zap className="text-red-500 mb-3" size={32} />
        <div className="text-3xl font-bold text-navy-500 mb-1">
          {formatKw(systemSizeKw)}
        </div>
        <div className="text-sm text-gray-600">Recommended System</div>
        <div className="text-xs text-gray-500 mt-1">{numPanels} solar panels</div>
        {selectedBattery && batteryDetails && (
          <div className="text-xs text-navy-500 font-semibold mt-2 flex items-center gap-1">
            <Zap size={12} />
            + {batteryDetails.battery.brand} {batteryDetails.battery.model}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
          <InfoTooltip
            content="System size, layout, equipment model, and projected output shown by the calculator are preliminary estimates. Final system design can only be confirmed after a full site assessment, roof analysis, and engineering review."
          />
          <span>Preliminary estimate – see details in full disclaimer.</span>
        </div>
      </div>

      {/* Total Cost Card - will be placed in grid */}
      <div className="card p-6">
        <DollarSign className="text-navy-500 mb-3" size={32} />
        <div className="text-3xl font-bold text-navy-500 mb-1">
          {formatCurrency(combinedTotalCost)}
        </div>
        <div className="text-sm text-gray-600">Total System Cost</div>
        <div className="text-xs text-gray-500 mt-1">
          {includeBattery && (
            <>Solar {formatCurrency(solarTotalCost)} + Battery {formatCurrency(batteryPrice)}</>
          )}
        </div>
      </div>

      {/* Net Cost Card - will be placed in grid */}
      <div className="p-6 rounded-xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="text-green-600" size={28} />
          <div className="text-sm font-semibold text-green-800">Your Net Investment</div>
        </div>
        <div className="text-4xl font-extrabold text-green-600 leading-tight">
          {formatCurrency(combinedNetCost)}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {programType === 'net_metering' ? (
            'No rebates for net metering'
          ) : (
            <>
          After {formatCurrency(solarIncentives + (includeBattery ? batteryProgramRebate : 0))} in rebates
          {includeBattery && (
            <>
              <div className="text-[11px] text-gray-500 mt-1">
                Solar rebate: {formatCurrency(solarIncentives)} • Battery rebate: {formatCurrency(batteryProgramRebate)}
              </div>
              <div className="text-[11px] text-gray-500">Battery: {batteryDetails?.battery?.brand ? `${batteryDetails?.battery?.brand} ${batteryDetails?.battery?.model}` : aggregatedBattery?.labels?.join(' + ')}</div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// Separate component for Before/After Comparison - Full width section
export function BeforeAfterComparison({
  includeBattery,
  touBeforeAfter,
  uloBeforeAfter,
  combinedMonthlySavings,
  displayPlan,
}: {
  includeBattery: boolean
  touBeforeAfter: any
  uloBeforeAfter: any
  combinedMonthlySavings: number
  displayPlan?: string
}) {
  if (includeBattery) {
    return (
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Before & After Comparison</h3>
          <p className="text-sm text-gray-600">Annual cost comparison with your solar + battery system</p>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-6">
          {/* TOU Plan Column */}
          <div className="space-y-4 md:pr-6 md:border-r md:border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Sun size={20} className="text-blue-500" />
              <h4 className="text-lg font-bold text-gray-800">TOU Plan</h4>
            </div>
            {touBeforeAfter ? (
              <BeforeAfterBars
                before={touBeforeAfter.before}
                after={touBeforeAfter.after}
                savings={touBeforeAfter.savings}
              />
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                TOU Plan data not available
              </div>
            )}
          </div>
          
          {/* ULO Plan Column */}
          <div className="space-y-4 md:pl-6">
            <div className="flex items-center gap-2 mb-2">
              <Moon size={20} className="text-purple-500" />
              <h4 className="text-lg font-bold text-gray-800">ULO Plan</h4>
            </div>
            {uloBeforeAfter ? (
              <BeforeAfterBars
                before={uloBeforeAfter.before}
                after={uloBeforeAfter.after}
                savings={uloBeforeAfter.savings}
              />
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                ULO Plan data not available
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="p-6 rounded-xl border-2 border-red-400 bg-gradient-to-br from-red-50 to-white shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-red-600" size={28} />
          <div className="text-sm font-semibold text-red-800">Monthly Savings</div>
        </div>
        <div className="text-4xl font-extrabold text-red-600 leading-tight">
          {formatCurrency(combinedMonthlySavings)}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {displayPlan && (
            <>
              Based on {displayPlan.toUpperCase()} rate plan
            </>
          )}
          {!displayPlan && (
            <>
              Estimated monthly savings
            </>
          )}
        </div>
      </div>
    )
  }
}

