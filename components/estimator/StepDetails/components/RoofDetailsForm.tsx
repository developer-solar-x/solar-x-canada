'use client'

import { Info } from 'lucide-react'
import { ROOF_ORIENTATIONS, getDirectionLabel, getOrientationEfficiency } from '@/lib/roof-calculations'
import type { RoofDetailsFormProps } from '../types'

export function RoofDetailsForm({ formData, setFormData, data }: RoofDetailsFormProps) {
  const hasMultipleSections = data.roofPolygon?.features && data.roofPolygon.features.length > 1

  return (
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
            <option value="asphalt_shingle">Shingles</option>
            <option value="metal">Metal</option>
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
  )
}

