'use client'

// Commercial Step 4: Costs & Rebate

import { useState } from 'react'
import { ArrowRight, Info } from 'lucide-react'

interface StepCommercialCostsProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
}

export function StepCommercialCosts({ data, onComplete, onBack }: StepCommercialCostsProps) {
  const [installedCostTotal, setInstalledCostTotal] = useState<number>(
    data.installedCostTotal || 0
  )
  const [solarACElligibleKW, setSolarACElligibleKW] = useState<number>(
    data.solarACElligibleKW || 0
  )
  const [rebateRatePerKW, setRebateRatePerKW] = useState<number>(
    data.rebateRatePerKW || 860
  )
  const [rebateCapDollar, setRebateCapDollar] = useState<number>(
    data.rebateCapDollar || 860000
  )
  const [applySolar50Cap, setApplySolar50Cap] = useState<boolean>(
    data.applySolar50Cap || false
  )
  const [solarOnlyCost, setSolarOnlyCost] = useState<number>(
    data.solarOnlyCost || 0
  )
  const [analysisYears, setAnalysisYears] = useState<number>(
    data.analysisYears || 25
  )
  const [annualEscalator, setAnnualEscalator] = useState<number>(
    data.annualEscalator || 0.02
  )

  const handleContinue = () => {
    if (!installedCostTotal || installedCostTotal <= 0) {
      alert('Please enter total installed cost')
      return
    }
    if (!solarACElligibleKW || solarACElligibleKW <= 0) {
      alert('Please enter solar AC eligible kW')
      return
    }
    if (applySolar50Cap && (!solarOnlyCost || solarOnlyCost <= 0)) {
      alert('Please enter solar-only cost when 50% cap is enabled')
      return
    }
    if (analysisYears < 1 || analysisYears > 50) {
      alert('Analysis years must be between 1 and 50')
      return
    }
    if (annualEscalator < 0 || annualEscalator > 0.1) {
      alert('Annual escalator must be between 0 and 0.1 (0-10%)')
      return
    }

    onComplete({
      installedCostTotal,
      solarACElligibleKW,
      rebateRatePerKW,
      rebateCapDollar,
      applySolar50Cap,
      solarOnlyCost: applySolar50Cap ? solarOnlyCost : undefined,
      analysisYears,
      annualEscalator,
    })
  }

  // Calculate rebate preview
  const baseRebate = solarACElligibleKW * rebateRatePerKW
  const rebateAfterCap = Math.min(baseRebate, rebateCapDollar)
  const rebateFinal = applySolar50Cap && solarOnlyCost > 0
    ? Math.min(rebateAfterCap, 0.5 * solarOnlyCost)
    : rebateAfterCap
  const netCost = installedCostTotal - rebateFinal

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Costs & Rebate Information
        </h1>
        <p className="text-gray-600">
          Enter installation costs and rebate details
        </p>
      </div>

      <div className="card space-y-6">
        {/* Installed Cost */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Total Installed Cost <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={installedCostTotal || ''}
              onChange={(e) => setInstalledCostTotal(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 500000"
              step="1000"
              min="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Total cost including solar, battery, BOS, and installation
          </p>
        </div>

        {/* Solar AC Eligible kW */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Solar AC Eligible Capacity (kW) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={solarACElligibleKW || ''}
              onChange={(e) => setSolarACElligibleKW(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 500"
              step="0.1"
              min="0"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500">kW</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            AC capacity eligible for rebate
          </p>
        </div>

        {/* Rebate Rate */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rebate Rate ($/kW)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={rebateRatePerKW}
                onChange={(e) => setRebateRatePerKW(parseFloat(e.target.value) || 860)}
                placeholder="860"
                step="1"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rebate Cap ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={rebateCapDollar}
                onChange={(e) => setRebateCapDollar(parseFloat(e.target.value) || 860000)}
                placeholder="860000"
                step="1000"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 50% Solar Cap */}
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={applySolar50Cap}
              onChange={(e) => setApplySolar50Cap(e.target.checked)}
              className="w-5 h-5 text-red-500 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Apply 50% Solar-Only Cost Cap
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-8">
            Limit rebate to 50% of solar-only cost (if applicable)
          </p>

          {applySolar50Cap && (
            <div className="mt-4 ml-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solar-Only Cost <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={solarOnlyCost || ''}
                  onChange={(e) => setSolarOnlyCost(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 300000"
                  step="1000"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Analysis Parameters */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Analysis Years
            </label>
            <input
              type="number"
              value={analysisYears}
              onChange={(e) => setAnalysisYears(parseInt(e.target.value) || 25)}
              placeholder="25"
              step="1"
              min="1"
              max="50"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Annual Escalator (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={annualEscalator * 100}
                onChange={(e) => setAnnualEscalator((parseFloat(e.target.value) || 0) / 100)}
                placeholder="2.0"
                step="0.1"
                min="0"
                max="10"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-500">%</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Annual rate increase for savings projection
            </p>
          </div>
        </div>

        {/* Rebate Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Rebate Calculation Preview:</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Base Rebate: ${baseRebate.toLocaleString()}</div>
            <div>After Cap: ${rebateAfterCap.toLocaleString()}</div>
            {applySolar50Cap && (
              <div>50% Solar Cap: ${(0.5 * (solarOnlyCost || 0)).toLocaleString()}</div>
            )}
            <div className="font-semibold text-navy-500 pt-2 border-t border-gray-300">
              Final Rebate: ${rebateFinal.toLocaleString()}
            </div>
            <div className="font-semibold text-navy-500">
              Net Installed Cost: ${netCost.toLocaleString()}
            </div>
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
            Calculate Results
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

