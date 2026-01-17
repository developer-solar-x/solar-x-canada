'use client'

// Step 3: Results Preview
// Show instant estimate results with key metrics

import { useState, useEffect } from 'react'
import { Sun, DollarSign, Leaf, TrendingUp, Loader2, Zap, Calendar, PiggyBank } from 'lucide-react'
import type { QuickEstimateData } from '@/app/quick-estimate/page'

interface StepResultsPreviewProps {
  data: QuickEstimateData
  onComplete: (data: Partial<QuickEstimateData>) => void
  onBack?: () => void
}

export function StepResultsPreview({ data, onComplete, onBack }: StepResultsPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState<QuickEstimateData['estimate'] | null>(data.estimate || null)

  // Fetch estimate on mount
  useEffect(() => {
    if (estimate) {
      setLoading(false)
      return
    }

    const fetchEstimate = async () => {
      try {
        const response = await fetch('/api/quick-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: data.coordinates,
            roofAreaSqft: data.roofAreaSqft,
            shadingLevel: data.shadingLevel,
            roofAzimuth: data.roofAzimuth,
            annualUsageKwh: data.annualUsageKwh,
            monthlyBill: data.monthlyBill,
            province: data.province,
            programType: data.programType || 'quick',
            hasBattery: data.hasBattery || false,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate estimate')
        }

        const result = await response.json()
        if (result.success && result.data) {
          setEstimate(result.data)
        } else {
          throw new Error(result.error || 'Unknown error')
        }
      } catch (err) {
        console.error('Estimate error:', err)
        setError('Failed to calculate estimate. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchEstimate()
  }, [data, estimate])

  const handleContinue = () => {
    if (estimate) {
      onComplete({ estimate })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sun className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-navy-500 mb-4">
            Calculating Your Solar Estimate
          </h2>
          <p className="text-gray-600 mb-8">
            Analyzing solar potential for your location...
          </p>
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-red-500" size={48} />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !estimate) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-navy-500 mb-4">
            Something Went Wrong
          </h2>
          <p className="text-gray-600 mb-8">
            {error || 'Unable to calculate your estimate. Please try again.'}
          </p>
          <button
            onClick={onBack}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Results Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sun className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Your Solar Estimate
        </h1>
        <p className="text-gray-600">
          Based on your location at {data.address?.split(',')[0]}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* System Size */}
        <div className="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="text-white" size={24} />
          </div>
          <p className="text-sm text-blue-600 font-medium mb-1">System Size</p>
          <p className="text-3xl font-bold text-blue-700">{estimate.systemSizeKw} kW</p>
          <p className="text-xs text-blue-500 mt-1">{estimate.numPanels} panels</p>
        </div>

        {/* Annual Production */}
        <div className="card p-6 text-center bg-gradient-to-br from-yellow-50 to-orange-100 border-orange-200">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sun className="text-white" size={24} />
          </div>
          <p className="text-sm text-orange-600 font-medium mb-1">Annual Production</p>
          <p className="text-3xl font-bold text-orange-700">{estimate.annualProductionKwh.toLocaleString()}</p>
          <p className="text-xs text-orange-500 mt-1">kWh per year</p>
        </div>

        {/* Annual Savings */}
        <div className="card p-6 text-center bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="text-white" size={24} />
          </div>
          <p className="text-sm text-green-600 font-medium mb-1">Annual Savings</p>
          <p className="text-3xl font-bold text-green-700">${estimate.annualSavings.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">${Math.round(estimate.monthlySavings)}/month</p>
        </div>

        {/* Payback */}
        <div className="card p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="text-white" size={24} />
          </div>
          <p className="text-sm text-purple-600 font-medium mb-1">Payback Period</p>
          <p className="text-3xl font-bold text-purple-700">{estimate.paybackYears}</p>
          <p className="text-xs text-purple-500 mt-1">years</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-navy-500 mb-4 flex items-center gap-2">
          <PiggyBank size={20} />
          Cost Estimate
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Estimated Total Cost</p>
            <p className="text-2xl font-bold text-gray-400 line-through">
              ${estimate.estimatedCost.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-sm text-green-600 mb-1">After Incentives</p>
            <p className="text-2xl font-bold text-green-700">
              ${estimate.netCost.toLocaleString()}
            </p>
            <p className="text-xs text-green-500 mt-1">
              Save ${(estimate.estimatedCost - estimate.netCost).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">25-Year Savings</p>
            <p className="text-2xl font-bold text-blue-700">
              ${(estimate.annualSavings * 25).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="card p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
          <Leaf size={20} />
          Environmental Impact
        </h3>
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{estimate.co2OffsetTons}</p>
            <p className="text-sm text-green-700">tons CO2/year offset</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{Math.round(estimate.co2OffsetTons * 24)}</p>
            <p className="text-sm text-green-700">trees equivalent</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{(estimate.co2OffsetTons / 4.6).toFixed(1)}</p>
            <p className="text-sm text-green-700">cars off road/year</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="card p-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-center">
        <h3 className="text-xl font-bold mb-2">
          Ready to Get Started?
        </h3>
        <p className="text-red-100 mb-6">
          Get your detailed quote with custom financing options
        </p>
        <div className="flex gap-4 justify-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors"
          >
            Get My Free Quote
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center mt-6">
        * This is an estimate based on the information provided. Actual costs and savings may vary based on site assessment, local rates, and available incentives.
      </p>
    </div>
  )
}
