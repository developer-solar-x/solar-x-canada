'use client'

// Interactive Alberta Solar Club Savings Breakdown Component

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Zap, Leaf, Info, ChevronDown, ChevronUp, ArrowUp, Lightbulb } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

interface AlbertaSavingsBreakdownProps {
  result: any // AlbertaSolarClubResult
  systemSizeKw: number
  annualUsageKwh: number
  monthlyBill?: number
  onUpsizeSystem?: (newPanels: number) => void // Callback to update system size
  currentPanels?: number // Current number of panels
}

export function AlbertaSavingsBreakdown({ result, systemSizeKw, annualUsageKwh, monthlyBill, onUpsizeSystem, currentPanels }: AlbertaSavingsBreakdownProps) {
  const [expandedSection, setExpandedSection] = useState<'high' | 'low' | 'benefits' | null>('high')
  
  if (!result?.alberta) {
    return null
  }
  
  const alberta = result.alberta
  const annual = result.annual
  const LOW_IMPORT_RATE = 0.0689 // 6.89¢/kWh
  
  // Calculate savings
  const originalBill = annual.importCost
  const exportCredits = annual.exportCredits
  const netBill = annual.netAnnualBill
  const annualSavings = originalBill - netBill
  const savingsPercent = originalBill > 0 ? (annualSavings / originalBill) * 100 : 0
  
  // High production season metrics
  const highSeason = alberta.highProductionSeason
  const highSeasonMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  
  // Low production season metrics
  const lowSeason = alberta.lowProductionSeason
  const lowSeasonMonths = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  const monthlyBillNumber = typeof monthlyBill === 'number'
    ? monthlyBill
    : monthlyBill && !Number.isNaN(Number(monthlyBill))
    ? Number(monthlyBill)
    : undefined

  const preSolarAnnualBill = monthlyBillNumber !== undefined && monthlyBillNumber > 0
    ? monthlyBillNumber * 12
    : annualUsageKwh > 0
    ? annualUsageKwh * LOW_IMPORT_RATE
    : undefined
  
  // Calculate if system could benefit from upsizing
  const energyCoverage = annual.totalLoad > 0 ? (annual.totalSolarProduction / annual.totalLoad) * 100 : 0
  const isUndersized = energyCoverage < 100 && annual.totalSolarProduction < annualUsageKwh
  const currentPanelsCount = currentPanels || Math.round((systemSizeKw * 1000) / 500)
  const suggestedUpsizePanels = isUndersized ? Math.ceil(currentPanelsCount * 1.2) : null // 20% larger
  const suggestedUpsizeKw = suggestedUpsizePanels ? (suggestedUpsizePanels * 500) / 1000 : null
  
  // Estimate benefits of upsizing (rough calculation)
  const estimatedAdditionalProduction = suggestedUpsizeKw && systemSizeKw > 0
    ? (suggestedUpsizeKw - systemSizeKw) * (annual.totalSolarProduction / systemSizeKw)
    : 0
  // Assume 60% of additional production happens in high season and 50% is exported
  const estimatedAdditionalHighSeasonExports = estimatedAdditionalProduction * 0.6 * 0.5
  const estimatedAdditionalCredits = estimatedAdditionalHighSeasonExports * 0.33 // 33¢/kWh
  
  return (
    <div className="space-y-4">
      {/* Annual Savings Summary Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-amber-900 mb-1">Your Annual Savings</h3>
            <p className="text-sm text-amber-700">With Alberta Solar Club</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-amber-600">
              {formatCurrency(annualSavings)}
            </div>
            <div className="text-sm text-amber-700 mt-1">
              {savingsPercent.toFixed(1)}% savings
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="text-xs text-amber-700 mb-1">Pre‑solar bill</div>
            <div className="text-lg font-bold text-gray-800">
              {preSolarAnnualBill !== undefined ? formatCurrency(preSolarAnnualBill) : '—'}
            </div>
            <div className="text-[11px] text-gray-500">
              {preSolarAnnualBill !== undefined
                ? monthlyBillNumber !== undefined
                  ? `$${monthlyBillNumber.toFixed(0)}/mo × 12`
                  : `${Math.round(annualUsageKwh).toLocaleString()} kWh × 6.89¢/kWh`
                : 'No bill/usage provided'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="text-xs text-amber-700 mb-1">Net Annual Bill (after credits)</div>
            <div className="text-lg font-bold text-emerald-600">
              {netBill < 0 ? `-${formatCurrency(Math.abs(netBill))}` : formatCurrency(netBill)}
            </div>
          </div>
        </div>
      </div>

      {/* High Production Season Card */}
      <div className="bg-white rounded-xl border-2 border-amber-300 shadow-md overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'high' ? null : 'high')}
          className="w-full p-5 flex items-center justify-between hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-amber-900">High Production Season</h4>
              <p className="text-sm text-amber-700">
                {highSeasonMonths.join(', ')} • 33.00¢/kWh export rate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(highSeason.exportCredits)}
              </div>
              <div className="text-xs text-amber-700">Export Credits</div>
            </div>
            {expandedSection === 'high' ? (
              <ChevronUp className="text-amber-600" size={20} />
            ) : (
              <ChevronDown className="text-amber-600" size={20} />
            )}
          </div>
        </button>
        
        {expandedSection === 'high' && (
          <div className="px-5 pb-5 space-y-4 border-t border-amber-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-amber-600" size={18} />
                  <span className="text-sm font-semibold text-amber-900">Exported</span>
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {Math.round(highSeason.exportedKwh).toLocaleString()} kWh
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  @ 33.00¢/kWh
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="text-blue-600" size={18} />
                  <span className="text-sm font-semibold text-blue-900">Imported</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round(highSeason.importedKwh).toLocaleString()} kWh
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  @ 6.89¢/kWh
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-4 border border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-amber-900 mb-1">Net Credits This Season</div>
                  <div className="text-xs text-amber-700">
                    Export credits minus import costs
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {formatCurrency(highSeason.exportCredits - highSeason.importCost)}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
              <span>
                During high production months, you export excess solar at the premium rate of 33.00¢/kWh, 
                earning maximum credits to bank for winter months.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Low Production Season Card */}
      <div className="bg-white rounded-xl border-2 border-blue-300 shadow-md overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'low' ? null : 'low')}
          className="w-full p-5 flex items-center justify-between hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingDown className="text-white" size={24} />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-blue-900">Low Production Season</h4>
              <p className="text-sm text-blue-700">
                {lowSeasonMonths.join(', ')} • 6.89¢/kWh import rate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(lowSeason.importCost)}
              </div>
              <div className="text-xs text-blue-700">Import Cost</div>
            </div>
            {expandedSection === 'low' ? (
              <ChevronUp className="text-blue-600" size={20} />
            ) : (
              <ChevronDown className="text-blue-600" size={20} />
            )}
          </div>
        </button>
        
        {expandedSection === 'low' && (
          <div className="px-5 pb-5 space-y-4 border-t border-blue-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="text-blue-600" size={18} />
                  <span className="text-sm font-semibold text-blue-900">Imported</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round(lowSeason.importedKwh).toLocaleString()} kWh
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  @ 6.89¢/kWh
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-amber-600" size={18} />
                  <span className="text-sm font-semibold text-amber-900">Exported</span>
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {Math.round(lowSeason.exportedKwh).toLocaleString()} kWh
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  @ 6.89¢/kWh
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-100 to-sky-100 rounded-lg p-4 border border-blue-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-blue-900 mb-1">Net Cost This Season</div>
                  <div className="text-xs text-blue-700">
                    Import costs minus export credits (offset by banked credits)
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(lowSeason.importCost - lowSeason.exportCredits)}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <span>
                During low production months, you pay the low rate of 6.89¢/kWh for imports and can use 
                banked credits from high production season to offset your bills.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional Benefits Card */}
      <div className="bg-white rounded-xl border-2 border-green-300 shadow-md overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'benefits' ? null : 'benefits')}
          className="w-full p-5 flex items-center justify-between hover:bg-green-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Leaf className="text-white" size={24} />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-green-900">Additional Benefits</h4>
              <p className="text-sm text-green-700">Cash back & carbon credits</p>
            </div>
          </div>
          {expandedSection === 'benefits' ? (
            <ChevronUp className="text-green-600" size={20} />
          ) : (
            <ChevronDown className="text-green-600" size={20} />
          )}
        </button>
        
        {expandedSection === 'benefits' && (
          <div className="px-5 pb-5 space-y-4 border-t border-green-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-green-600" size={18} />
                  <span className="text-sm font-semibold text-green-900">3% Cash Back</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(alberta.cashBackAmount)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  On all imported energy (paid annually)
                </div>
              </div>
              
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="text-emerald-600" size={18} />
                  <span className="text-sm font-semibold text-emerald-900">Carbon Credits</span>
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(alberta.estimatedCarbonCredits)}
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  Estimated annual value
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-300">
              <div className="text-sm font-semibold text-green-900 mb-2">Total Additional Benefits</div>
              <div className="text-3xl font-bold text-green-700">
                {formatCurrency(alberta.cashBackAmount + alberta.estimatedCarbonCredits)}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Per year (cash back + carbon credits)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h5 className="font-semibold text-gray-800 mb-3">Key Financial Metrics</h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Bill Offset</div>
            <div className="text-lg font-bold text-gray-800">
              {annual.billOffsetPercent.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Energy Coverage</div>
            <div className="text-lg font-bold text-gray-800">
              {annual.totalLoad > 0 ? ((annual.totalSolarProduction / annual.totalLoad) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Total Export Credits</div>
            <div className="text-lg font-bold text-emerald-600">
              {formatCurrency(exportCredits)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Year-End Credits</div>
            <div className="text-lg font-bold text-emerald-600">
              {formatCurrency(result.monthly?.[result.monthly.length - 1]?.creditRollover || 0)}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 space-y-1">
          <div className="font-semibold text-gray-800">How we got these numbers</div>
          {preSolarAnnualBill !== undefined && (
            <div>Pre-solar bill: {formatCurrency(preSolarAnnualBill)} (from your input or usage)</div>
          )}
          <div>We simulate solar vs. your usage hourly.</div>
          <div>Imports at 6.89¢/kWh (low season), exports at 33¢/kWh (high season), plus 3% cash back on imports.</div>
          <div>Net annual bill = import cost – export credits – cash back.</div>
        </div>
      </div>

      {/* Upsizing Suggestion for Alberta Solar Club */}
      {isUndersized && suggestedUpsizePanels && onUpsizeSystem && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
              <Lightbulb className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-blue-900 mb-1">Consider Sizing Up Your System</h4>
              <p className="text-sm text-blue-700 mb-3">
                Your system covers {energyCoverage.toFixed(1)}% of your usage. With Alberta Solar Club's premium export rate (33¢/kWh), 
                a larger system could generate more export credits during high production months.
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-blue-700 mb-1">Current System</div>
                    <div className="text-lg font-bold text-gray-800">{systemSizeKw.toFixed(1)} kW</div>
                    <div className="text-xs text-gray-600">{currentPanelsCount} panels</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700 mb-1">Suggested Size</div>
                    <div className="text-lg font-bold text-blue-600">{suggestedUpsizeKw?.toFixed(1)} kW</div>
                    <div className="text-xs text-gray-600">{suggestedUpsizePanels} panels (+{suggestedUpsizePanels - currentPanelsCount})</div>
                  </div>
                </div>
                
                {estimatedAdditionalCredits > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-xs text-blue-700 mb-1">Estimated Additional Annual Credits</div>
                    <div className="text-xl font-bold text-emerald-600">
                      +{formatCurrency(estimatedAdditionalCredits)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      From extra exports at 33¢/kWh during high production months
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => onUpsizeSystem(suggestedUpsizePanels)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUp size={18} />
                Try {suggestedUpsizePanels} Panels ({suggestedUpsizeKw?.toFixed(1)} kW)
              </button>
              
              <div className="mt-3 flex items-start gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                <span>
                  Upsizing helps maximize export credits at the premium 33¢/kWh rate. The extra cost is offset by 
                  increased credits during spring/summer months, which can be banked for winter.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


