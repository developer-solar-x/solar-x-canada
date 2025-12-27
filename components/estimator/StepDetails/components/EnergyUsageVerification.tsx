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

      {/* EV & Electrification Future Planning */}
      <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-300 rounded-lg">
        <h4 className="font-semibold text-navy-500 mb-3 flex items-center gap-2">
          <span>⚡</span>
          <span>Future Electrification Plans</span>
        </h4>
        <p className="text-sm text-gray-700 mb-4">
          Planning ahead? Adding these to your energy profile ensures your solar system is sized appropriately.
        </p>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.hasEV || false}
              onChange={(e) => setFormData({ ...formData, hasEV: e.target.checked })}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                Electric Vehicle (EV)
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Adds ~3,000-4,000 kWh/year to your usage
              </div>
            </div>
          </label>
          
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.hasElectricHeating || false}
              onChange={(e) => setFormData({ ...formData, hasElectricHeating: e.target.checked })}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                Electric Heating / Heat Pump
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Adds ~5,000-8,000 kWh/year to your usage
              </div>
            </div>
          </label>
        </div>
        {(formData.hasEV || formData.hasElectricHeating) && (
          <div className="mt-3 p-3 bg-white border border-blue-200 rounded text-xs text-blue-800">
            <strong>Note:</strong> Your estimated usage will be increased to account for these additions. 
            This ensures your solar system is sized to handle future energy needs.
          </div>
        )}
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

