'use client'

import { useCallback } from 'react'
import { ElectricityBillInflationCalculator } from '../../StepEnergySimple/components/ElectricityBillInflationCalculator'
import type { EnergyUsageVerificationProps } from '../types'

export function EnergyUsageVerification({ formData, setFormData, data }: EnergyUsageVerificationProps) {
  // Handle annualEscalator changes from the calculator
  const handleAnnualEscalatorChange = useCallback((value: number) => {
    setFormData(prev => ({ ...prev, annualEscalator: value }))
  }, [setFormData])
  return (
    <div>
      <h3 className="text-xl font-semibold text-navy-500 mb-4">Verify Your Energy Usage</h3>
      
      {/* Show calculated usage from appliances */}
      {data.energyUsage && (
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-navy-500 mb-3">Calculated from Your Appliances</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">Daily</div>
              <div className="text-xl font-bold text-blue-600">{data.energyUsage.dailyKwh}</div>
              <div className="text-xs text-gray-500">kWh</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Monthly</div>
              <div className="text-xl font-bold text-teal-600">{data.energyUsage.monthlyKwh.toLocaleString()}</div>
              <div className="text-xs text-gray-500">kWh</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Annual</div>
              <div className="text-xl font-bold text-navy-600">{data.energyUsage.annualKwh.toLocaleString()}</div>
              <div className="text-xs text-gray-500">kWh</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-1 gap-6">
        {/* Monthly Bill */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Average Monthly Electricity Bill *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.monthlyBill}
              onChange={(e) => setFormData({ ...formData, monthlyBill: e.target.value })}
              placeholder="150"
              required
              className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Check a recent electricity bill to verify the calculated usage matches your costs</p>
        </div>
      </div>

      {/* Electricity Bill Inflation Calculator */}
      {formData.monthlyBill && Number(formData.monthlyBill) > 0 && (
        <div className="mt-6">
          <ElectricityBillInflationCalculator 
            monthlyBill={Number(formData.monthlyBill)}
            annualEscalator={formData.annualEscalator}
            onAnnualEscalatorChange={handleAnnualEscalatorChange}
          />
        </div>
      )}
    </div>
  )
}

