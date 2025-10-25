'use client'

// Step 3: Property details form

import { useState } from 'react'

interface StepDetailsProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export function StepDetails({ data, onComplete, onBack }: StepDetailsProps) {
  const [formData, setFormData] = useState({
    roofType: data.roofType || 'asphalt_shingle',
    roofAge: data.roofAge || '0-5',
    roofPitch: data.roofPitch || 'medium',
    shadingLevel: data.shadingLevel || 'minimal',
    monthlyBill: data.monthlyBill || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete(formData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-8">
        <h2 className="text-3xl font-bold text-navy-500 mb-8">Property Details</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Roof Details */}
          <div>
            <h3 className="text-xl font-semibold text-navy-500 mb-4">Roof Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Roof Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roof Type
                </label>
                <select
                  value={formData.roofType}
                  onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                >
                  <option value="asphalt_shingle">Asphalt Shingle</option>
                  <option value="metal">Metal</option>
                  <option value="tile">Tile</option>
                  <option value="flat">Flat</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Roof Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roof Age
                </label>
                <select
                  value={formData.roofAge}
                  onChange={(e) => setFormData({ ...formData, roofAge: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                >
                  <option value="0-5">0-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="11-20">11-20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>

              {/* Roof Pitch */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roof Pitch
                </label>
                <select
                  value={formData.roofPitch}
                  onChange={(e) => setFormData({ ...formData, roofPitch: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                >
                  <option value="flat">Flat (0-10°)</option>
                  <option value="low">Low (10-20°)</option>
                  <option value="medium">Medium (20-40°)</option>
                  <option value="steep">Steep (40°+)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Not sure? Choose 'Medium' - we'll verify during site visit
                </p>
              </div>

              {/* Shading */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shading Level
                </label>
                <select
                  value={formData.shadingLevel}
                  onChange={(e) => setFormData({ ...formData, shadingLevel: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                >
                  <option value="minimal">Minimal</option>
                  <option value="partial">Partial</option>
                  <option value="significant">Significant</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Energy Usage Verification */}
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
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-4 pt-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="btn-outline border-gray-300 text-gray-700 flex-1"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

