'use client'

import { DollarSign, TrendingUp, AlertTriangle, Zap, Calendar } from 'lucide-react'
import { formatCurrency, formatKwh, formatNumber } from '@/lib/utils'
import type { NetMeteringResult } from '@/lib/net-metering'

interface NetMeteringSummaryProps {
  netMeteringData: NetMeteringResult
  ratePlanName?: string
  systemSizeKw?: number
  numPanels?: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function NetMeteringSummary({ netMeteringData, ratePlanName, systemSizeKw, numPanels }: NetMeteringSummaryProps) {
  const { annual, monthly, byPeriod, warnings } = netMeteringData

  // Calculate bill offset percentage with proper handling
  const billOffsetPercent = annual.importCost > 0 
    ? Math.min(100, (annual.exportCredits / annual.importCost) * 100)
    : 100

  return (
    <div className="space-y-6">
      {/* System Information */}
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

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Annual Net Metering Credits */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-5 border-2 border-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <DollarSign className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900">Annual Credits</h3>
              <p className="text-xs text-emerald-700">Export credits earned</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-900">
            {formatCurrency(annual.exportCredits)}
          </p>
          <p className="text-sm text-emerald-700 mt-1">
            {formatKwh(annual.totalExported)} exported
          </p>
        </div>

        {/* Bill Offset Percentage */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Bill Offset</h3>
              <p className="text-xs text-blue-700">Percentage of bill covered</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-900">
            {billOffsetPercent.toFixed(1)}%
          </p>
          <p className="text-sm text-blue-700 mt-1">
            {formatCurrency(annual.netAnnualBill)} net annual bill
          </p>
        </div>

        {/* Net Annual Bill */}
        <div className={`bg-gradient-to-br rounded-lg p-5 border-2 ${
          annual.netAnnualBill < 0
            ? 'from-green-50 to-green-100 border-green-200'
            : 'from-orange-50 to-orange-100 border-orange-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              annual.netAnnualBill < 0 ? 'bg-green-500' : 'bg-orange-500'
            }`}>
              <Calendar className="text-white" size={20} />
            </div>
            <div>
              <h3 className={`font-bold ${
                annual.netAnnualBill < 0 ? 'text-green-900' : 'text-orange-900'
              }`}>
                Net Annual Bill
              </h3>
              <p className={`text-xs ${
                annual.netAnnualBill < 0 ? 'text-green-700' : 'text-orange-700'
              }`}>
                After credits applied
              </p>
            </div>
          </div>
          <p className={`text-3xl font-bold ${
            annual.netAnnualBill < 0 ? 'text-green-900' : 'text-orange-900'
          }`}>
            {formatCurrency(Math.abs(annual.netAnnualBill))}
          </p>
          {annual.netAnnualBill < 0 && (
            <p className="text-sm text-green-700 mt-1">Credit balance</p>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-800">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Export Credits by Period */}
      {ratePlanName && byPeriod && byPeriod.length > 0 && (
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="text-navy-500" size={18} />
            Export Credits by {ratePlanName} Period
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {byPeriod
              .filter(p => p.kwhExported > 0 || p.exportCredits > 0)
              .map((period) => (
                <div key={period.period} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                    {period.period.replace('-', ' ')}
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-xs text-gray-600">Credits:</span>
                      <p className="text-lg font-bold text-emerald-700">
                        {formatCurrency(period.exportCredits)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Exported:</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatKwh(period.kwhExported)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Monthly Breakdown Chart */}
      <div className="bg-white rounded-lg p-5 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="text-navy-500" size={18} />
          Monthly Bill Impact
        </h3>
        <div className="space-y-3">
          {monthly.map((monthData) => {
            const hasCreditRollover = monthData.creditRollover > 0
            const netBillIsNegative = monthData.importCost - monthData.exportCredits < 0
            
            return (
              <div key={monthData.month} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{MONTH_NAMES[monthData.month - 1]}</span>
                    {hasCreditRollover && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Rollover: {formatCurrency(monthData.creditRollover)}
                      </span>
                    )}
                  </div>
                  <div className={`text-lg font-bold ${
                    netBillIsNegative ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    {netBillIsNegative ? '-' : ''}{formatCurrency(Math.abs(monthData.netBill))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 text-xs">Solar Production</span>
                    <p className="font-semibold text-gray-900">{formatKwh(monthData.totalSolarProduction)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Usage</span>
                    <p className="font-semibold text-gray-900">{formatKwh(monthData.totalLoad)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Exported</span>
                    <p className="font-semibold text-emerald-700">{formatKwh(monthData.totalExported)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Credits</span>
                    <p className="font-semibold text-emerald-700">{formatCurrency(monthData.exportCredits)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Annual Summary Stats */}
      <div className="bg-gradient-to-br from-navy-50 to-slate-50 rounded-lg p-5 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Annual Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-gray-600">Solar Production</span>
            <p className="text-lg font-bold text-navy-900">{formatKwh(annual.totalSolarProduction)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-600">Total Usage</span>
            <p className="text-lg font-bold text-navy-900">{formatKwh(annual.totalLoad)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-600">Total Exported</span>
            <p className="text-lg font-bold text-emerald-700">{formatKwh(annual.totalExported)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-600">Total Imported</span>
            <p className="text-lg font-bold text-orange-700">{formatKwh(annual.totalImported)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}



