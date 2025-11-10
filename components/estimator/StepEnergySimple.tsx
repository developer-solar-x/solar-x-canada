'use client'

// Easy Mode: Simple Energy Calculator

import { useEffect, useState } from 'react'
import { Gauge, DollarSign, Zap, ArrowRight, Battery, Sun } from 'lucide-react'

interface StepEnergySimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

export function StepEnergySimple({ data, onComplete, onBack, onUpgradeMode }: StepEnergySimpleProps) {
  const [annualUsageInput, setAnnualUsageInput] = useState<string>(
    data.energyUsage?.annualKwh?.toString() ||
      data.annualUsageKwh?.toString() ||
      ''
  )
  const [monthlyBillInput, setMonthlyBillInput] = useState<string>(data.monthlyBill?.toString() || '')
  const [useMonthlyBill, setUseMonthlyBill] = useState<boolean>(Boolean(data.monthlyBill && Number(data.monthlyBill) > 0))
  const [planType, setPlanType] = useState<'battery'>('battery')
  const blendedRate = 0.223 // 22.3¢/kWh blended rate (energy + delivery + regulatory + HST)
  const estimatedAnnualKwh = useMonthlyBill && monthlyBillInput
    ? Math.round((parseFloat(monthlyBillInput) / blendedRate) * 12)
    : 0

  // Pre-fill annual usage with our best estimate if the field is empty
  useEffect(() => {
    if (useMonthlyBill) {
      if ((!annualUsageInput || Number(annualUsageInput) === 0) && estimatedAnnualKwh > 0) {
        setAnnualUsageInput(String(estimatedAnnualKwh))
      }
    }
  }, [estimatedAnnualKwh, annualUsageInput, useMonthlyBill])

  const parsedAnnualUsage = parseFloat(annualUsageInput)
  const manualAnnualUsage = !useMonthlyBill && Number.isFinite(parsedAnnualUsage) && parsedAnnualUsage > 0
    ? Math.round(parsedAnnualUsage)
    : 0
  const finalAnnualUsage = (manualAnnualUsage > 0 ? manualAnnualUsage : estimatedAnnualKwh) || Math.round(parsedAnnualUsage) || 0

  const handleContinue = () => {
    const annualUsageKwh = Math.max(0, finalAnnualUsage)

    onComplete({
      monthlyBill: useMonthlyBill && monthlyBillInput ? parseFloat(monthlyBillInput) : undefined,
      systemType: planType === 'battery' ? 'battery_system' : 'grid_tied',
      hasBattery: planType === 'battery',
      annualUsageKwh: annualUsageKwh || undefined,
      energyUsage: annualUsageKwh
        ? {
            annualKwh: annualUsageKwh,
            monthlyKwh: Math.round(annualUsageKwh / 12),
            dailyKwh: Math.round(annualUsageKwh / 365),
          }
        : undefined,
      energyEntryMethod: 'simple',
    })
  }

  const canContinue = finalAnnualUsage > 0 && Boolean(planType)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-navy-500 mb-2">
            Energy Usage
          </h2>
          <p className="text-gray-600">
            Just a couple quick questions about your electricity
          </p>
        </div>

        {/* Input Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setUseMonthlyBill(false)}
            className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
              !useMonthlyBill ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-600 hover:border-red-300'
            }`}
          >
            Enter annual usage
          </button>
          <button
            type="button"
            onClick={() => setUseMonthlyBill(true)}
            className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
              useMonthlyBill ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-600 hover:border-red-300'
            }`}
          >
            I only know my bill
          </button>
        </div>

        {/* Plan selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Which system are you interested in?
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-left opacity-70 cursor-not-allowed">
              <div className="p-3 rounded-lg bg-gray-200">
                <Sun size={24} className="text-gray-500" />
              </div>
              <div>
                <div className="font-semibold text-gray-500">Solar Only (Net Metering)</div>
                <p className="text-xs text-gray-500 mt-1">
                  Coming soon. Quick Estimate currently supports the solar + battery path.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlanType('battery')}
              className={`flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${
                planType === 'battery' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className={`p-3 rounded-lg ${planType === 'battery' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                <Battery size={24} className={planType === 'battery' ? 'text-white' : 'text-gray-500'} />
              </div>
              <div>
                <div className="font-semibold text-navy-500">Solar + Battery (Peak Shaving)</div>
                <p className="text-xs text-gray-600 mt-1">
                  Add a battery to shift usage out of expensive hours and keep essentials running during outages.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Annual Usage */}
        {!useMonthlyBill && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What's your annual electricity usage? * (kWh)
            </label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={annualUsageInput}
                onChange={(e) => setAnnualUsageInput(e.target.value)}
                placeholder="e.g., 12000"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Grab the annual total from your utility summary. Switch to the bill tab if you only know the dollar amount.
            </p>
          </div>
        )}

        {/* Monthly Bill */}
        {useMonthlyBill && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What's your average monthly electric bill?
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={monthlyBillInput}
                onChange={(e) => setMonthlyBillInput(e.target.value)}
                placeholder="e.g., 180"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              We convert your monthly bill to kWh using a blended 22¢/kWh rate (energy + delivery + HST).
            </p>
          </div>
        )}

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-navy-500 mb-1 text-sm">Need more precision?</h4>
                <p className="text-xs text-gray-700 mb-2">
                  Switch to detailed mode for more accurate property details and roof drawing
                </p>
                <button
                  onClick={onUpgradeMode}
                  className="text-sm text-navy-600 hover:underline font-semibold flex items-center gap-1"
                >
                  Switch to Detailed Mode
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-outline border-gray-300 text-gray-700 flex-1"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

