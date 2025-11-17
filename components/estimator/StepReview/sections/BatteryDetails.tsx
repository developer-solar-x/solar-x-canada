'use client'

import { Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BatteryDetailsProps {
  batteryDetails: {
    battery: {
      brand: string
      model: string
      usableKwh: number
      price: number
    }
    firstYearAnalysis: {
      totalSavings: number
      totalKwhShifted: number
      cyclesPerYear: number
    }
    multiYearProjection: {
      netCost: number
      netProfit25Year: number
    }
    metrics: {
      paybackYears: number
    }
  }
  peakShaving?: any
}

export function BatteryDetails({ batteryDetails, peakShaving }: BatteryDetailsProps) {
  return (
    <div className="card p-6 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-navy-500 rounded-lg">
            <Zap className="text-white" size={22} />
          </div>
          <div>
            <h3 className="font-bold text-navy-500 mb-0.5 flex items-center gap-2">
              Battery Energy Storage
              {batteryDetails.firstYearAnalysis.totalSavings >= 0 ? (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  ✓ Profitable
                </span>
              ) : (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  ⚠ Review Needed
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-600">
              {batteryDetails.battery.brand} {batteryDetails.battery.model} • {batteryDetails.battery.usableKwh} kWh usable
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">25-Year Profit</div>
          <div className={`text-2xl font-bold ${batteryDetails.multiYearProjection.netProfit25Year >= 0 ? 'text-navy-500' : 'text-gray-500'}`}>
            {batteryDetails.multiYearProjection.netProfit25Year >= 0 ? '+' : ''}
            {formatCurrency(batteryDetails.multiYearProjection.netProfit25Year)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Battery Cost */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Battery Cost</div>
          <div className="text-lg font-bold text-navy-500">
            {formatCurrency(batteryDetails.battery.price)}
          </div>
        </div>

        {/* Rebate */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Rebate</div>
          <div className="text-lg font-bold text-green-600">
            -{formatCurrency(batteryDetails.battery.price - batteryDetails.multiYearProjection.netCost)}
          </div>
        </div>

        {/* Net Cost */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Net Cost</div>
          <div className="text-lg font-bold text-navy-500">
            {formatCurrency(batteryDetails.multiYearProjection.netCost)}
          </div>
        </div>

        {/* Year 1 Savings */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Year 1 Savings</div>
          <div className={`text-lg font-bold ${batteryDetails.firstYearAnalysis.totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {batteryDetails.firstYearAnalysis.totalSavings >= 0 ? '+' : ''}
            {formatCurrency(Math.round(batteryDetails.firstYearAnalysis.totalSavings))}
          </div>
        </div>

        {/* Payback */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Payback Period</div>
          <div className="text-lg font-bold text-navy-500">
            {batteryDetails.metrics.paybackYears > 0 && batteryDetails.metrics.paybackYears < 100 
              ? `${batteryDetails.metrics.paybackYears.toFixed(1)} yrs`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* How it works explanation */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-navy-500">Peak Shaving:</span> Battery charges during cheap hours 
          ({peakShaving?.ratePlan === 'ulo' ? '3.9¢/kWh overnight' : 'off-peak rates'}), 
          discharges during expensive peak hours 
          ({peakShaving?.ratePlan === 'ulo' ? '39.1¢/kWh evenings' : 'on-peak rates'}). 
          Shifts {Math.round(batteryDetails.firstYearAnalysis.totalKwhShifted).toLocaleString()} kWh annually 
          with {batteryDetails.firstYearAnalysis.cyclesPerYear} cycles/year.
        </p>
      </div>
    </div>
  )
}

