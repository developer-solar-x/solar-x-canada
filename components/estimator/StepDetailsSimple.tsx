'use client'

// Easy Mode: Simplified Property Details

import { useState } from 'react'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { ROOF_ORIENTATIONS } from '@/lib/roof-calculations'

interface StepDetailsSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

const ROOF_TYPES = [
  { id: 'asphalt_shingle', label: 'Asphalt Shingle', description: 'Most common' },
  { id: 'metal', label: 'Metal', description: 'Long-lasting' },
  { id: 'tile', label: 'Tile', description: 'Clay or concrete' },
  { id: 'other', label: 'Other', description: 'Not sure' },
]

const ROOF_CONDITIONS = [
  { id: '0-5', label: 'New', range: '0-5 years', color: 'green' },
  { id: '6-15', label: 'Good', range: '5-15 years', color: 'blue' },
  { id: '16+', label: 'Needs Work', range: '15+ years', color: 'yellow' },
]

const SHADE_LEVELS = [
  { id: 'none', label: 'No Shade', icon: '🌞', description: 'Full sun all day' },
  { id: 'minimal', label: 'Mostly Sunny', icon: '☀️', description: 'Little shade' },
  { id: 'partial', label: 'Partial Shade', icon: '⛅', description: 'Some trees nearby' },
  { id: 'significant', label: 'Heavy Shade', icon: '☁️', description: 'Lots of trees/buildings' },
]

export function StepDetailsSimple({ data, onComplete, onBack, onUpgradeMode }: StepDetailsSimpleProps) {
  const [roofType, setRoofType] = useState<string>(data.roofType || 'asphalt_shingle')
  const [roofCondition, setRoofCondition] = useState<string>(data.roofAge || '6-15')
  const [shadeLevel, setShadeLevel] = useState<string>(data.shadingLevel || 'minimal')
  const [roofOrientation, setRoofOrientation] = useState<number>(data.roofAzimuth || 180)

  const handleContinue = () => {
    onComplete({
      roofType,
      roofAge: roofCondition,
      shadingLevel: shadeLevel,
      roofPitch: 'medium', // Default for easy mode
      roofAzimuth: roofOrientation, // Include roof orientation
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-navy-500 mb-2">
            A Few Quick Questions
          </h2>
          <p className="text-gray-600">
            Help us understand your property better
          </p>
        </div>

        {/* Roof Type */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            What type of roof do you have?
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {ROOF_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setRoofType(type.id)}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  roofType === type.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="font-semibold text-navy-500">{type.label}</div>
                <div className="text-xs text-gray-600">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Roof Condition */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            What's the condition of your roof?
          </label>
          <div className="grid sm:grid-cols-3 gap-3">
            {ROOF_CONDITIONS.map((condition) => (
              <button
                key={condition.id}
                onClick={() => setRoofCondition(condition.id)}
                className={`p-4 border-2 rounded-lg transition-all text-center ${
                  roofCondition === condition.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="font-semibold text-navy-500 mb-1">{condition.label}</div>
                <div className="text-xs text-gray-600">{condition.range}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Not sure? Choose "Good" - we'll verify during site visit
          </p>
        </div>

        {/* Shade Level */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            How much shade does your roof get?
          </label>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {SHADE_LEVELS.map((shade) => (
              <button
                key={shade.id}
                onClick={() => setShadeLevel(shade.id)}
                className={`p-4 border-2 rounded-lg transition-all text-center ${
                  shadeLevel === shade.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="text-3xl mb-2">{shade.icon}</div>
                <div className="font-semibold text-navy-500 text-sm">{shade.label}</div>
                <div className="text-xs text-gray-600 mt-1">{shade.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Roof Orientation */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Which direction does your roof face?
          </label>
          <p className="text-xs text-gray-600 mb-3">
            This affects how much solar energy your panels can capture
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ROOF_ORIENTATIONS.slice(0, 4).map((orientation) => (
              <button
                key={orientation.value}
                onClick={() => setRoofOrientation(orientation.azimuth)}
                className={`p-3 border-2 rounded-lg transition-all text-center ${
                  roofOrientation === orientation.azimuth
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
          <p className="text-xs text-gray-500 mt-2">
            South-facing roofs get the most sun in Canada
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Good news!</strong> We'll verify all these details during your free site assessment, so don't worry about being exact.
          </p>
        </div>

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-navy-500 mb-1 text-sm">Want to provide more details?</h4>
                <p className="text-xs text-gray-700 mb-2">
                  Switch to detailed mode for precise specifications
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
            className="btn-primary flex-1"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

