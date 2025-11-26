'use client'

// Net Metering Results Section for Results Page
// Displays net metering data in a clean, organized format

import { DollarSign, TrendingUp, AlertTriangle, Zap, Calendar, BarChart3 } from 'lucide-react'
import { formatCurrency, formatKwh, formatNumber } from '@/lib/utils'
import type { NetMeteringResult } from '@/lib/net-metering'

interface NetMeteringResultsProps {
  netMeteringData: {
    tou?: NetMeteringResult
    ulo?: NetMeteringResult
  }
  systemSizeKw?: number
  numPanels?: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function NetMeteringResults({ netMeteringData, systemSizeKw, numPanels }: NetMeteringResultsProps) {
  const { tou, ulo } = netMeteringData

  // Use billOffsetPercent from the result if available, otherwise calculate it
  const touBillOffset = tou?.annual.billOffsetPercent ?? (tou?.annual.importCost > 0 
    ? Math.min(100, (tou.annual.exportCredits / tou.annual.importCost) * 100)
    : 100)
  const uloBillOffset = ulo?.annual.billOffsetPercent ?? (ulo?.annual.importCost > 0
    ? Math.min(100, (ulo.annual.exportCredits / ulo.annual.importCost) * 100)
    : 100)
  const bestPlan = touBillOffset > uloBillOffset ? 'TOU' : 'ULO'

  // Calculate energy offset (what % of usage is covered by production)
  const touEnergyOffset = tou?.annual.totalLoad > 0
    ? Math.min(100, (tou.annual.totalSolarProduction / tou.annual.totalLoad) * 100)
    : 0
  const uloEnergyOffset = ulo?.annual.totalLoad > 0
    ? Math.min(100, (ulo.annual.totalSolarProduction / ulo.annual.totalLoad) * 100)
    : 0

  // Calculate before/after bills for comparison
  const touBeforeBill = tou?.annual.importCost ?? 0
  const touAfterBill = tou?.annual.netAnnualBill ?? 0
  const uloBeforeBill = ulo?.annual.importCost ?? 0
  const uloAfterBill = ulo?.annual.netAnnualBill ?? 0

  return (
    <div className="space-y-6">
      {/* Offset Summary - Prominent Display */}
      {(tou || ulo) && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tou && (
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
            {ulo && (
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
          </div>
        </div>
      )}

      {/* System Specifications */}
      {(systemSizeKw || numPanels) && (
        <div className="bg-gradient-to-br from-navy-50 to-slate-50 rounded-lg p-5 border-2 border-navy-200">
          <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Zap className="text-navy-500" size={18} />
            System Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemSizeKw && (
              <div>
                <span className="text-xs text-gray-600">System Size</span>
                <p className="text-2xl font-bold text-navy-900">{formatNumber(systemSizeKw)} kW</p>
              </div>
            )}
            {numPanels && (
              <div>
                <span className="text-xs text-gray-600">Number of Panels</span>
                <p className="text-2xl font-bold text-navy-900">{numPanels} panels</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2-Column Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOU Results */}
        {tou && (
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
        {ulo && (
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
      </div>

      {/* Monthly Breakdown Summary */}
      {(tou?.monthly || ulo?.monthly) && (
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
                  {tou && <th className="text-right py-2 px-3 font-semibold text-gray-700">TOU Net Bill</th>}
                  {ulo && <th className="text-right py-2 px-3 font-semibold text-gray-700">ULO Net Bill</th>}
                  {tou && <th className="text-right py-2 px-3 font-semibold text-gray-700">TOU Credits</th>}
                  {ulo && <th className="text-right py-2 px-3 font-semibold text-gray-700">ULO Credits</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const touMonth = tou?.monthly?.find(m => m.month === month)
                  const uloMonth = ulo?.monthly?.find(m => m.month === month)
                  
                  return (
                    <tr key={month} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-700">{MONTH_NAMES[month - 1]}</td>
                      {tou && (
                        <td className="text-right py-2 px-3 text-gray-900">
                          {touMonth ? formatCurrency(touMonth.netBill) : '-'}
                        </td>
                      )}
                      {ulo && (
                        <td className="text-right py-2 px-3 text-gray-900">
                          {uloMonth ? formatCurrency(uloMonth.netBill) : '-'}
                        </td>
                      )}
                      {tou && (
                        <td className="text-right py-2 px-3 text-green-600">
                          {touMonth ? formatCurrency(touMonth.exportCredits) : '-'}
                        </td>
                      )}
                      {ulo && (
                        <td className="text-right py-2 px-3 text-green-600">
                          {uloMonth ? formatCurrency(uloMonth.exportCredits) : '-'}
                        </td>
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

