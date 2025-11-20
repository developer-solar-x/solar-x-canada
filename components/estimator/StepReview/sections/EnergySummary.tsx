'use client'

import { Bolt, Zap, Calendar, TrendingUp } from 'lucide-react'

interface EnergySummaryProps {
  energyUsage?: {
    annualKwh: number
    dailyKwh: number
    monthlyKwh: number
  }
  appliances?: any[]
  monthlyBill?: number | string
}

export function EnergySummary({ energyUsage, appliances, monthlyBill }: EnergySummaryProps) {
  return (
    <div className="card p-5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-navy-500 rounded-lg">
          <Bolt className="text-white" size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-navy-500 mb-0.5">Energy Usage</h3>
          <p className="text-xs text-gray-600">Current consumption data</p>
        </div>
      </div>

      {/* Annual usage highlight */}
      {energyUsage && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 mb-3 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-100 mb-1">Annual Electricity Use</p>
              <p className="text-3xl font-bold">
                {energyUsage.annualKwh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-semibold">kWh</span>
              </p>
            </div>
            <div className="text-5xl opacity-20">⚡</div>
          </div>
        </div>
      )}

      {/* Monthly Bill */}
      {monthlyBill && (typeof monthlyBill === 'string' ? parseFloat(monthlyBill) > 0 : monthlyBill > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-red-500" />
            <span className="text-xs text-gray-600 font-medium">Average Monthly Bill</span>
          </div>
          <p className="text-xl font-bold text-navy-500">
            ${typeof monthlyBill === 'string' ? parseFloat(monthlyBill).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : monthlyBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {/* Consumption breakdown */}
      {energyUsage && (
        <div className="space-y-2 mb-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Zap size={12} className="text-red-500" />
                  <span className="text-xs text-gray-600 font-medium">Daily</span>
                </div>
                <p className="text-base font-bold text-navy-500">
                  {energyUsage.dailyKwh.toFixed(2)} <span className="text-xs font-normal">kWh</span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Calendar size={12} className="text-red-500" />
                  <span className="text-xs text-gray-600 font-medium">Monthly</span>
                </div>
                <p className="text-base font-bold text-navy-500">
                  {energyUsage.monthlyKwh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">kWh</span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp size={12} className="text-red-500" />
                  <span className="text-xs text-gray-600 font-medium">Annual</span>
                </div>
                <p className="text-base font-bold text-navy-500">
                  {energyUsage.annualKwh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">kWh</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special appliances indicator */}
      {appliances && appliances.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-900">
                High-Consumption Appliances
              </p>
              <p className="text-xs text-red-700">
                {appliances.length} active {appliances.length === 1 ? 'appliance' : 'appliances'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

