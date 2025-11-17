'use client'

// Commercial Step 2: Peak Shaving Strategy

import { useState } from 'react'
import { ArrowRight, Info } from 'lucide-react'

interface StepCommercialPeakShavingProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
}

export function StepCommercialPeakShaving({ data, onComplete, onBack }: StepCommercialPeakShavingProps) {
  const [strategy, setStrategy] = useState<'targetCap' | 'shaveKW'>(
    data.targetCapKW !== undefined ? 'targetCap' : 'shaveKW'
  )
  const [targetCapKW, setTargetCapKW] = useState<number>(
    data.targetCapKW || 0
  )
  const [shaveKW, setShaveKW] = useState<number>(
    data.shaveKW || 0
  )
  const [peakDurationMin, setPeakDurationMin] = useState<number>(
    data.peakDurationMin || 15
  )

  // Calculate kW1 (after PF correction) for reference
  // If billing is "Per kW", input is kW; otherwise it's kVA
  let kW1: number;
  if (data.billingMethod === 'Per kW') {
    kW1 = data.measuredPeakKVA || 0; // Input is already kW
  } else {
    kW1 = (data.measuredPeakKVA || 0) * (data.currentPF || 0.9); // Convert kVA to kW
  }
  const suggestedCap = Math.max(0, kW1 - 50) // Suggest shaving at least 50 kW

  const handleContinue = () => {
    if (strategy === 'targetCap') {
      if (!targetCapKW || targetCapKW <= 0) {
        alert('Please enter a target cap kW')
        return
      }
      if (targetCapKW >= kW1) {
        alert('Target cap must be less than kW after PF correction')
        return
      }
    } else {
      if (!shaveKW || shaveKW <= 0) {
        alert('Please enter shave kW amount')
        return
      }
      if (shaveKW > kW1) {
        alert('Shave kW cannot exceed kW after PF correction')
        return
      }
    }

    if (peakDurationMin < 5 || peakDurationMin > 480) {
      alert('Peak duration must be between 5 and 480 minutes')
      return
    }

    onComplete({
      targetCapKW: strategy === 'targetCap' ? targetCapKW : undefined,
      shaveKW: strategy === 'shaveKW' ? shaveKW : undefined,
      peakDurationMin,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Peak Shaving Strategy
        </h1>
        <p className="text-gray-600">
          Define how much peak demand you want to shave with battery storage
        </p>
      </div>

      <div className="card space-y-6">
        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Strategy <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setStrategy('targetCap')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                strategy === 'targetCap'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-navy-500 mb-1">Target Cap (kW)</div>
              <div className="text-sm text-gray-600">
                Set a maximum kW target after shaving
              </div>
            </button>
            <button
              onClick={() => setStrategy('shaveKW')}
              className={`p-4 rounded-lg border-2 transition-all ${
                strategy === 'shaveKW'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-navy-500 mb-1">Shave Amount (kW)</div>
              <div className="text-sm text-gray-600">
                Specify exact kW to shave from peak
              </div>
            </button>
          </div>
        </div>

        {/* Target Cap Input */}
        {strategy === 'targetCap' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Cap (kW) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetCapKW || ''}
                onChange={(e) => setTargetCapKW(parseFloat(e.target.value) || 0)}
                placeholder={`Suggested: ${suggestedCap.toFixed(0)}`}
                step="0.1"
                min="0"
                max={kW1}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-500">kW</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum kW after PF correction and shaving. Current kW after PF: {kW1.toFixed(1)} kW
            </p>
          </div>
        )}

        {/* Shave kW Input */}
        {strategy === 'shaveKW' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shave Amount (kW) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={shaveKW || ''}
                onChange={(e) => setShaveKW(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 50"
                step="0.1"
                min="0"
                max={kW1}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-500">kW</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Amount of kW to shave from peak. Maximum: {kW1.toFixed(1)} kW (after PF correction)
            </p>
          </div>
        )}

        {/* Peak Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Peak Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={peakDurationMin}
              onChange={(e) => setPeakDurationMin(parseInt(e.target.value) || 15)}
              placeholder="15"
              step="15"
              min="5"
              max="480"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500">minutes</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            How long the peak event typically lasts (5-480 minutes). Green Button upload can auto-detect this.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <strong>Peak Shaving:</strong> Battery storage reduces your peak demand by discharging during
            high-demand periods. Longer peaks require more battery energy capacity.
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

