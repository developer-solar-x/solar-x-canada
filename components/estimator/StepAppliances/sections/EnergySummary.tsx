'use client'

import { Calculator } from 'lucide-react'
import type { EnergySummaryProps } from '../types'

export function EnergySummary({
  totalDailyKwh,
  totalMonthlyKwh,
  totalAnnualKwh,
  activeApplianceCount,
  onContinue,
  onBack,
}: EnergySummaryProps) {
  return (
    <div className="card p-6 sticky top-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="text-red-500" size={24} />
        <h3 className="font-bold text-navy-500">Energy Summary</h3>
      </div>

      <div className="space-y-4">
        {/* Daily usage */}
        <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Daily Usage</div>
          <div className="text-3xl font-bold text-red-500">
            {totalDailyKwh.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">kWh per day</div>
        </div>

        {/* Monthly usage */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Monthly Usage</div>
          <div className="text-2xl font-bold text-blue-500">
            {totalMonthlyKwh.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">kWh per month</div>
        </div>

        {/* Annual usage */}
        <div className="bg-gradient-to-br from-teal-50 to-white p-4 rounded-lg border border-teal-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Annual Usage</div>
          <div className="text-2xl font-bold text-teal-500">
            {totalAnnualKwh.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">kWh per year</div>
        </div>

        {/* Active appliances count */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Active Appliances</div>
          <div className="text-lg font-bold text-navy-500">
            {activeApplianceCount} items
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 mt-6">
        <button
          onClick={onContinue}
          className="btn-primary w-full"
        >
          Continue to System Design
        </button>
        
        {onBack && (
          <button
            onClick={onBack}
            className="btn-outline border-gray-300 text-gray-700 w-full"
          >
            Back
          </button>
        )}
      </div>

      {/* Tip */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-xs text-blue-800">
          <strong className="text-navy-500">Pro Tip:</strong> Set future appliances (like EVs) to quantity 1 to ensure your solar system can handle growth.
        </div>
      </div>
    </div>
  )
}

