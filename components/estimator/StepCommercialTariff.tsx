'use client'

// Commercial Step 1: Tariff & Meter Inputs

import { useState } from 'react'
import { ArrowRight, Info } from 'lucide-react'
import type { BillingMethod } from '@/lib/commercial-calculator'

interface StepCommercialTariffProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
}

export function StepCommercialTariff({ data, onComplete, onBack }: StepCommercialTariffProps) {
  const [billingMethod, setBillingMethod] = useState<BillingMethod>(
    data.billingMethod || 'Per kW'
  )
  const [demandRate, setDemandRate] = useState<number>(
    data.demandRatePerUnit30d || 0
  )
  const [measuredPeakKVA, setMeasuredPeakKVA] = useState<number>(
    data.measuredPeakKVA || 0
  )
  const [currentPF, setCurrentPF] = useState<number>(
    data.currentPF || 0.9
  )
  const [targetPF, setTargetPF] = useState<number>(
    data.targetPF || 0.95
  )

  const handleContinue = () => {
    if (!demandRate || demandRate <= 0) {
      alert('Please enter a valid demand rate')
      return
    }
    if (!measuredPeakKVA || measuredPeakKVA <= 0) {
      alert(`Please enter measured peak ${billingMethod === 'Per kW' ? 'kW' : 'kVA'} (or upload Green Button file)`)
      return
    }
    if (currentPF < 0.5 || currentPF > 1.0) {
      alert('Current power factor must be between 0.5 and 1.0')
      return
    }
    if (targetPF < currentPF || targetPF > 1.0) {
      alert('Target power factor must be greater than current PF and ≤ 1.0')
      return
    }

    onComplete({
      billingMethod,
      demandRatePerUnit30d: demandRate,
      measuredPeakKVA,
      currentPF,
      targetPF,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Tariff & Meter Information
        </h1>
        <p className="text-gray-600">
          Enter your utility billing method and current power factor
        </p>
      </div>

      <div className="card space-y-6">
        {/* Billing Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Billing Method <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['Per kVA', 'Per kW', 'Max(kW, 0.9×kVA)'] as BillingMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setBillingMethod(method)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  billingMethod === method
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-navy-500">{method}</div>
                {method === 'Max(kW, 0.9×kVA)' && (
                  <div className="text-xs text-gray-500 mt-1">
                    Hydro One style when PF &lt; 90%
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Demand Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Demand Rate ($/unit/30 days) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={demandRate || ''}
              onChange={(e) => setDemandRate(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 15.50"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your utility's demand charge rate per billing period
          </p>
        </div>

        {/* Measured Peak - Dynamic based on billing method */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {billingMethod === 'Per kW' ? 'Measured Peak kW' : 'Measured Peak kVA'} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={measuredPeakKVA || ''}
              onChange={(e) => setMeasuredPeakKVA(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 500"
              step="0.1"
              min="0"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500">{billingMethod === 'Per kW' ? 'kW' : 'kVA'}</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Peak demand from your utility bill, or upload Green Button file to auto-detect
            {billingMethod === 'Per kW' && ' (enter kW value directly)'}
          </p>
        </div>

        {/* Power Factor */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Power Factor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={currentPF}
              onChange={(e) => setCurrentPF(parseFloat(e.target.value) || 0)}
              placeholder="0.90"
              step="0.01"
              min="0.5"
              max="1.0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current PF from your utility bill (0.5 - 1.0)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Power Factor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={targetPF}
              onChange={(e) => setTargetPF(parseFloat(e.target.value) || 0)}
              placeholder="0.95"
              step="0.01"
              min={currentPF}
              max="1.0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Target PF after correction (must be &gt; current PF)
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <strong>Power Factor Correction:</strong> Improving your power factor reduces billed kVA
            while maintaining the same kW. This is the first lever for reducing demand charges.
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            className="btn-primary flex items-center gap-2"
          >
            Continue
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

