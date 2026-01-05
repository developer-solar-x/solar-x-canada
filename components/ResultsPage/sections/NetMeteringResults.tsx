'use client'

// Net Metering Results Section for Results Page
// Displays net metering data in a clean, organized format

import { useState } from 'react'
import { DollarSign, TrendingUp, AlertTriangle, Zap, Calendar, BarChart3, Sun } from 'lucide-react'
import { formatCurrency, formatKwh, formatNumber } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import type { NetMeteringResult } from '@/lib/net-metering'

interface NetMeteringResultsProps {
  netMeteringData: {
    tou?: NetMeteringResult & { projection?: any; alberta?: any }
    ulo?: NetMeteringResult & { projection?: any }
    tiered?: NetMeteringResult & { projection?: any }
    selectedRatePlan?: string
  }
  systemSizeKw?: number
  numPanels?: number
  province?: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function NetMeteringResults({ netMeteringData, systemSizeKw, numPanels, province }: NetMeteringResultsProps) {
  const { tou, ulo, tiered } = netMeteringData
  
  // Detect if this is Alberta Solar Club
  const isAlberta = province && (province.toUpperCase() === 'AB' || province.toUpperCase() === 'ALBERTA' || province.toUpperCase().includes('ALBERTA'))
  const albertaData = isAlberta && tou?.alberta ? tou.alberta : null

  // Use billOffsetPercent from the result if available, otherwise calculate it
  const touBillOffset = tou?.annual?.billOffsetPercent ?? (tou?.annual?.importCost && tou.annual.importCost > 0 
    ? Math.min(100, ((tou.annual.exportCredits || 0) / tou.annual.importCost) * 100)
    : 100)
  const uloBillOffset = ulo?.annual?.billOffsetPercent ?? (ulo?.annual?.importCost && ulo.annual.importCost > 0
    ? Math.min(100, ((ulo.annual.exportCredits || 0) / ulo.annual.importCost) * 100)
    : 100)
  const tieredBillOffset = tiered?.annual?.billOffsetPercent ?? (tiered?.annual?.importCost && tiered.annual.importCost > 0
    ? Math.min(100, ((tiered.annual.exportCredits || 0) / tiered.annual.importCost) * 100)
    : 100)
  const bestPlan = touBillOffset >= uloBillOffset ? 'TOU' : 'ULO'

  // Calculate energy offset (what % of usage is covered by production)
  const touEnergyOffset = tou?.annual?.totalLoad && tou.annual.totalLoad > 0
    ? Math.min(100, ((tou.annual.totalSolarProduction || 0) / tou.annual.totalLoad) * 100)
    : 0
  const uloEnergyOffset = ulo?.annual?.totalLoad && ulo.annual.totalLoad > 0
    ? Math.min(100, ((ulo.annual.totalSolarProduction || 0) / ulo.annual.totalLoad) * 100)
    : 0
  const tieredEnergyOffset = tiered?.annual?.totalLoad && tiered.annual.totalLoad > 0
    ? Math.min(100, ((tiered.annual.totalSolarProduction || 0) / tiered.annual.totalLoad) * 100)
    : 0

  // Calculate before/after bills for comparison
  const touBeforeBill = tou?.annual?.importCost ?? 0
  const touAfterBill = tou?.annual?.netAnnualBill ?? 0
  const uloBeforeBill = ulo?.annual?.importCost ?? 0
  const uloAfterBill = ulo?.annual?.netAnnualBill ?? 0
  const tieredBeforeBill = tiered?.annual?.importCost ?? 0
  const tieredAfterBill = tiered?.annual?.netAnnualBill ?? 0

  // Plan metrics for TOU / ULO / Tiered (year-1 savings, payback, 25-year profit)
  const planConfigs = [
    { id: 'tou', label: 'TOU', plan: tou as any },
    { id: 'ulo', label: 'ULO', plan: ulo as any },
    { id: 'tiered', label: 'Tiered', plan: tiered as any },
  ] as const

  const planMetrics = planConfigs
    .filter(cfg => cfg.plan)
    .map(cfg => {
      const projection = cfg.plan.projection || {}
      const annualSavings =
        projection.annualSavings ??
        (cfg.plan.annual ? cfg.plan.annual.importCost - cfg.plan.annual.netAnnualBill : 0)

      return {
        id: cfg.id,
        label: cfg.label,
        annualSavings,
        paybackYears:
          typeof projection.paybackYears === 'number' ? (projection.paybackYears as number) : null,
        profit25: projection.netProfit25Year ?? 0,
      }
    })

  // Plan selector to keep detailed view focused on one plan at a time
  const availablePlanIds = planMetrics.map(p => p.id)
  const initialSelectedPlan: 'tou' | 'ulo' | 'tiered' =
    (['tou', 'ulo', 'tiered'] as const).find(
      id => netMeteringData.selectedRatePlan === id && availablePlanIds.includes(id)
    ) ||
    (availablePlanIds[0] as 'tou' | 'ulo' | 'tiered' | undefined) ||
    'tou'

  const [selectedPlanId, setSelectedPlanId] = useState<'tou' | 'ulo' | 'tiered'>(initialSelectedPlan)
  const isTouSelected = selectedPlanId === 'tou'
  const isUloSelected = selectedPlanId === 'ulo'
  const isTieredSelected = selectedPlanId === 'tiered'

  // If Alberta, show summer/winter breakdown instead of TOU/ULO/Tiered
  if (isAlberta && albertaData && tou) {
    const annual = tou.annual
    const projection = tou.projection || {}
    const highSeason = albertaData.highProductionSeason
    const lowSeason = albertaData.lowProductionSeason
    
    // Calculate Alberta-specific metrics
    const annualSavings = projection.annualSavings ?? (annual.importCost - annual.netAnnualBill)
    const paybackYears = projection.paybackYears ?? null
    const profit25 = projection.netProfit25Year ?? 0
    const billOffset = annual.billOffsetPercent ?? 0
    
    return (
      <div className="space-y-6">
        {/* Alberta Solar Club Header */}
        <div className="bg-gradient-to-br from-navy-50 to-blue-50 rounded-xl p-6 border-2 border-navy-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900">Alberta Solar Club Results</h2>
              <p className="text-sm text-navy-700">Summer & Winter Rate Breakdown</p>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-navy-200">
              <div className="text-xs text-gray-600 mb-1">Annual Savings</div>
              <div className="text-2xl font-bold text-navy-600">
                {formatCurrency(Math.round(annualSavings || 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-navy-200">
              <div className="text-xs text-gray-600 mb-1">Payback Period</div>
              <div className="text-2xl font-bold text-navy-600">
                {paybackYears != null && isFinite(paybackYears)
                  ? `${paybackYears.toFixed(1)} yrs`
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-navy-200">
              <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
              <div className="text-2xl font-bold text-navy-600">
                {formatCurrency(Math.round(profit25 || 0))}
              </div>
            </div>
          </div>
          
          {/* Summer/Winter Breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* High Production Season (Summer) */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="text-amber-600" size={20} />
                <h3 className="text-lg font-bold text-amber-900">High Production Season</h3>
              </div>
              <p className="text-xs text-amber-700 mb-3 font-semibold">April - September (33¢/kWh export rate)</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Exported:</span>
                  <span className="font-bold text-amber-700">{formatKwh(highSeason?.exportedKwh || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Export Credits:</span>
                  <span className="font-bold text-green-600">{formatCurrency(highSeason?.exportCredits || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Imported:</span>
                  <span className="font-bold text-orange-600">{formatKwh(highSeason?.importedKwh || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Import Cost:</span>
                  <span className="font-bold text-red-600">{formatCurrency(highSeason?.importCost || 0)}</span>
                </div>
              </div>
            </div>
            
            {/* Low Production Season (Winter) */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 border-2 border-blue-300">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-blue-900">Low Production Season</h3>
              </div>
              <p className="text-xs text-blue-700 mb-3 font-semibold">October - March (6.89¢/kWh import rate)</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Exported:</span>
                  <span className="font-bold text-blue-700">{formatKwh(lowSeason?.exportedKwh || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Export Credits:</span>
                  <span className="font-bold text-green-600">{formatCurrency(lowSeason?.exportCredits || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Imported:</span>
                  <span className="font-bold text-orange-600">{formatKwh(lowSeason?.importedKwh || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Import Cost:</span>
                  <span className="font-bold text-red-600">{formatCurrency(lowSeason?.importCost || 0)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Annual Summary */}
          <div className="mt-4 bg-white rounded-lg p-4 border border-navy-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Annual Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Export Credits:</span>
                <span className="ml-2 font-bold text-green-600">{formatCurrency(annual.exportCredits || 0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Import Cost:</span>
                <span className="ml-2 font-bold text-red-600">{formatCurrency(annual.importCost || 0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Net Annual Bill:</span>
                <span className="ml-2 font-bold text-navy-900">{formatCurrency(annual.netAnnualBill || 0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Bill Offset:</span>
                <span className="ml-2 font-bold text-emerald-600">{billOffset.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Alberta-specific disclaimer */}
        <div className="flex items-start gap-2 text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-semibold text-amber-900 mb-1">Important: Rate Switching Required</p>
            <p className="text-amber-800">
              To maximize savings, you must switch to the high export rate (33¢/kWh) during summer months (Apr-Sep) 
              and the low import rate (6.89¢/kWh) during winter months (Oct-Mar). Forgetting to switch could reduce 
              your savings by $300-500/year.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plan selector */}
      {planMetrics.length > 1 && (
        <div className="flex justify-start">
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs sm:text-sm">
            {planMetrics.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id as 'tou' | 'ulo' | 'tiered')}
                className={`px-3 sm:px-4 py-1 rounded-full font-semibold transition-colors ${
                  selectedPlanId === plan.id
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-white'
                }`}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Net Metering Plan Comparison (Annual Savings, Payback, 25-Year Profit) */}
      {planMetrics.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Annual Savings */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-2">Annual Savings (Year 1)</div>
            {planMetrics.map(plan => (
              <div
                key={plan.id}
                className={`mt-1 ${selectedPlanId !== plan.id ? 'opacity-60' : ''}`}
              >
                <div className="text-[13px] text-gray-600">{plan.label}</div>
                <div className="text-base sm:text-xl font-bold text-navy-600">
                  {formatCurrency(Math.round(plan.annualSavings || 0))}
                </div>
              </div>
            ))}
          </div>

          {/* Payback */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-2">Payback</div>
            {planMetrics.map(plan => (
              <div
                key={plan.id}
                className={`mt-1 ${selectedPlanId !== plan.id ? 'opacity-60' : ''}`}
              >
                <div className="text-[13px] text-gray-600">{plan.label}</div>
                <div className="text-base sm:text-xl font-bold text-navy-600">
                  {plan.paybackYears != null && isFinite(plan.paybackYears)
                    ? `${plan.paybackYears.toFixed(1)} yrs`
                    : 'N/A'}
                </div>
              </div>
            ))}
          </div>

          {/* 25-Year Profit */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-2">25-Year Profit</div>
            {planMetrics.map(plan => (
              <div
                key={plan.id}
                className={`mt-1 ${selectedPlanId !== plan.id ? 'opacity-60' : ''}`}
              >
                <div className="text-[13px] text-gray-600">{plan.label}</div>
                <div className="text-base sm:text-xl font-bold text-navy-600">
                  {formatCurrency(Math.round(plan.profit25 || 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Net metering rules disclaimer */}
      <div className="flex items-start gap-2 text-xs text-gray-700">
        <InfoTooltip
          content="Credit values and export calculations are based on general net metering rules. Actual crediting depends on your utility provider, metering configuration, export limits, and the most recent program rules. Approval is required from the utility before any system can operate under net metering."
        />
        <span>Net metering credits and eligibility depend on your utility’s specific rules and approvals.</span>
      </div>

          {/* Offset Summary - Prominent Display (selected plan only) */}
          {(tou || ulo || tiered) && (
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900">Net Metering Offset Summary</h2>
              <p className="text-sm text-emerald-700">Your bill reduction with solar credits</p>
            </div>
          </div>
              <div className="grid grid-cols-1 gap-4">
                {isTouSelected && tou && (
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 mb-1">TOU Plan Offset</p>
                <p className="text-3xl font-bold text-emerald-600 mb-1">{touBillOffset.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(touBeforeBill)} → {formatCurrency(Math.abs(touAfterBill))}
                  {touAfterBill < 0 && ' (credit balance)'}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, touBillOffset)}%` }}
                  />
                </div>
              </div>
            )}
                {isUloSelected && ulo && (
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 mb-1">ULO Plan Offset</p>
                <p className="text-3xl font-bold text-emerald-600 mb-1">{uloBillOffset.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(uloBeforeBill)} → {formatCurrency(Math.abs(uloAfterBill))}
                  {uloAfterBill < 0 && ' (credit balance)'}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, uloBillOffset)}%` }}
                  />
                </div>
              </div>
            )}
                {isTieredSelected && tiered && (
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <p className="text-xs text-gray-600 mb-1">Tiered Plan Offset</p>
                    <p className="text-3xl font-bold text-emerald-600 mb-1">{tieredBillOffset.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(tieredBeforeBill)} → {formatCurrency(Math.abs(tieredAfterBill))}
                      {tieredAfterBill < 0 && ' (credit balance)'}
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, tieredBillOffset)}%` }}
                      />
                    </div>
                  </div>
                )}
          </div>
        </div>
      )}

      {/* Detailed Plan View (selected plan only) - full width cards */}
      <div className="space-y-6">
        {/* TOU Results */}
        {isTouSelected && tou && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-navy-900">Time-of-Use (TOU)</h3>
              {bestPlan === 'TOU' && (
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Best Value
                </span>
              )}
            </div>

            {/* Annual Summary */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Annual Export Credits</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(tou.annual.exportCredits)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Bill Offset</p>
                  <p className="text-2xl font-bold text-red-600">
                    {touBillOffset.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {/* Before/After Comparison */}
              <div className="bg-white rounded-lg p-3 mb-4 border border-red-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Annual Bill Comparison</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Before Solar:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(touBeforeBill)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">After Credits:</span>
                    <span className={`text-sm font-bold ${touAfterBill < 0 ? 'text-green-600' : 'text-navy-900'}`}>
                      {formatCurrency(Math.abs(touAfterBill))}
                      {touAfterBill < 0 && ' (credit)'}
                    </span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-green-700">Annual Savings:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(Math.max(0, touBeforeBill - touAfterBill))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Energy Offset */}
              <div className="pt-4 border-t border-red-200">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-600">Energy Coverage</p>
                  <p className="text-sm font-bold text-navy-900">{touEnergyOffset.toFixed(1)}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, touEnergyOffset)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatKwh(tou.annual.totalSolarProduction)} produced / {formatKwh(tou.annual.totalLoad)} used
                </p>
              </div>
            </div>

            {/* Export by Period */}
            {tou.byPeriod && tou.byPeriod.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BarChart3 size={16} />
                  Export Credits by Period
                </h4>
                <div className="space-y-2">
                  {tou.byPeriod.map((period, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {period.period.replace('-', ' ')}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-navy-900">
                          {formatCurrency(period.exportCredits)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatKwh(period.kwhExported)} exported
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Production vs Usage */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Production vs Usage</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Production</span>
                  <span className="font-medium">{formatKwh(tou.annual.totalSolarProduction)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Usage</span>
                  <span className="font-medium">{formatKwh(tou.annual.totalLoad)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Exported</span>
                  <span className="font-medium text-green-600">{formatKwh(tou.annual.totalExported)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Imported</span>
                  <span className="font-medium text-orange-600">{formatKwh(tou.annual.totalImported)}</span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {tou.warnings && tou.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">Important Notes</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      {tou.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ULO Results */}
        {isUloSelected && ulo && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-navy-900">Ultra-Low Overnight (ULO)</h3>
              {bestPlan === 'ULO' && (
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Best Value
                </span>
              )}
            </div>

            {/* Annual Summary */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Annual Export Credits</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(ulo.annual.exportCredits)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Bill Offset</p>
                  <p className="text-2xl font-bold text-red-600">
                    {uloBillOffset.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {/* Before/After Comparison */}
              <div className="bg-white rounded-lg p-3 mb-4 border border-red-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Annual Bill Comparison</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Before Solar:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(uloBeforeBill)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">After Credits:</span>
                    <span className={`text-sm font-bold ${uloAfterBill < 0 ? 'text-green-600' : 'text-navy-900'}`}>
                      {formatCurrency(Math.abs(uloAfterBill))}
                      {uloAfterBill < 0 && ' (credit)'}
                    </span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-green-700">Annual Savings:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(Math.max(0, uloBeforeBill - uloAfterBill))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Energy Offset */}
              <div className="pt-4 border-t border-red-200">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-600">Energy Coverage</p>
                  <p className="text-sm font-bold text-navy-900">{uloEnergyOffset.toFixed(1)}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, uloEnergyOffset)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatKwh(ulo.annual.totalSolarProduction)} produced / {formatKwh(ulo.annual.totalLoad)} used
                </p>
              </div>
            </div>

            {/* Export by Period */}
            {ulo.byPeriod && ulo.byPeriod.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BarChart3 size={16} />
                  Export Credits by Period
                </h4>
                <div className="space-y-2">
                  {ulo.byPeriod.map((period, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {period.period.replace('-', ' ')}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-navy-900">
                          {formatCurrency(period.exportCredits)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatKwh(period.kwhExported)} exported
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Production vs Usage */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Production vs Usage</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Production</span>
                  <span className="font-medium">{formatKwh(ulo.annual.totalSolarProduction)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Usage</span>
                  <span className="font-medium">{formatKwh(ulo.annual.totalLoad)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Exported</span>
                  <span className="font-medium text-green-600">{formatKwh(ulo.annual.totalExported)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Imported</span>
                  <span className="font-medium text-orange-600">{formatKwh(ulo.annual.totalImported)}</span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {ulo.warnings && ulo.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">Important Notes</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      {ulo.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tiered Results (simplified view) */}
        {isTieredSelected && tiered && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-navy-900">Tiered (Flat Rate)</h3>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Annual Export Credits</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(tiered.annual.exportCredits)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Bill Offset</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tieredBillOffset.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 mb-4 border border-red-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Annual Bill Comparison</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Before Solar:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(tieredBeforeBill)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">After Credits:</span>
                    <span
                      className={`text-sm font-bold ${
                        tieredAfterBill < 0 ? 'text-green-600' : 'text-navy-900'
                      }`}
                    >
                      {formatCurrency(Math.abs(tieredAfterBill))}
                      {tieredAfterBill < 0 && ' (credit)'}
                    </span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-green-700">Annual Savings:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(Math.max(0, tieredBeforeBill - tieredAfterBill))}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-red-200">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-600">Energy Coverage</p>
                    <p className="text-sm font-bold text-navy-900">
                      {tieredEnergyOffset.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.min(100, tieredEnergyOffset)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatKwh(tiered.annual.totalSolarProduction)} produced / {formatKwh(tiered.annual.totalLoad)} used
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Summary */}
      {(tou?.monthly || ulo?.monthly || tiered?.monthly) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Monthly Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Month</th>
                  {isTouSelected && tou && (
                    <>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">TOU Net Bill</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">TOU Credits</th>
                    </>
                  )}
                  {isUloSelected && ulo && (
                    <>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">ULO Net Bill</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">ULO Credits</th>
                    </>
                  )}
                  {isTieredSelected && tiered && (
                    <>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Tiered Net Bill</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Tiered Credits</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const touMonth = tou?.monthly?.find(m => m.month === month)
                  const uloMonth = ulo?.monthly?.find(m => m.month === month)
                  const tieredMonth = tiered?.monthly?.find(m => m.month === month)
                  
                  return (
                    <tr key={month} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-700">{MONTH_NAMES[month - 1]}</td>
                      {isTouSelected && tou && (
                        <>
                        <td className="text-right py-2 px-3 text-gray-900">
                          {touMonth ? formatCurrency(touMonth.netBill) : '-'}
                        </td>
                          <td className="text-right py-2 px-3 text-green-600">
                            {touMonth ? formatCurrency(touMonth.exportCredits) : '-'}
                          </td>
                        </>
                      )}
                      {isUloSelected && ulo && (
                        <>
                        <td className="text-right py-2 px-3 text-gray-900">
                          {uloMonth ? formatCurrency(uloMonth.netBill) : '-'}
                        </td>
                        <td className="text-right py-2 px-3 text-green-600">
                            {uloMonth ? formatCurrency(uloMonth.exportCredits) : '-'}
                        </td>
                        </>
                      )}
                      {isTieredSelected && tiered && (
                        <>
                          <td className="text-right py-2 px-3 text-gray-900">
                            {tieredMonth ? formatCurrency(tieredMonth.netBill) : '-'}
                          </td>
                        <td className="text-right py-2 px-3 text-green-600">
                            {tieredMonth ? formatCurrency(tieredMonth.exportCredits) : '-'}
                        </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

