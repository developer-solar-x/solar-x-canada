'use client'

// Easy Mode: Simple Energy Calculator

import { useState } from 'react'
import { DollarSign, Home, Zap, ArrowRight } from 'lucide-react'

interface StepEnergySimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

const HOME_SIZES = [
  { id: '1-2br', label: '1-2 Bedrooms', size: '< 1,500 sq ft', avgKwh: 8000 },
  { id: '3-4br', label: '3-4 Bedrooms', size: '1,500 - 2,500 sq ft', avgKwh: 12000 },
  { id: '5+br', label: '5+ Bedrooms', size: '> 2,500 sq ft', avgKwh: 18000 },
]

const SPECIAL_APPLIANCES = [
  { id: 'ev', label: 'Electric Vehicle', icon: '🚗', addKwh: 3600 },
  { id: 'pool', label: 'Pool / Hot Tub', icon: '🏊', addKwh: 2400 },
  { id: 'ac', label: 'Central A/C', icon: '❄️', addKwh: 3000 },
]

export function StepEnergySimple({ data, onComplete, onBack, onUpgradeMode }: StepEnergySimpleProps) {
  const [monthlyBill, setMonthlyBill] = useState<string>(data.monthlyBill?.toString() || '')
  const [homeSize, setHomeSize] = useState<string>(data.homeSize || '')
  const [specialAppliances, setSpecialAppliances] = useState<string[]>(data.specialAppliances || [])

  const toggleAppliance = (id: string) => {
    if (specialAppliances.includes(id)) {
      setSpecialAppliances(specialAppliances.filter(a => a !== id))
    } else {
      setSpecialAppliances([...specialAppliances, id])
    }
  }

  const calculateEstimatedUsage = () => {
    const homeSizeData = HOME_SIZES.find(h => h.id === homeSize)
    if (!homeSizeData) return 0

    let total = homeSizeData.avgKwh
    specialAppliances.forEach(appId => {
      const app = SPECIAL_APPLIANCES.find(a => a.id === appId)
      if (app) total += app.addKwh
    })
    return total
  }

  const estimatedAnnualKwh = calculateEstimatedUsage()

  const handleContinue = () => {
    onComplete({
      monthlyBill: parseFloat(monthlyBill),
      homeSize,
      specialAppliances,
      energyUsage: {
        annualKwh: estimatedAnnualKwh,
        monthlyKwh: Math.round(estimatedAnnualKwh / 12),
        dailyKwh: Math.round(estimatedAnnualKwh / 365),
      },
      energyEntryMethod: 'simple',
    })
  }

  const canContinue = !!monthlyBill && parseFloat(monthlyBill) > 0 && !!homeSize

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

        {/* Monthly Bill */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What's your average monthly electric bill? *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="number"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
              placeholder="e.g., 150"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-lg"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Check a recent electricity bill or estimate your average
          </p>
        </div>

        {/* Home Size */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Home size: *
          </label>
          <div className="grid sm:grid-cols-3 gap-3">
            {HOME_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setHomeSize(size.id)}
                className={`p-4 border-2 rounded-lg transition-all text-center ${
                  homeSize === size.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <Home className={`mx-auto mb-2 ${homeSize === size.id ? 'text-red-500' : 'text-gray-400'}`} size={24} />
                <div className="font-semibold text-navy-500 text-sm">{size.label}</div>
                <div className="text-xs text-gray-600 mt-1">{size.size}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Special Appliances */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Do you have any of these? (Optional)
          </label>
          <div className="grid sm:grid-cols-3 gap-3">
            {SPECIAL_APPLIANCES.map((app) => (
              <button
                key={app.id}
                onClick={() => toggleAppliance(app.id)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  specialAppliances.includes(app.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-2">{app.icon}</div>
                <div className="text-sm font-semibold text-navy-500">{app.label}</div>
                {specialAppliances.includes(app.id) && (
                  <div className="text-xs text-blue-600 mt-1 font-semibold">Selected</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Usage */}
        {homeSize && (
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-navy-500 mb-3">Estimated Annual Usage</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{Math.round(estimatedAnnualKwh / 365)}</div>
                <div className="text-xs text-gray-600">kWh / day</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-teal-600">{Math.round(estimatedAnnualKwh / 12).toLocaleString()}</div>
                <div className="text-xs text-gray-600">kWh / month</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-navy-600">{estimatedAnnualKwh.toLocaleString()}</div>
                <div className="text-xs text-gray-600">kWh / year</div>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-navy-500 mb-1 text-sm">Need more precision?</h4>
                <p className="text-xs text-gray-700 mb-2">
                  Switch to detailed mode for appliance-by-appliance analysis
                </p>
                <button
                  onClick={onUpgradeMode}
                  className="text-sm text-navy-600 hover:underline font-semibold flex items-center gap-1"
                >
                  Use Appliance Calculator
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

