'use client'

// Commercial Step 3: Battery Specifications

import { useState } from 'react'
import { ArrowRight, Info } from 'lucide-react'

interface StepCommercialBatteryProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
}

export function StepCommercialBattery({ data, onComplete, onBack }: StepCommercialBatteryProps) {
  const [batteryCRate, setBatteryCRate] = useState<number>(
    data.batteryCRate || 0.5
  )
  const [roundTripEff, setRoundTripEff] = useState<number>(
    data.roundTripEff || 0.9
  )
  const [usableDOD, setUsableDOD] = useState<number>(
    data.usableDOD || 0.9
  )

  // Calculate example for user understanding
  const exampleKW = 100
  const exampleKWhByPower = exampleKW / batteryCRate
  const exampleKWhByEnergy = exampleKW * (60 / 60) / (roundTripEff * usableDOD)

  const handleContinue = () => {
    if (batteryCRate < 0.1 || batteryCRate > 2.0) {
      alert('C-rate must be between 0.1 and 2.0')
      return
    }
    if (roundTripEff < 0.5 || roundTripEff > 1.0) {
      alert('Round-trip efficiency must be between 0.5 and 1.0')
      return
    }
    if (usableDOD < 0.5 || usableDOD > 1.0) {
      alert('Usable depth of discharge must be between 0.5 and 1.0')
      return
    }

    onComplete({
      batteryCRate,
      roundTripEff,
      usableDOD,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Battery Specifications
        </h1>
        <p className="text-gray-600">
          Configure battery performance parameters for accurate sizing
        </p>
      </div>

      <div className="card space-y-6">
        {/* C-Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Battery C-Rate <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={batteryCRate}
              onChange={(e) => setBatteryCRate(parseFloat(e.target.value) || 0)}
              placeholder="0.5"
              step="0.1"
              min="0.1"
              max="2.0"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500">C</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Charge/discharge rate. 0.5C = battery can discharge at 50% of its capacity per hour (2×kW per hour of energy)
          </p>
          <div className="mt-2 text-sm text-gray-600">
            <strong>Example:</strong> For {exampleKW} kW shave at {batteryCRate}C, 
            power constraint requires: {exampleKWhByPower.toFixed(1)} kWh
          </div>
        </div>

        {/* Round-Trip Efficiency */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Round-Trip Efficiency <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={roundTripEff}
              onChange={(e) => setRoundTripEff(parseFloat(e.target.value) || 0)}
              placeholder="0.90"
              step="0.01"
              min="0.5"
              max="1.0"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500">(0-1)</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Energy efficiency when charging and discharging (typically 0.85-0.95 for lithium-ion)
          </p>
        </div>

        {/* Usable Depth of Discharge */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Usable Depth of Discharge (DoD) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={usableDOD}
              onChange={(e) => setUsableDOD(parseFloat(e.target.value) || 0)}
              placeholder="0.90"
              step="0.01"
              min="0.5"
              max="1.0"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500">(0-1)</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Percentage of battery capacity that can be safely used (typically 0.80-0.95)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <strong>Battery Sizing:</strong> The system will size the battery based on both energy needs
            (peak duration) and power needs (C-rate). The larger requirement will be used.
          </div>
        </div>

        {/* Calculation Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Sizing Formula Preview:</div>
          <div className="text-xs text-gray-600 space-y-1 font-mono">
            <div>Energy needed = Shave_kW × (Duration_min / 60)</div>
            <div>Power required = Shave_kW / C_rate</div>
            <div>Nameplate = max(Energy_needed, Power_required) / (Efficiency × DoD)</div>
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

