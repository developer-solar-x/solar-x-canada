'use client'

import { Battery, DollarSign, PiggyBank, Clock, TrendingUp, AlertTriangle, Info, CheckCircle, Repeat, Zap, Shield } from 'lucide-react'
import type { SelectedBatterySummaryProps } from '../types'

export function SelectedBatterySummary({ 
  comparison, 
  annualUsageKwh 
}: SelectedBatterySummaryProps) {
  return (
    <div className="card p-6 border-2 border-red-500 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
            <Battery size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">SELECTED</span>
            </div>
            <h3 className="text-xl font-bold text-navy-500">
              {comparison.battery.brand} {comparison.battery.model}
            </h3>
            <p className="text-sm text-gray-600">{comparison.battery.usableKwh} kWh Usable Capacity</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-navy-50 to-navy-100 p-4 rounded-xl border border-navy-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-navy-500" size={16} />
            <div className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Net Cost</div>
          </div>
          <div className="text-2xl font-bold text-navy-600">
            ${comparison.multiYearProjection.netCost.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 mt-1">After rebates</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="text-blue-600" size={16} />
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Year 1 Savings</div>
          </div>
          <div className={`text-2xl font-bold ${comparison.firstYearAnalysis.totalSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">{(comparison.firstYearAnalysis.totalSavings / 12).toFixed(0)}/month</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-gray-600" size={16} />
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Payback</div>
          </div>
          <div className="text-2xl font-bold text-gray-700">
            {comparison.metrics.paybackYears > 0 && comparison.metrics.paybackYears < 100 ? `${comparison.metrics.paybackYears.toFixed(1)}y` : 'N/A'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {comparison.metrics.paybackYears > 0 && comparison.metrics.paybackYears < 100 ? 'Break-even period' : 'Not profitable'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-red-600" size={16} />
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">25-Year Total</div>
          </div>
          <div className={`text-2xl font-bold ${comparison.multiYearProjection.netProfit25Year >= 0 ? 'text-navy-600' : 'text-red-600'}`}>
            ${comparison.multiYearProjection.netProfit25Year.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 mt-1">Net profit</div>
        </div>
      </div>
      
      {/* Profitability Check */}
      {comparison.firstYearAnalysis.totalSavings < 0 && (
        <div className="mt-4 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800 mb-2">
                Battery Not Cost-Effective with Current Usage Pattern
              </p>
              <p className="text-sm text-red-700 mb-3">
                Based on your usage pattern, the battery would cost more to operate than it saves. Batteries work best when you have high usage during peak hours (4PM-9PM on weekdays).
              </p>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-900 mb-2">Consider these options:</p>
                <ul className="text-sm text-red-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Moving high-energy appliances (EV charging, pool, hot tub) to peak hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Increasing overall usage to 18,000+ kWh/year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Confirming you're on ULO or TOU rates (not flat rate)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>A grid-tied solar system without battery may be more economical</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Metrics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-navy-50 rounded-lg p-3 border border-navy-100">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="text-navy-500" size={14} />
            <span className="text-xs font-semibold text-navy-600 uppercase">Cycles/Year</span>
          </div>
          <div className="text-lg font-bold text-navy-600">{comparison.firstYearAnalysis.cyclesPerYear}</div>
          <div className="text-xs text-gray-600">Active days</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="text-blue-500" size={14} />
            <span className="text-xs font-semibold text-blue-600 uppercase">Energy Shifted</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{comparison.firstYearAnalysis.totalKwhShifted.toFixed(0)} kWh</div>
          <div className="text-xs text-gray-600">Per year</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-gray-600" size={14} />
            <span className="text-xs font-semibold text-gray-700 uppercase">Usage Pattern</span>
          </div>
          <div className="text-lg font-bold text-gray-700">{annualUsageKwh.toLocaleString()}</div>
          <div className="text-xs text-gray-600">kWh/year</div>
        </div>
      </div>

      {/* Technical Details Accordion */}
      <details className="mt-4 group">
        <summary className="flex items-center gap-2 text-sm text-navy-500 cursor-pointer hover:text-navy-600 font-semibold">
          <Info size={16} />
          <span>View Technical Details</span>
          <svg className="w-4 h-4 ml-auto transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-semibold text-navy-600 mb-3">Calculation Details</div>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Original Annual Bill:</span>
              <span className="font-semibold text-navy-600">${comparison.firstYearAnalysis.originalAnnualCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Optimized Annual Bill:</span>
              <span className="font-semibold text-blue-600">${comparison.firstYearAnalysis.optimizedAnnualCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Battery Capacity:</span>
              <span className="font-semibold text-navy-600">{comparison.battery.usableKwh} kWh</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Inverter Power:</span>
              <span className="font-semibold text-navy-600">{comparison.battery.inverterKw} kW</span>
            </div>
          </div>
        </div>
      </details>
      
      <div className="mt-5 p-4 bg-navy-50 border border-navy-200 rounded-lg">
        <p className="text-sm text-navy-700 flex items-start gap-2">
          <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
          <span>This battery will be included in your custom quote. You can review all details in the next step.</span>
        </p>
      </div>
    </div>
  )
}

