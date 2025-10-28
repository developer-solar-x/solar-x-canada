'use client'

// Step 3: Property details form

import { useState } from 'react'
import { Info, Home } from 'lucide-react'
import { ROOF_ORIENTATIONS, getDirectionLabel, getOrientationEfficiency, calculateRoofAzimuth } from '@/lib/roof-calculations'
import * as turf from '@turf/turf'

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
    roofAzimuth: data.roofAzimuth || 180, // Default to south if not detected
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete(formData)
  }

  // Calculate if multiple sections
  const hasMultipleSections = data.roofPolygon?.features && data.roofPolygon.features.length > 1

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-8">
        <h2 className="text-3xl font-bold text-navy-500 mb-8">Property Details</h2>

        {/* Roof Summary Card - show area and sections */}
        {data.roofAreaSqft && (
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Home className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-navy-500 mb-2">Your Roof</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Area:</span>
                    <span className="ml-2 font-bold text-navy-500">
                      {data.roofAreaSqft.toLocaleString()} sq ft
                    </span>
                  </div>
                  {hasMultipleSections && (
                    <div>
                      <span className="text-gray-600">Sections:</span>
                      <span className="ml-2 font-bold text-blue-600">
                        {data.roofPolygon.features.length} roof sections
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Section breakdown for multiple polygons */}
                {hasMultipleSections && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Section Details:</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {data.roofPolygon.features.map((feature: any, index: number) => {
                        if (feature.geometry.type !== 'Polygon') return null
                        
                        // Use manually corrected orientation from roofSections if available
                        // Otherwise calculate from polygon geometry
                        let direction, efficiency, areaSqFt
                        
                        if (data.roofSections && data.roofSections[index]) {
                          // Use corrected data from user edits
                          const section = data.roofSections[index]
                          direction = section.direction
                          efficiency = section.efficiency
                          areaSqFt = section.area
                        } else {
                          // Calculate from polygon (legacy or uncorrected)
                          const areaMeters = turf.area(feature)
                          areaSqFt = Math.round(areaMeters * 10.764)
                          const azimuth = calculateRoofAzimuth(feature)
                          direction = getDirectionLabel(azimuth)
                          efficiency = getOrientationEfficiency(azimuth)
                        }
                        
                        return (
                          <div key={index} className="text-xs bg-white/60 rounded px-2 py-1">
                            <span className="font-medium text-navy-500">Section {index + 1}:</span>
                            <span className="ml-1 text-gray-600">
                              {areaSqFt.toLocaleString()} sq ft • {direction} ({efficiency}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                  <option value="none">None (Full sun all day)</option>
                  <option value="minimal">Minimal (Mostly sunny)</option>
                  <option value="partial">Partial (Some shade)</option>
                  <option value="significant">Significant (Heavy shade)</option>
                </select>
              </div>
            </div>

            {/* Roof Orientation - only show if not already detected from polygon AND single section */}
            {!data.roofAzimuth && !hasMultipleSections && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Roof Orientation (Direction it Faces)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Which direction does your roof face? This affects solar production.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ROOF_ORIENTATIONS.map((orientation) => (
                    <button
                      key={orientation.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, roofAzimuth: orientation.azimuth })}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        formData.roofAzimuth === orientation.azimuth
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{orientation.icon}</div>
                      <div className="font-semibold text-xs">{orientation.label}</div>
                      <div className="text-xs text-gray-600">{orientation.efficiency}%</div>
                      {orientation.value === 'south' && (
                        <div className="text-xs text-green-600 mt-1 font-medium">Best</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show detected orientation if available AND single section */}
            {data.roofAzimuth && !hasMultipleSections && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-navy-500">
                      Roof Orientation: {getDirectionLabel(data.roofAzimuth)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Detected from your roof drawing. {getOrientationEfficiency(data.roofAzimuth)}% of optimal production.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Info note for multiple sections */}
            {hasMultipleSections && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="text-gray-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-gray-600">
                    Each roof section has its own orientation which has been automatically detected and is shown in the summary above. 
                    The solar estimate will account for all sections and their individual orientations.
                  </p>
                </div>
              </div>
            )}
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

