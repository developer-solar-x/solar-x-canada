'use client'

import { TrendingUp, Sun, Moon } from 'lucide-react'

interface PlanComparisonProps {
  touCombined: any
  uloCombined: any
}

export function PlanComparison({ touCombined, uloCombined }: PlanComparisonProps) {
  // Get baseline and final values
  const touBaseline = touCombined?.baselineAnnualBillEnergyOnly || 0
  const touFinal = touCombined?.postSolarBatteryAnnualBillEnergyOnly || 0
  const uloBaseline = uloCombined?.baselineAnnualBillEnergyOnly || 0
  const uloFinal = uloCombined?.postSolarBatteryAnnualBillEnergyOnly || 0
  
  // Get combined annual and monthly savings
  const touCombinedAnnual = touCombined?.annual || 0
  const touCombinedMonthly = touCombined?.monthly || 0
  const uloCombinedAnnual = uloCombined?.annual || 0
  const uloCombinedMonthly = uloCombined?.monthly || 0
  
  // Get payback and profit from projections
  const touPaybackYears = touCombined?.projection?.paybackYears
  const uloPaybackYears = uloCombined?.projection?.paybackYears
  const touProfit25 = touCombined?.projection?.netProfit25Year ?? 0
  const uloProfit25 = uloCombined?.projection?.netProfit25Year ?? 0

  return (
    <div className="mb-8">
      {/* Single unified card containing all metrics */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
        {/* Header area */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="text-red-500" size={22} />
            </div>
            <h4 className="text-lg font-bold text-gray-700">Plan Comparison (TOU vs ULO)</h4>
          </div>
          {/* Subtitle note */}
          <p className="text-xs text-gray-500">
            These results include both solar production and battery dispatch for each utility rate plan.
          </p>
        </div>

        {/* Energy-only note */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Costs shown are energy charges only (excluding HST, delivery, and fixed fees) to match maximum savings calculation.
          </p>
        </div>

        {/* Unified table with all metrics */}
        <div className="overflow-hidden border border-gray-200 rounded-xl">
          {/* Column headers */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div className="px-4 py-3">Metric</div>
            <div className="px-4 py-3 text-center text-blue-600">
              <Sun className="inline mr-1" size={14} />
              TOU Plan
            </div>
            <div className="px-4 py-3 text-center text-amber-600">
              <Moon className="inline mr-1" size={14} />
              ULO Plan
            </div>
          </div>

          {/* Baseline (No System) row */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200 bg-gray-50">
            <div className="px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">Baseline (No System)</span>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-lg font-bold text-gray-800">${Math.round(touBaseline).toLocaleString()}/yr</div>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-lg font-bold text-gray-800">${Math.round(uloBaseline).toLocaleString()}/yr</div>
            </div>
          </div>

          {/* After Solar + Battery row */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200">
            <div className="px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">After Solar + Battery</span>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-lg font-bold text-green-600">${Math.round(touFinal).toLocaleString()}/yr</div>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-lg font-bold text-green-600">${Math.round(uloFinal).toLocaleString()}/yr</div>
            </div>
          </div>

          {/* Annual savings row */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200 bg-green-50">
            <div className="px-4 py-4 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-700">Annual Savings</span>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                ${Math.round(touCombinedAnnual).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">
                ${Math.round(touCombinedMonthly).toLocaleString()}/month
              </div>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                ${Math.round(uloCombinedAnnual).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">
                ${Math.round(uloCombinedMonthly).toLocaleString()}/month
              </div>
            </div>
          </div>

          {/* Payback period row */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200">
            <div className="px-4 py-4 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-700">Payback Period (Full System)</span>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-navy-600">
                {touPaybackYears == null || touPaybackYears === Number.POSITIVE_INFINITY
                  ? 'N/A'
                  : `${touPaybackYears.toFixed(1)} years`}
              </div>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-navy-600">
                {uloPaybackYears == null || uloPaybackYears === Number.POSITIVE_INFINITY
                  ? 'N/A'
                  : `${uloPaybackYears.toFixed(1)} years`}
              </div>
            </div>
          </div>

          {/* 25-year profit row */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200">
            <div className="px-4 py-4 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-700">25-Year Profit</span>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ${Math.round(touProfit25).toLocaleString()}
              </div>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ${Math.round(uloProfit25).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

