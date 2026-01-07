'use client'

// Interactive Alberta Solar Club Savings Breakdown Component

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Zap, Leaf, Info, ChevronDown, ChevronUp, ArrowUp, Lightbulb, AlertTriangle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts'

interface AlbertaSavingsBreakdownProps {
  result: any // AlbertaSolarClubResult
  systemSizeKw: number
  annualUsageKwh: number
  monthlyBill?: number
  onUpsizeSystem?: (newPanels: number) => void // Callback to update system size
  currentPanels?: number // Current number of panels
  hideInfoCallout?: boolean
  hideRateSwitching?: boolean
  hideUpsizing?: boolean
  systemCost?: number // Total system cost for payback calculation
}

export function AlbertaSavingsBreakdown({ result, systemSizeKw, annualUsageKwh, monthlyBill, onUpsizeSystem, currentPanels, hideInfoCallout = false, hideRateSwitching = false, hideUpsizing = false, systemCost }: AlbertaSavingsBreakdownProps) {
  const [expandedSection, setExpandedSection] = useState<'high' | 'low' | 'benefits' | null>('high')
  
  if (!result?.alberta) {
    return null
  }
  
  const alberta = result.alberta
  const annual = result.annual
  const LOW_IMPORT_RATE = 0.0689 // 6.89¢/kWh
  
  // Calculate savings using Alberta Solar Club baseline (6.89¢/kWh for all usage)
  // Baseline bill = what they would pay without solar at the Solar Club import rate
  const baselineBill = annualUsageKwh * LOW_IMPORT_RATE
  const exportCredits = annual.exportCredits
  const netBill = annual.netAnnualBill
  const annualSavings = baselineBill - netBill
  const savingsPercent = baselineBill > 0 ? (annualSavings / baselineBill) * 100 : 0
  
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
  
  // Net Bill Reduction (homeowner-friendly metric)
  // Shows how much better off they are vs. pre-solar bill
  const netBillReduction = preSolarAnnualBill && preSolarAnnualBill > 0
    ? ((preSolarAnnualBill - netBill) / preSolarAnnualBill) * 100
    : 0
  
  // Confidence Range (±10% for weather and usage variance)
  const savingsMin = annualSavings * 0.9
  const savingsMax = annualSavings * 1.1
  
  // Credit-to-Import Ratio (technical metric)
  const creditToImportRatio = annual.importCost > 0 ? (exportCredits / annual.importCost) * 100 : 100
  
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
  
  // Calculate payback period with 4.5% annual electricity rate escalation
  // As electricity costs rise each year, savings also increase, making payback shorter
  const totalSystemCost = systemCost || (systemSizeKw * 2500)
  const escalationRate = 0.045 // 4.5% annual rate increase
  const paybackYears = useMemo(() => {
    if (annualSavings <= 0 || totalSystemCost <= 0) return 999
    
    let cumulativeSavings = 0
    for (let year = 1; year <= 25; year++) {
      const yearSavings = annualSavings * Math.pow(1 + escalationRate, year - 1)
      cumulativeSavings += yearSavings
      if (cumulativeSavings >= totalSystemCost) {
        const prevCumulative = cumulativeSavings - yearSavings
        const remaining = totalSystemCost - prevCumulative
        const fraction = remaining / yearSavings
        return (year - 1) + fraction
      }
    }
    return 999
  }, [annualSavings, totalSystemCost])
  
  // Prepare monthly chart data
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const highProductionMonths = [3, 4, 5, 6, 7, 8] // Apr-Sep (0-indexed: 3-8)
    
    if (result.monthly && result.monthly.length === 12) {
      return result.monthly.map((month: any, idx: number) => {
        // Get monthly production and usage from monthly result
        // MonthlyNetMeteringResult has totalSolarProduction and totalLoad
        const monthlyProduction = month.totalSolarProduction || 0
        const monthlyUsage = month.totalLoad || 0
        
        // Determine if this is high production season (Apr-Sep)
        const isHighSeason = highProductionMonths.includes(idx)
        
        return {
          month: monthNames[idx],
          production: Math.round(monthlyProduction),
          usage: Math.round(monthlyUsage),
          season: isHighSeason ? 'high' : 'low',
          monthIndex: idx
        }
      })
    }
    
    // Fallback: use annual data to estimate monthly distribution
    const annualProduction = annual.totalSolarProduction || 0
    const annualUsage = annualUsageKwh || 0
    
    // Typical monthly distribution for production (higher in summer)
    const productionDistribution = [0.03, 0.05, 0.07, 0.10, 0.12, 0.13, 0.13, 0.12, 0.10, 0.07, 0.05, 0.03]
    // Typical monthly distribution for usage (higher in winter/summer)
    const usageDistribution = [0.11, 0.10, 0.085, 0.07, 0.065, 0.075, 0.095, 0.095, 0.075, 0.07, 0.08, 0.095]
    
    return monthNames.map((monthName, idx) => ({
      month: monthName,
      production: Math.round(annualProduction * productionDistribution[idx]),
      usage: Math.round(annualUsage * usageDistribution[idx]),
      season: highProductionMonths.includes(idx) ? 'high' : 'low',
      monthIndex: idx
    }))
  }, [result.monthly, result, annual, annualUsageKwh])
  
  return (
    <div className="space-y-4">
      {/* "Why This Is Different" Callout */}
      {!hideInfoCallout && (
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-300 rounded-xl p-4 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
            <Info className="text-white" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Alberta-Optimized Calculator</h4>
            <p className="text-sm text-blue-800">
              Unlike generic calculators, this model includes Alberta Solar Club seasonal rates (33¢/kWh export, 6.89¢/kWh import), 
              credit banking, month-to-month rollover, and local weather patterns.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Annual Savings Summary Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-amber-900 mb-1">Your Annual Savings</h3>
            <p className="text-sm text-amber-700">With Alberta Solar Club</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-amber-600">
              {formatCurrency(savingsMin)} – {formatCurrency(savingsMax)}
            </div>
            <div className="text-xs text-amber-600 mt-1 flex items-center justify-end gap-1">
              <InfoTooltip content="Range accounts for weather variations (±5%) and usage changes (±5%). Actual savings depend on your consumption patterns and weather conditions." />
              <span>Estimated range</span>
            </div>
            <div className="text-sm text-amber-700 mt-1">
              {netBillReduction > 0 ? `${netBillReduction.toFixed(0)}% net bill reduction` : ''}
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

      {/* Monthly Production vs Usage Chart */}
      {monthlyChartData.length === 12 && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Monthly Production vs Usage</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  width={45}
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: number) => `${value.toLocaleString()} kWh`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'production') return 'Solar Production'
                    if (value === 'usage') return 'Energy Usage'
                    return value
                  }}
                />
                <Bar 
                  dataKey="production" 
                  name="production"
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyChartData.map((entry: { season: string; month: string; production: number; usage: number; exportCredits: number; importCost: number }, index: number) => (
                    <Cell key={`cell-production-${index}`} fill={entry.season === 'high' ? '#f59e0b' : '#fbbf24'} />
                  ))}
                </Bar>
                <Bar 
                  dataKey="usage" 
                  name="usage"
                  fill="#6b7280" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rate Switching Reminder - Critical for Alberta Solar Club */}
      {!hideRateSwitching && (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-5 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
            <AlertTriangle className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-orange-900 mb-2">Important: Rate Switching Required</h4>
            <p className="text-sm text-orange-800 mb-3">
              <strong>These savings assume you switch to the high export rate in April and low import rate in October.</strong> 
              Solar Club Alberta requires manual rate changes to maximize your benefits.
            </p>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="text-xs text-orange-900 space-y-1">
                <div className="flex justify-between items-center">
                  <span><strong>High Production Season (Apr-Sep):</strong></span>
                  <span className="text-emerald-600 font-semibold">Switch to 33¢/kWh export rate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Low Production Season (Oct-Mar):</strong></span>
                  <span className="text-blue-600 font-semibold">Switch to 6.89¢/kWh import rate</span>
                </div>
                <div className="mt-2 pt-2 border-t border-orange-200 text-red-600 font-semibold">
                  ⚠️ Forgetting to switch could reduce your savings by $300-500/year
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Credit Expiry Warning (if year-end credits are high) */}
      {result.monthly && result.monthly.length > 0 && result.monthly[result.monthly.length - 1]?.creditRollover > 500 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg flex-shrink-0">
              <Clock className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-900 mb-2">Credit Expiry Notice</h4>
              <p className="text-sm text-yellow-800 mb-2">
                You have <strong>{formatCurrency(result.monthly[result.monthly.length - 1].creditRollover)}</strong> in banked credits at year-end. 
                <strong className="text-red-600"> Credits expire after 12 months if unused.</strong>
              </p>
              <div className="text-xs text-yellow-700 bg-white rounded p-2 border border-yellow-200">
                <strong>Example:</strong> Credits earned in April 2024 expire in March 2025. Make sure your system is sized to use credits annually, 
                or consider sizing down slightly to avoid losing value.
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Upsizing Suggestion for Alberta Solar Club */}
      {!hideUpsizing && isUndersized && suggestedUpsizePanels && onUpsizeSystem && (
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


